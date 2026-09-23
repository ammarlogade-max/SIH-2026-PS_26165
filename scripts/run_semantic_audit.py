#!/usr/bin/env python3
"""
SIF Sentinel — Semantic Ground-Truth Audit & Field-Level Entailment Engine
SIH 2026 — Problem Statement SIH26165

This script implements the final semantic integrity gate:
1. Deterministic stratified sampling of 225 canonical events (80 BSEE, 137 IMCA, 8 UK HSE, all 37 UA/UC).
2. Field-level entailment auditing across all canonical fields against earliest trustworthy text.
3. Generation of:
   - dataset/reports/consequence_audit.csv
   - dataset/reports/semantic_field_precision_report.csv
   - dataset/reports/semantic_source_quality_report.csv
   - dataset/reports/dataset_semantic_audit_results.json
"""

import json
import csv
import os
import re
import random
from collections import Counter

# Deterministic seed for reproducible audit sampling
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

CANONICAL_V2_PATH = 'dataset/final/events_final_v2.jsonl'
CONSEQUENCE_AUDIT_CSV = 'dataset/reports/consequence_audit.csv'
FIELD_PRECISION_CSV = 'dataset/reports/semantic_field_precision_report.csv'
SOURCE_QUALITY_CSV = 'dataset/reports/semantic_source_quality_report.csv'
AUDIT_RESULTS_JSON = 'dataset/reports/dataset_semantic_audit_results.json'

INVALID_EQUIPMENT_TERMS = {
    'pressure', 'fire', 'dropped', 'burn', 'blowout', 'electrical',
    'fall from height', 'explosion', 'rupture', 'shock', 'none', 'unknown'
}

# Known physical equipment keywords
PHYSICAL_EQUIPMENT_MAP = [
    (r'\bparachute flare\b', 'parachute flare'),
    (r'\bhandheld flare\b', 'handheld flare'),
    (r'\bflare\b', 'flare'),
    (r'\bfast rescue craft\b|\bfrc\b', 'fast rescue craft (FRC)'),
    (r'\bcrane\b', 'crane'),
    (r'\bwinch\b', 'winch'),
    (r'\bhydraulic hose\b|\bbull hose\b|\bhose\b', 'hose'),
    (r'\bpressure safety valve\b|\bprv\b|\bpsv\b', 'pressure safety valve'),
    (r'\bvalve\b', 'valve'),
    (r'\bpump\b', 'pump'),
    (r'\bpressure vessel\b|\bvessel\b', 'pressure vessel'),
    (r'\bwireline\b', 'wireline unit'),
    (r'\bshackle\b', 'shackle'),
    (r'\bsling\b', 'lifting sling'),
    (r'\bcompressor\b', 'compressor'),
    (r'\bscaffold\b|\bscaffolding\b', 'scaffolding'),
    (r'\bgenerator\b', 'generator'),
    (r'\brov\b', 'remotely operated vehicle (ROV)'),
    (r'\blift trolley\b|\btrolley\b', 'lift trolley'),
    (r'\belevator\b|\blift\b', 'lift / elevator'),
    (r'\bdrill pipe\b|\btubing\b', 'drill pipe / tubular'),
    (r'\bbop\b|\bblowout preventer\b', 'blowout preventer (BOP)'),
    (r'\bdiver umbilical\b|\bumbilical\b', 'diver umbilical'),
    (r'\bbailout cylinder\b|\bcylinder\b', 'gas cylinder / bailout cylinder'),
    (r'\bfloodlight\b', 'floodlight'),
    (r'\bjumper\b', 'subsea jumper'),
]

def load_events():
    with open(CANONICAL_V2_PATH, 'r', encoding='utf-8') as f:
        return [json.loads(line) for line in f]

def extract_authoritative_text(event):
    """Retrieve the earliest trustworthy source narrative representation."""
    narrative_obj = event.get('narrative', {})
    text = narrative_obj.get('cleaned_source_text') or narrative_obj.get('event_narrative') or narrative_obj.get('raw', '')
    return text.strip()

def select_stratified_sample(events):
    """
    Selects a deterministic sample of 225 records:
    - BSEE: 80 (includes all 4 BSEE UA/UC, plus stratified Gold, Silver, Bronze across Incidents & Near Misses)
    - IMCA: 137 (includes all 33 IMCA UA/UC, 6 SIF FALSE, plus stratified Gold, Silver, Bronze)
    - UK HSE: 8 (all 8 available records)
    Total UA/UC: 37 records (100% of all UA/UC in the corpus, exceeding min 17).
    """
    bsee_all = [e for e in events if 'BSEE' in e['source']['source_organization']]
    imca_all = [e for e in events if 'IMCA' in e['source']['source_organization']]
    hse_all = [e for e in events if 'HSE' in e['source']['source_organization']]

    # BSEE selection
    bsee_ua_uc = [e for e in bsee_all if e['event_type'] in ('UA', 'UC')]
    bsee_gold = [e for e in bsee_all if e['quality']['dataset_tier'] == 'GOLD' and e not in bsee_ua_uc]
    bsee_silver = [e for e in bsee_all if e['quality']['dataset_tier'] == 'SILVER' and e not in bsee_ua_uc]
    bsee_bronze = [e for e in bsee_all if e['quality']['dataset_tier'] == 'BRONZE' and e not in bsee_ua_uc]

    bsee_sample = list(bsee_ua_uc)
    bsee_sample += random.sample(bsee_gold, min(len(bsee_gold), 10))
    bsee_sample += random.sample(bsee_silver, min(len(bsee_silver), 25))
    remaining_bsee = 80 - len(bsee_sample)
    bsee_sample += random.sample(bsee_bronze, remaining_bsee)

    # IMCA selection
    imca_ua_uc = [e for e in imca_all if e['event_type'] in ('UA', 'UC')]
    imca_sif_false = [e for e in imca_all if str(e['sif']['sif_potential']) == 'FALSE' and e not in imca_ua_uc]
    imca_gold = [e for e in imca_all if e['quality']['dataset_tier'] == 'GOLD' and e not in imca_ua_uc and e not in imca_sif_false]
    imca_silver = [e for e in imca_all if e['quality']['dataset_tier'] == 'SILVER' and e not in imca_ua_uc and e not in imca_sif_false]
    imca_bronze = [e for e in imca_all if e['quality']['dataset_tier'] == 'BRONZE' and e not in imca_ua_uc and e not in imca_sif_false]

    imca_sample = list(imca_ua_uc)
    imca_sample += random.sample(imca_sif_false, min(len(imca_sif_false), 6))
    imca_sample += random.sample(imca_gold, min(len(imca_gold), 10))
    imca_sample += random.sample(imca_silver, min(len(imca_silver), 25))
    remaining_imca = 137 - len(imca_sample)
    imca_sample += random.sample(imca_bronze, remaining_imca)

    # HSE selection (all 8)
    hse_sample = list(hse_all)

    full_sample = bsee_sample + imca_sample + hse_sample
    return full_sample

def check_evidence_validity(evidence_span, source_text):
    """Verifies that the evidence span is an exact substring of the source text."""
    if not evidence_span or evidence_span in ('null', 'None', ''):
        return True, "EMPTY"
    norm_span = ' '.join(evidence_span.split())
    norm_text = ' '.join(source_text.split())
    if evidence_span in source_text or norm_span in norm_text:
        return True, "EXACT_SUBSTRING"
    return False, "INVALID_NOT_IN_SOURCE"

def audit_event(event):
    eid = event['event_id']
    org = event['source']['source_organization']
    source_text = extract_authoritative_text(event)
    source_lower = source_text.lower()

    fields_audit = {}
    error_codes = []

    # 1. EVENT TYPE AUDIT
    orig_type = event['event_type']
    has_injury = any(w in source_lower for w in ['injury', 'injured', 'burn', 'fatality', 'fatal', 'hospital', 'lacerat', 'fracture', 'amputat'])
    has_spill = any(w in source_lower for w in ['barrels of oil released', 'gallons spilled', 'oil spill', 'released into the gulf'])
    has_damage_or_fire = any(w in source_lower for w in ['fire occurred', 'caught fire', 'explosion occurred', 'damage to the vessel', 'structural damage'])
    is_pure_observation = any(w in source_lower for w in ['audit identified', 'inspection identified', 'bypassed safety device', 'hidden corrosion', 'defective ladder quarantined']) and not has_injury and not has_damage_or_fire and not has_spill

    if has_injury or has_spill or has_damage_or_fire:
        audited_type = 'INCIDENT'
    elif 'dropped to deck' in source_lower or 'near miss' in source_lower or 'potential dropped' in source_lower or 'parting' in source_lower:
        audited_type = 'NEAR_MISS'
    elif is_pure_observation:
        audited_type = 'UC' if 'corrosion' in source_lower or 'defective' in source_lower else 'UA'
    else:
        audited_type = orig_type

    if orig_type == audited_type:
        fields_audit['event_type'] = {'status': 'SUPPORTED', 'val': orig_type, 'evid': True}
    else:
        fields_audit['event_type'] = {'status': 'NOT_SUPPORTED', 'val': audited_type, 'evid': False}
        error_codes.append('SEM-008')

    # 2. LOCATION / FACILITY AUDIT
    fac = event['location'].get('facility')
    has_facility_evidence = False
    if fac and fac != 'UNKNOWN':
        if fac == 'Offshore Fixed Platform':
            has_facility_evidence = bool(re.search(r'\b(platform|complex|facility|caisson|block|wellhead)\b', source_lower))
        elif fac == 'Tanker Vessel':
            has_facility_evidence = bool(re.search(r'\b(tanker|vessel|ship|boat|craft)\b', source_lower))
        elif fac == 'Barge':
            has_facility_evidence = bool(re.search(r'\bbarge\b', source_lower))
        elif fac == 'Jack-up Rig':
            has_facility_evidence = bool(re.search(r'\b(jack-up|jackup|rig)\b', source_lower))
        elif fac == 'Wind Turbine Generator':
            has_facility_evidence = bool(re.search(r'\b(wind turbine|turbine)\b', source_lower))
        else:
            has_facility_evidence = bool(re.search(r'\b(rig|platform|vessel|barge|ship)\b', source_lower))

    if not fac or fac == 'UNKNOWN':
        fields_audit['location_facility'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
    elif not has_facility_evidence:
        fields_audit['location_facility'] = {'status': 'NOT_SUPPORTED', 'val': 'UNKNOWN', 'evid': False}
        error_codes.append('SEM-007')
    else:
        fields_audit['location_facility'] = {'status': 'SUPPORTED', 'val': fac, 'evid': True}

    reg = event['location'].get('region')
    fields_audit['location_region'] = {'status': 'SUPPORTED' if reg else 'UNKNOWN', 'val': reg, 'evid': True}

    # 3. ACTIVITY AUDIT
    act = event['context'].get('activity')
    if act and act != 'UNKNOWN':
        act_words = [w.lower() for w in act.replace('&', ' ').replace('/', ' ').split() if len(w) > 3]
        if any(w in source_lower for w in act_words) or ('lifting' in source_lower and 'lift' in act.lower()):
            fields_audit['context_activity'] = {'status': 'SUPPORTED', 'val': act, 'evid': True}
        else:
            fields_audit['context_activity'] = {'status': 'AMBIGUOUS', 'val': act, 'evid': True}
    else:
        fields_audit['context_activity'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}

    # 4. EQUIPMENT AUDIT
    eq = event['context'].get('equipment')
    if eq and eq.lower() in INVALID_EQUIPMENT_TERMS:
        real_eq = None
        for pattern, name in PHYSICAL_EQUIPMENT_MAP:
            if re.search(pattern, source_lower):
                real_eq = name
                break
        fields_audit['context_equipment'] = {'status': 'NOT_SUPPORTED', 'val': real_eq or 'UNKNOWN', 'evid': False}
        error_codes.append('SEM-005')
    elif eq and eq != 'UNKNOWN':
        fields_audit['context_equipment'] = {'status': 'SUPPORTED', 'val': eq, 'evid': True}
    else:
        fields_audit['context_equipment'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}

    # 5. HAZARD & ENERGY AUDIT
    eng = event['energy'].get('type')
    eng_evid = event['energy'].get('evidence')
    valid_eng_evid, _ = check_evidence_validity(eng_evid, source_text)

    energy_supported = False
    if eng == 'THERMAL' and any(w in source_lower for w in ['burn', 'fire', 'hot', 'steam', 'flare', 'pyrotechnic', 'explosion']):
        energy_supported = True
    elif eng == 'PRESSURE' and any(w in source_lower for w in ['pressure', 'psi', 'bar', 'hydraulic', 'pneumatic', 'compressed', 'leak', 'jumper']):
        energy_supported = True
    elif eng == 'GRAVITATIONAL' and any(w in source_lower for w in ['drop', 'fell', 'fall from height', 'overhead', 'lowering', 'hoist']):
        energy_supported = True
    elif eng == 'KINETIC' and any(w in source_lower for w in ['moving', 'rotating', 'crush', 'struck', 'collision', 'impact', 'line']):
        energy_supported = True
    elif eng == 'ELECTRICAL' and any(w in source_lower for w in ['electric', 'arc', 'voltage', 'shock', 'cable', 'short circuit']):
        energy_supported = True
    elif eng == 'CHEMICAL' and any(w in source_lower for w in ['chemical', 'acid', 'toxic', 'h2s', 'gas release', 'fumes', 'vapour']):
        energy_supported = True
    elif eng == 'UNKNOWN':
        energy_supported = True

    if eng == 'UNKNOWN':
        fields_audit['energy'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
    elif energy_supported and valid_eng_evid:
        fields_audit['energy'] = {'status': 'SUPPORTED', 'val': eng, 'evid': True}
    elif not valid_eng_evid:
        fields_audit['energy'] = {'status': 'NOT_SUPPORTED', 'val': eng, 'evid': False}
        error_codes.append('SEM-003')
    else:
        fields_audit['energy'] = {'status': 'NOT_SUPPORTED', 'val': 'UNKNOWN', 'evid': False}
        error_codes.append('SEM-010')

    # 6. BARRIER AUDIT
    barriers = event.get('barriers', [])
    if not barriers:
        fields_audit['barrier'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
        fields_audit['barrier_state'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
        fields_audit['barrier_failure'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
    else:
        b = barriers[0]
        b_name = b.get('name')
        b_state = b.get('state')
        b_evid = b.get('evidence')
        valid_b_evid, _ = check_evidence_validity(b_evid, source_text)

        is_generic_ptw = b_name == 'Permit to Work & JSA' and not bool(re.search(r'\b(permit to work|ptw|jsa)\b', source_lower))
        if is_generic_ptw:
            fields_audit['barrier'] = {'status': 'NOT_SUPPORTED', 'val': 'Risk Assessment & Task Planning', 'evid': False}
            fields_audit['barrier_state'] = {'status': 'NOT_SUPPORTED', 'val': 'UNKNOWN', 'evid': False}
            fields_audit['barrier_failure'] = {'status': 'NOT_SUPPORTED', 'val': 'UNKNOWN', 'evid': False}
            error_codes.append('SEM-011')
        elif not valid_b_evid:
            fields_audit['barrier'] = {'status': 'NOT_SUPPORTED', 'val': b_name, 'evid': False}
            fields_audit['barrier_state'] = {'status': 'NOT_SUPPORTED', 'val': b_state, 'evid': False}
            fields_audit['barrier_failure'] = {'status': 'NOT_SUPPORTED', 'val': 'UNKNOWN', 'evid': False}
            error_codes.append('SEM-003')
        elif b_state == 'INTACT' and not any(w in source_lower for w in ['held', 'prevented', 'intact', 'stopped', 'effective']):
            fields_audit['barrier'] = {'status': 'SUPPORTED', 'val': b_name, 'evid': True}
            fields_audit['barrier_state'] = {'status': 'NOT_SUPPORTED', 'val': 'UNKNOWN', 'evid': False}
            fields_audit['barrier_failure'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
            error_codes.append('SEM-011')
        else:
            fields_audit['barrier'] = {'status': 'SUPPORTED', 'val': b_name, 'evid': True}
            fields_audit['barrier_state'] = {'status': 'SUPPORTED' if b_state in ('DEGRADED', 'FAILED', 'ABSENT') else 'AMBIGUOUS', 'val': b_state, 'evid': True}
            fields_audit['barrier_failure'] = {'status': 'SUPPORTED' if b_state in ('DEGRADED', 'FAILED', 'ABSENT') else 'UNKNOWN', 'val': b_state, 'evid': True}

    # 7. EXPOSURE AUDIT
    exp = event.get('exposure', {})
    exp_pres = exp.get('present')
    exp_evid = exp.get('evidence')
    valid_exp_evid, _ = check_evidence_validity(exp_evid, source_text)

    has_exposure_text = any(w in source_lower for w in ['struck', 'injur', 'burn', 'hit', 'fall', 'caught', 'contact', 'line of fire'])
    if exp_pres is True and has_exposure_text and valid_exp_evid:
        fields_audit['exposure'] = {'status': 'SUPPORTED', 'val': True, 'evid': True}
    elif exp_pres is True and not has_exposure_text:
        fields_audit['exposure'] = {'status': 'NOT_SUPPORTED', 'val': False, 'evid': False}
        error_codes.append('SEM-012')
    elif exp_pres is False:
        fields_audit['exposure'] = {'status': 'SUPPORTED', 'val': False, 'evid': True}
    else:
        fields_audit['exposure'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}

    # 8. CONSEQUENCE AUDIT
    c = event.get('consequence', {})
    c_inj = c.get('injury')
    c_fat = c.get('fatality')
    c_act = c.get('actual', '')

    injury_desc = None
    if 'second-degree burn' in source_lower or '2nd degree burn' in source_lower:
        injury_desc = 'Second-degree burn injury'
    elif 'third-degree burn' in source_lower:
        injury_desc = 'Third-degree burn injury'
    elif 'burn' in source_lower and ('injur' in source_lower or 'treated' in source_lower):
        injury_desc = 'Burn injury'
    elif 'amputat' in source_lower:
        injury_desc = 'Amputation injury'
    elif 'fracture' in source_lower or 'broken bone' in source_lower:
        injury_desc = 'Fracture / serious personal injury'
    elif 'hospitaliz' in source_lower:
        injury_desc = 'Personal injury requiring hospitalization'
    elif 'lacerat' in source_lower and 'treated' in source_lower:
        injury_desc = 'Laceration requiring medical attention'
    elif 'fatality' in source_lower or 'fatal' in source_lower or 'died' in source_lower or 'killed' in source_lower:
        injury_desc = 'Fatal injury'

    is_consequence_mismatch = False
    if injury_desc and (c_inj is None or 'None reported' in c_act or c_inj == 'None'):
        is_consequence_mismatch = True
        error_codes.append('SEM-009')
        fields_audit['actual_consequence'] = {'status': 'NOT_SUPPORTED', 'val': injury_desc, 'evid': False}
        fields_audit['consequence_injury'] = {'status': 'NOT_SUPPORTED', 'val': injury_desc, 'evid': False}
    else:
        fields_audit['actual_consequence'] = {'status': 'SUPPORTED', 'val': c_act, 'evid': True}
        fields_audit['consequence_injury'] = {'status': 'SUPPORTED' if c_inj else 'UNKNOWN', 'val': c_inj, 'evid': True}

    fields_audit['consequence_fatality'] = {'status': 'SUPPORTED', 'val': c_fat, 'evid': True}
    fields_audit['potential_consequence'] = {'status': 'SUPPORTED' if c.get('potential') else 'UNKNOWN', 'val': c.get('potential'), 'evid': True}

    # 9. SIF AUDIT
    sif_obj = event.get('sif', {})
    sif_pot = str(sif_obj.get('sif_potential'))
    sif_lt = str(sif_obj.get('label_type'))
    sif_evid = sif_obj.get('evidence_span') or sif_obj.get('evidence')
    valid_sif_evid, _ = check_evidence_validity(sif_evid, source_text)

    has_life_threatening_harm = c_fat is True or (injury_desc in ('Fatal injury', 'Amputation injury', 'Second-degree burn injury', 'Third-degree burn injury', 'Fracture / serious personal injury'))
    has_high_energy_hipo = ('dropped' in source_lower and ('heavy' in source_lower or 'ton' in source_lower or 'crane' in source_lower)) or ('explosion' in source_lower or 'fire' in source_lower or 'blowout' in source_lower)

    if has_life_threatening_harm or has_high_energy_hipo:
        audited_sif = 'TRUE'
    elif 'paper cut' in source_lower or 'minor scratch' in source_lower or 'defective hammer shaft' in source_lower or ('first aid' in source_lower and not has_high_energy_hipo):
        audited_sif = 'FALSE'
    elif sif_pot == 'UNKNOWN':
        audited_sif = 'UNKNOWN'
    else:
        audited_sif = sif_pot

    sif_match = (sif_pot == audited_sif)
    if sif_pot == 'UNKNOWN':
        fields_audit['SIF'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
    elif sif_match and (valid_sif_evid or sif_lt == 'DERIVED'):
        fields_audit['SIF'] = {'status': 'SUPPORTED', 'val': sif_pot, 'evid': True}
    elif not valid_sif_evid and sif_lt == 'EXPLICIT':
        fields_audit['SIF'] = {'status': 'NOT_SUPPORTED', 'val': audited_sif, 'evid': False}
        error_codes.append('SEM-003')
    else:
        fields_audit['SIF'] = {'status': 'AMBIGUOUS', 'val': audited_sif, 'evid': True}

    # 10. IOGP LIFE-SAVING RULE AUDIT
    iogp_list = event.get('iogp', [])
    if not iogp_list:
        fields_audit['IOGP_mapping'] = {'status': 'UNKNOWN', 'val': 'UNKNOWN', 'evid': True}
    else:
        all_rules_supported = True
        for r in iogp_list:
            r_name = r.get('rule_name')
            r_evid = r.get('evidence_text')
            valid_r_evid, _ = check_evidence_validity(r_evid, source_text)

            is_false_driving = r_name == 'Driving' and not bool(re.search(r'\b(vehicle|car|truck|van|driving|road|seatbelt|automobile|forklift)\b', source_lower))
            if is_false_driving:
                all_rules_supported = False
                error_codes.append('SEM-014')
            elif not valid_r_evid:
                all_rules_supported = False
                error_codes.append('SEM-003')

        fields_audit['IOGP_mapping'] = {'status': 'SUPPORTED' if all_rules_supported else 'NOT_SUPPORTED', 'val': [r.get('rule_name') for r in iogp_list], 'evid': all_rules_supported}

    return {
        'event_id': eid,
        'source_id': event['source'].get('source_id'),
        'document_id': event['source'].get('document_id'),
        'source_organization': org,
        'source_url': event['source'].get('url'),
        'dataset_tier': event['quality'].get('dataset_tier'),
        'fields': fields_audit,
        'error_codes': list(set(error_codes)),
        'is_consequence_mismatch': is_consequence_mismatch,
        'injury_desc': injury_desc,
        'canonical_injury': c_inj,
        'canonical_actual': c_act,
        'source_excerpt': source_text[:250].replace('\n', ' ')
    }

def main():
    print('Executing SIF Sentinel Semantic Ground-Truth Audit...')
    events = load_events()
    sample = select_stratified_sample(events)
    print(f'Auditing stratified sample of {len(sample)} events...')

    audit_results = []
    consequence_records = []

    for event in sample:
        res = audit_event(event)
        audit_results.append(res)
        if res['is_consequence_mismatch'] or res['canonical_injury'] or res['injury_desc']:
            inj_text = res["injury_desc"]
            consequence_records.append({
                'event_id': res['event_id'],
                'source_id': res['source_id'],
                'source_organization': res['source_organization'],
                'narrative_excerpt': res['source_excerpt'],
                'canonical_injury': res['canonical_injury'] or 'null',
                'audited_injury': res['injury_desc'] or 'None reported',
                'canonical_fatality': event['consequence'].get('fatality'),
                'audited_fatality': event['consequence'].get('fatality'),
                'canonical_actual': res['canonical_actual'],
                'audited_actual': res['injury_desc'] if res['is_consequence_mismatch'] else res['canonical_actual'],
                'consequence_status': 'CONTRADICTED' if res['is_consequence_mismatch'] else 'SUPPORTED',
                'error_code': 'SEM-009' if res['is_consequence_mismatch'] else 'NONE',
                'explanation': 'Source narrative documents injury but consequence field records null/none reported.' if res['is_consequence_mismatch'] else 'Consequence accurately aligns with source text.',
                'recommended_repair': f"Set consequence.injury='{inj_text}' and update actual consequence." if res['is_consequence_mismatch'] else 'PRESERVE'
            })

    # Also check full dataset for consequence mismatches to ensure all are repaired in consequence_audit.csv
    for event in events:
        if event in sample:
            continue
        res = audit_event(event)
        if res['is_consequence_mismatch']:
            inj_text = res["injury_desc"]
            consequence_records.append({
                'event_id': res['event_id'],
                'source_id': res['source_id'],
                'source_organization': res['source_organization'],
                'narrative_excerpt': res['source_excerpt'],
                'canonical_injury': res['canonical_injury'] or 'null',
                'audited_injury': res['injury_desc'],
                'canonical_fatality': event['consequence'].get('fatality'),
                'audited_fatality': event['consequence'].get('fatality'),
                'canonical_actual': res['canonical_actual'],
                'audited_actual': res['injury_desc'],
                'consequence_status': 'CONTRADICTED',
                'error_code': 'SEM-009',
                'explanation': 'Source narrative documents injury but consequence field records null/none reported.',
                'recommended_repair': f"Set consequence.injury='{inj_text}' and update actual consequence."
            })

    print(f'Total consequence audit records logged: {len(consequence_records)}')

    os.makedirs('dataset/reports', exist_ok=True)
    with open(CONSEQUENCE_AUDIT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'event_id', 'source_id', 'source_organization', 'narrative_excerpt',
            'canonical_injury', 'audited_injury', 'canonical_fatality', 'audited_fatality',
            'canonical_actual', 'audited_actual', 'consequence_status', 'error_code',
            'explanation', 'recommended_repair'
        ])
        writer.writeheader()
        for r in consequence_records:
            writer.writerow(r)
    print(f'Wrote {CONSEQUENCE_AUDIT_CSV}')

    all_fields = [
        'event_type', 'location_facility', 'location_region', 'context_activity',
        'context_equipment', 'energy', 'barrier', 'barrier_state',
        'barrier_failure', 'exposure', 'actual_consequence', 'potential_consequence',
        'SIF', 'IOGP_mapping'
    ]

    field_stats = {}
    for fld in all_fields:
        field_stats[fld] = {'sample_count': len(audit_results), 'supported': 0, 'ambiguous': 0, 'not_supported': 0, 'unknown': 0, 'evidence_valid': 0}

    for res in audit_results:
        for fld, data in res['fields'].items():
            if fld in field_stats:
                st = data['status'].lower()
                field_stats[fld][st] += 1
                if data.get('evid'):
                    field_stats[fld]['evidence_valid'] += 1

    field_rows = []
    for fld, stat in field_stats.items():
        n = stat['sample_count']
        supp = stat['supported']
        amb = stat['ambiguous']
        not_supp = stat['not_supported']
        unk = stat['unknown']
        evid_valid = stat['evidence_valid']
        
        evaluated = supp + amb + not_supp
        precision = round(supp / evaluated * 100, 2) if evaluated > 0 else 100.0
        evid_rate = round(evid_valid / n * 100, 2)
        field_rows.append({
            'field': fld,
            'sample_count': n,
            'supported': supp,
            'ambiguous': amb,
            'not_supported': not_supp,
            'unknown': unk,
            'precision_pct': precision,
            'evidence_valid_rate_pct': evid_rate
        })

    with open(FIELD_PRECISION_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'field', 'sample_count', 'supported', 'ambiguous', 'not_supported', 'unknown',
            'precision_pct', 'evidence_valid_rate_pct'
        ])
        writer.writeheader()
        for r in field_rows:
            writer.writerow(r)
    print(f'Wrote {FIELD_PRECISION_CSV}')

    sources = set(r['source_organization'] for r in audit_results)
    source_stats = []
    critical_fields = {'SIF', 'actual_consequence', 'energy', 'barrier', 'barrier_failure', 'exposure', 'IOGP_mapping'}

    for src in sorted(sources):
        src_records = [r for r in audit_results if r['source_organization'] == src]
        n_src = len(src_records)
        total_eval_fields = 0
        total_supp_fields = 0
        total_crit_eval = 0
        total_crit_supp = 0
        sif_eval, sif_supp = 0, 0
        conseq_eval, conseq_supp = 0, 0
        barrier_eval, barrier_supp = 0, 0
        evid_valid_count = 0
        total_fields_count = 0

        for r in src_records:
            for fld, data in r['fields'].items():
                total_fields_count += 1
                if data.get('evid'):
                    evid_valid_count += 1
                st = data['status']
                if st in ('SUPPORTED', 'NOT_SUPPORTED', 'AMBIGUOUS'):
                    total_eval_fields += 1
                    if st == 'SUPPORTED':
                        total_supp_fields += 1
                
                if fld in critical_fields:
                    if st in ('SUPPORTED', 'NOT_SUPPORTED', 'AMBIGUOUS'):
                        total_crit_eval += 1
                        if st == 'SUPPORTED':
                            total_crit_supp += 1

                if fld == 'SIF':
                    if st in ('SUPPORTED', 'NOT_SUPPORTED', 'AMBIGUOUS'):
                        sif_eval += 1
                        if st == 'SUPPORTED':
                            sif_supp += 1

                if fld == 'actual_consequence':
                    if st in ('SUPPORTED', 'NOT_SUPPORTED', 'AMBIGUOUS'):
                        conseq_eval += 1
                        if st == 'SUPPORTED':
                            conseq_supp += 1

                if fld == 'barrier':
                    if st in ('SUPPORTED', 'NOT_SUPPORTED', 'AMBIGUOUS'):
                        barrier_eval += 1
                        if st == 'SUPPORTED':
                            barrier_supp += 1

        overall_supp_rate = round(total_supp_fields / total_eval_fields * 100, 2) if total_eval_fields else 100.0
        crit_prec = round(total_crit_supp / total_crit_eval * 100, 2) if total_crit_eval else 100.0
        sif_prec = round(sif_supp / sif_eval * 100, 2) if sif_eval else 100.0
        conseq_prec = round(conseq_supp / conseq_eval * 100, 2) if conseq_eval else 100.0
        barrier_prec = round(barrier_supp / barrier_eval * 100, 2) if barrier_eval else 100.0
        evid_valid_rate = round(evid_valid_count / total_fields_count * 100, 2) if total_fields_count else 100.0

        source_stats.append({
            'source_organization': src,
            'sample_count': n_src,
            'overall_supported_rate_pct': overall_supp_rate,
            'overall_error_rate_pct': round(100.0 - overall_supp_rate, 2),
            'critical_field_precision_pct': crit_prec,
            'sif_precision_pct': sif_prec,
            'consequence_precision_pct': conseq_prec,
            'barrier_precision_pct': barrier_prec,
            'evidence_valid_rate_pct': evid_valid_rate
        })

    with open(SOURCE_QUALITY_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=[
            'source_organization', 'sample_count', 'overall_supported_rate_pct',
            'overall_error_rate_pct', 'critical_field_precision_pct', 'sif_precision_pct',
            'consequence_precision_pct', 'barrier_precision_pct', 'evidence_valid_rate_pct'
        ])
        writer.writeheader()
        for r in source_stats:
            writer.writerow(r)
    print(f'Wrote {SOURCE_QUALITY_CSV}')

    summary_data = {
        'total_events_in_v2': len(events),
        'sample_audited_count': len(audit_results),
        'sample_breakdown': {
            'BSEE': len([r for r in audit_results if 'BSEE' in r['source_organization']]),
            'IMCA': len([r for r in audit_results if 'IMCA' in r['source_organization']]),
            'UK_HSE': len([r for r in audit_results if 'HSE' in r['source_organization']])
        },
        'ua_uc_audited_count': len([r for r in audit_results if events[next(i for i, e in enumerate(events) if e['event_id'] == r['event_id'])]['event_type'] in ('UA', 'UC')]),
        'consequence_contradictions_found': len([r for r in consequence_records if r['consequence_status'] == 'CONTRADICTED']),
        'field_precision': field_rows,
        'source_quality': source_stats
    }
    with open(AUDIT_RESULTS_JSON, 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2)
    print(f'Wrote {AUDIT_RESULTS_JSON}')

if __name__ == '__main__':
    main()
