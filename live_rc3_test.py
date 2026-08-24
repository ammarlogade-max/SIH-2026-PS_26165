import json
import time
import urllib.request
import urllib.parse
import sys

BASE = 'http://localhost:3000'

def fetch_json(path, method='GET', data=None, headers=None):
    url = BASE + path
    req = urllib.request.Request(url, method=method)
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    if data is not None:
        body = data.encode('utf-8')
        req.data = body
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            text = raw.decode('utf-8', errors='replace')
            if not text:
                return resp.status, None, ''
            return resp.status, json.loads(text), text
    except urllib.error.HTTPError as exc:
        text = exc.read().decode('utf-8', errors='replace')
        try:
            j = json.loads(text)
        except Exception:
            j = None
        return exc.code, j, text
    except Exception as exc:
        return None, None, str(exc)

def print_section(title):
    print(f"\n{'=' * 20} {title} {'=' * 20}")

def run_test(name, func):
    print_section(name)
    try:
        func()
        print(f"[{name}] PASSED")
    except AssertionError as ae:
        print(f"[{name}] ASSERTION FAILED: {ae}")
        raise ae
    except Exception as exc:
        print(f"[{name}] ERROR: {type(exc).__name__}: {exc}")
        raise exc

if __name__ == '__main__':
    print("==========================================================")
    print("SIF SENTINEL (SIH26165) - OIL INDIA LIMITED TEST SUITE")
    print(f"BASE URL: {BASE}")
    print("==========================================================")

    created_report_ids = []

    def test_health():
        status, data, text = fetch_json('/api/health')
        print("Status code:", status)
        assert status == 200, f"Expected 200, got {status}"
        assert isinstance(data, dict), "Expected dict response"
        assert data.get("status") in ["healthy", "operational", "ok", True] or data.get("success") is True
        print("System Status:", data.get("status", "OK"))

    def test_metrics():
        status, data, text = fetch_json('/api/metrics')
        print("Status code:", status)
        assert status == 200, f"Expected 200, got {status}"
        assert data.get("success") is True, "Expected success: true"
        layerA = data.get("layerA")
        assert layerA is not None, "Missing layerA metrics"
        
        # Check Layer A mathematically computed metrics
        metrics = layerA.get("metrics")
        assert metrics is not None, "Missing metrics object in layerA"
        print(f"Layer A Precision: {metrics.get('precision')}%")
        print(f"Layer A Recall: {metrics.get('recall')}%")
        print(f"Layer A F1 Score: {metrics.get('f1_score')}%")
        print(f"Layer A ROC-AUC: {metrics.get('roc_auc')}")
        
        # Verify honesty of Layer B status
        layerB = data.get("layerB")
        assert layerB is not None, "Missing layerB status"
        assert layerB.get("status") == "not_started", f"Layer B should be not_started, got {layerB.get('status')}"
        print(f"Layer B Status: {layerB.get('status')} (Gated per specification)")

    def test_manual_ingest_sif_report():
        payload = {
            "raw_text": "Scaffolding crew erecting 4th level platform at 14 meters height on Rig 7 mast without attaching safety harness lanyard to lifeline.",
            "site": "Duliajan Rig 7",
            "activity": "Rig Mast Maintenance",
            "reported_date": "2026-08-23",
            "submitting_role": "HSE Officer"
        }
        status, data, text = fetch_json('/api/reports', method='POST', data=json.dumps(payload), headers={'Content-Type': 'application/json'})
        print("Status code:", status)
        assert status in [200, 201], f"Expected 200/201, got {status}"
        assert data.get("success") is True, "Expected success: true"
        report = data.get("report")
        assert report is not None, "Expected report object"
        created_report_ids.append(report.get("id"))
        
        classification = report.get("classification")
        assert classification is not None, "Expected classification on report"
        print(f"SIF Potential: {classification.get('is_sif_potential')}")
        print(f"Life-Saving Rule: {classification.get('life_saving_rule')}")
        print(f"Confidence: {classification.get('confidence')}%")
        print(f"Top Explainability Terms: {classification.get('reasoning_terms')}")
        
        assert classification.get("is_sif_potential") is True, "Expected SIF potential to be True"
        assert classification.get("life_saving_rule") == "Working at Height", f"Expected Working at Height, got {classification.get('life_saving_rule')}"

    def test_manual_ingest_non_sif_report():
        payload = {
            "raw_text": "Small oil drip tray under sample tap #4 has 20ml oily residue. Needs wiping with dry rag during end of shift cleaning.",
            "site": "Moran GGS",
            "activity": "Sampling Operations",
            "reported_date": "2026-08-23",
            "submitting_role": "Plant Operator"
        }
        status, data, text = fetch_json('/api/reports', method='POST', data=json.dumps(payload), headers={'Content-Type': 'application/json'})
        print("Status code:", status)
        assert status in [200, 201], f"Expected 200/201, got {status}"
        assert data.get("success") is True, "Expected success: true"
        report = data.get("report")
        assert report is not None, "Expected report object"
        
        classification = report.get("classification")
        assert classification is not None, "Expected classification on report"
        print(f"SIF Potential: {classification.get('is_sif_potential')}")
        print(f"Life-Saving Rule: {classification.get('life_saving_rule')}")
        assert classification.get("is_sif_potential") is False, "Expected SIF potential to be False for housekeeping log"

    def test_bulk_ingest():
        batch = [
            {
                "raw_text": "Electrician started troubleshooting 6.6kV main pump motor MCC feeder without applying Lockout/Tagout (LOTO) padlock or testing zero voltage.",
                "site": "Moran GGS",
                "activity": "Electrical Maintenance",
                "reported_date": "2026-08-23",
                "submitting_role": "Electrical Supervisor"
            },
            {
                "raw_text": "Whiteboard marker dried out during weekly department safety coordination meeting.",
                "site": "Duliajan Central Office",
                "activity": "Admin Meeting",
                "reported_date": "2026-08-23",
                "submitting_role": "Admin Assistant"
            },
            {
                "raw_text": "Welder commenced oxy-acetylene torch cutting near separator drain with gas monitor alarming 20% LEL combustible hydrocarbon vapor.",
                "site": "Moran GGS",
                "activity": "Structural Welding",
                "reported_date": "2026-08-23",
                "submitting_role": "Safety Watch"
            }
        ]
        status, data, text = fetch_json('/api/reports/bulk', method='POST', data=json.dumps({"reports": batch}), headers={'Content-Type': 'application/json'})
        print("Status code:", status)
        assert status in [200, 201], f"Expected 200/201, got {status}"
        assert data.get("success") is True, "Expected success: true"
        summary = data.get("batchSummary")
        assert summary is not None, "Expected batchSummary"
        print(f"Total Processed: {summary.get('total_processed')}")
        print(f"SIF Count: {summary.get('sif_count')}")
        print(f"Non-SIF Count: {summary.get('non_sif_count')}")
        assert summary.get("total_processed") == 3, f"Expected 3 processed, got {summary.get('total_processed')}"

    def test_aggregates():
        status, data, text = fetch_json('/api/aggregates')
        print("Status code:", status)
        assert status == 200, f"Expected 200, got {status}"
        assert data.get("success") is True, "Expected success: true"
        aggregates = data.get("aggregates")
        assert isinstance(aggregates, list), "Expected aggregates array"
        print(f"Total Aggregated Site/Activity Segments: {len(aggregates)}")
        if aggregates:
            top = aggregates[0]
            print(f"Top Risk Site: {top.get('site')} - Density: {top.get('precursor_density')}%")

    def test_patterns():
        status, data, text = fetch_json('/api/patterns')
        print("Status code:", status)
        assert status == 200, f"Expected 200, got {status}"
        assert data.get("success") is True, "Expected success: true"
        patterns = data.get("patterns")
        assert isinstance(patterns, list), "Expected patterns array"
        print(f"Detected Precursor Pattern Callouts: {len(patterns)}")

    def test_digest():
        status, data, text = fetch_json('/api/digest')
        print("Status code:", status)
        assert status == 200, f"Expected 200, got {status}"
        assert data.get("success") is True, "Expected success: true"
        digest = data.get("digest")
        assert digest is not None, "Expected digest object"
        print(f"Executive Summary: {digest.get('executive_summary')}")
        print(f"Total Reports Evaluated: {digest.get('total_reports')}")
        print(f"Suggested Interventions: {len(digest.get('suggested_interventions', []))}")

    # Run the full suite
    tests = [
        ("Health Check", test_health),
        ("Layer A Model Metrics & Layer B Gate Status", test_metrics),
        ("Manual Ingestion (SIF Positive)", test_manual_ingest_sif_report),
        ("Manual Ingestion (Non-SIF Negative)", test_manual_ingest_non_sif_report),
        ("Bulk Batch Ingestion", test_bulk_ingest),
        ("Facility Precursor Density Aggregates", test_aggregates),
        ("Recurring Pattern Callouts", test_patterns),
        ("Executive HSE Weekly Digest", test_digest),
    ]

    passed = 0
    failed = 0

    for name, func in tests:
        try:
            run_test(name, func)
            passed += 1
        except Exception as e:
            failed += 1

    print("\n==========================================================")
    print(f"RESULTS: {passed} PASSED, {failed} FAILED")
    print("==========================================================")

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)
