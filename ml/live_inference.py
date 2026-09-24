from pathlib import Path
import joblib
from scipy.sparse import hstack


BASE = Path(__file__).resolve().parents[1]
MODEL_DIR = BASE / "ml" / "models"


# ============================================================
# LOAD TRAINED MODELS
# ============================================================

SIF_MODEL = joblib.load(
    MODEL_DIR / "sif_pu_classifier.joblib"
)

SIF_FEATURES = joblib.load(
    MODEL_DIR / "sif_pu_tfidf_features.joblib"
)

IOGP_MODEL = joblib.load(
    MODEL_DIR / "iogp_classifier_v3.joblib"
)

IOGP_WORD = joblib.load(
    MODEL_DIR / "iogp_word_tfidf_v3.joblib"
)

IOGP_CHAR = joblib.load(
    MODEL_DIR / "iogp_char_tfidf_v3.joblib"
)

IOGP_ENCODER = joblib.load(
    MODEL_DIR / "iogp_label_encoder_v3.joblib"
)


IOGP_THRESHOLDS = {
    "IOGP-01": 0.45,
    "IOGP-02": 0.20,
    "IOGP-03": 0.35,
    "IOGP-04": 0.35,
    "IOGP-05": 0.50,
    "IOGP-06": 0.55,
    "IOGP-07": 0.45,
    "IOGP-08": 0.45,
    "IOGP-09": 0.45,
}


IOGP_NAMES = {
    "IOGP-01": "Bypassing Safety Controls",
    "IOGP-02": "Confined Space",
    "IOGP-03": "Driving",
    "IOGP-04": "Energy Isolation",
    "IOGP-05": "Hot Work",
    "IOGP-06": "Line of Fire",
    "IOGP-07": "Safe Mechanical Lifting",
    "IOGP-08": "Work Authorization",
    "IOGP-09": "Working at Height",
}


# ============================================================
# SIF PRECURSOR SIGNAL EXTRACTION
# ============================================================

ENERGY_KEYWORDS = {
    "THERMAL": [
        "fire", "flame", "burn", "hot surface",
        "heat", "welding", "ignition", "explosion"
    ],
    "GRAVITATIONAL": [
        "fall", "dropped", "suspended load",
        "lifting", "crane", "height", "scaffold"
    ],
    "PRESSURE": [
        "pressure", "pressurized", "compressed",
        "rupture", "burst", "blowout"
    ],
    "KINETIC": [
        "moving equipment", "vehicle", "struck",
        "caught", "rotating", "moving load"
    ],
    "ELECTRICAL": [
        "electrical", "electric", "shock",
        "energized", "voltage", "arc flash"
    ],
    "HYDRAULIC": [
        "hydraulic", "hydraulic pressure"
    ],
    "CHEMICAL": [
        "toxic", "chemical", "corrosive",
        "hydrogen sulfide", "h2s"
    ],
}


LINE_OF_FIRE_TERMS = [
    "line of fire",
    "struck by",
    "struck-by",
    "caught between",
    "caught in",
    "crush zone",
    "suspended load",
    "dropped object",
    "swing radius",
]


HUMAN_EXPOSURE_TERMS = [
    "worker",
    "workers",
    "person",
    "personnel",
    "employee",
    "operator",
    "technician",
    "crew",
    "man",
    "people",
]


def detect_energy(text):
    t = text.lower()

    matches = []

    for energy_type, keywords in ENERGY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in t:
                matches.append(energy_type)
                break

    # Remove duplicates while preserving order.
    matches = list(dict.fromkeys(matches))

    if not matches:
        return "UNKNOWN"

    return matches[0]


def detect_exposure(text):
    t = text.lower()

    line_of_fire = any(
        term in t for term in LINE_OF_FIRE_TERMS
    )

    human_present = any(
        term in t for term in HUMAN_EXPOSURE_TERMS
    )

    return line_of_fire, human_present


def precursor_assessment(text):
    energy = detect_energy(text)

    high_energy = energy != "UNKNOWN"

    line_of_fire, human_present = detect_exposure(text)

    triad = (
        high_energy
        and line_of_fire
        and human_present
    )

    if triad:
        state = "HIGH_SIF_PRECURSOR_POTENTIAL"
        band = "STRONG_PRECURSOR_EVIDENCE"

    elif high_energy and (
        line_of_fire or human_present
    ):
        state = "ELEVATED_SIF_PRECURSOR_POTENTIAL"
        band = "PARTIAL_PRECURSOR_TRIAD"

    elif high_energy:
        state = "POTENTIAL_REQUIRES_REVIEW"
        band = "ENERGY_PRESENT_EXPOSURE_UNCONFIRMED"

    elif line_of_fire and human_present:
        state = "POTENTIAL_REQUIRES_REVIEW"
        band = "EXPOSURE_PRESENT_ENERGY_UNCONFIRMED"

    else:
        state = "INSUFFICIENT_SIF_PRECURSOR_EVIDENCE"
        band = "INSUFFICIENT_TRIAD_EVIDENCE"

    return {
        "energy": energy,
        "high_energy": high_energy,
        "line_of_fire": line_of_fire,
        "human_present": human_present,
        "complete": triad,
        "state": state,
        "confidence_band": band,
    }


# ============================================================
# SIF PU MODEL
# ============================================================

def sif_affinity(text):
    X = SIF_FEATURES.transform([text])

    model = SIF_MODEL

    if hasattr(model, "decision_function"):
        score = float(model.decision_function(X)[0])

    elif hasattr(model, "predict_proba"):
        score = float(model.predict_proba(X)[0, 1])

    else:
        score = float(model.predict(X)[0])

    return score


# ============================================================
# IOGP V3
# ============================================================

def iogp_predictions(text):
    X_word = IOGP_WORD.transform([text])
    X_char = IOGP_CHAR.transform([text])

    X = hstack([
        X_word,
        X_char,
    ])

    probabilities = IOGP_MODEL.predict_proba(X)[0]

    predictions = []

    for idx, probability in enumerate(probabilities):

        rule_id = IOGP_ENCODER.classes_[idx]

        probability = float(probability)

        threshold = IOGP_THRESHOLDS.get(
            rule_id,
            0.50,
        )

        if probability >= threshold:
            predictions.append({
                "rule_id": rule_id,
                "rule_name": IOGP_NAMES.get(
                    rule_id,
                    rule_id,
                ),
                "score": probability,
                "threshold": threshold,
                "accepted": True,
            })

    predictions.sort(
        key=lambda x: x["score"],
        reverse=True,
    )

    return predictions


# ============================================================
# HSE TRIAGE
# ============================================================

def hse_triage(precursor, sif_score):
    if (
        precursor["complete"]
        or precursor["state"]
        == "ELEVATED_SIF_PRECURSOR_POTENTIAL"
        or sif_score >= 0.75
    ):
        return "PRIORITY REVIEW"

    if (
        precursor["state"]
        == "POTENTIAL_REQUIRES_REVIEW"
    ):
        return "REVIEW"

    return "ROUTINE"


# ============================================================
# EXPLANATION
# ============================================================

def build_explanation(
    precursor,
    iogp,
    sif_score,
    triage,
):
    reasons = []

    if precursor["high_energy"]:
        reasons.append(
            f"High-energy mechanism detected: "
            f"{precursor['energy']}"
        )

    if precursor["line_of_fire"]:
        reasons.append(
            "Line-of-fire exposure detected"
        )

    if precursor["human_present"]:
        reasons.append(
            "Potential human exposure detected"
        )

    if iogp:
        names = ", ".join(
            x["rule_name"] for x in iogp[:3]
        )
        reasons.append(
            f"IOGP rule candidates: {names}"
        )

    if not reasons:
        reasons.append(
            "No strong precursor signals were detected "
            "from the available text."
        )

    return {
        "triage": triage,
        "reasons": reasons,
        "sif_affinity_score": sif_score,
    }


# ============================================================
# MAIN LIVE ANALYSIS
# ============================================================

def analyze_report(text):
    text = str(text or "").strip()

    if not text:
        raise ValueError(
            "Safety report text cannot be empty."
        )

    precursor = precursor_assessment(text)

    sif_score = sif_affinity(text)

    iogp = iogp_predictions(text)

    triage = hse_triage(
        precursor,
        sif_score,
    )

    explanation = build_explanation(
        precursor,
        iogp,
        sif_score,
        triage,
    )

    return {
        "report_text": text,
        "precursor": precursor,
        "sif_affinity_score": sif_score,
        "iogp_predictions": iogp,
        "triage": triage,
        "explanation": explanation,
    }
