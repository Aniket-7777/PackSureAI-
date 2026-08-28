from typing import Any


def normalize(value: Any) -> str:
    if value is None:
        return ""

    return str(value).strip().lower()


def get_field_value(
    extracted_fields: list[dict[str, Any]],
    field_name: str | None
) -> dict[str, Any] | None:

    if not field_name:
        return None

    for field in extracted_fields:
        if field.get("field_name") == field_name:
            return field

    return None


def validate_required(
    field: dict[str, Any] | None
) -> dict[str, Any]:

    if not field:
        return {
            "status": "fail",
            "score": 0,
            "actual_value": None,
            "expected_value": "Value must be present",
            "confidence": 0.0
        }

    value = field.get("field_value")

    confidence = float(
        field.get("confidence") or 0
    )

    if value is None or not str(value).strip():
        return {
            "status": "fail",
            "score": 0,
            "actual_value": None,
            "expected_value": "Value must be present",
            "confidence": confidence
        }

    return {
        "status": "pass",
        "score": 100,
        "actual_value": str(value),
        "expected_value": "Value must be present",
        "confidence": confidence
    }


def validate_numeric(
    field: dict[str, Any] | None
) -> dict[str, Any]:

    if not field:
        return {
            "status": "fail",
            "score": 0,
            "actual_value": None,
            "expected_value": "Numeric value required",
            "confidence": 0.0
        }

    value = field.get("field_value")

    confidence = float(
        field.get("confidence") or 0
    )

    if value is None or not str(value).strip():
        return {
            "status": "fail",
            "score": 0,
            "actual_value": None,
            "expected_value": "Numeric value required",
            "confidence": confidence
        }

    cleaned = (
        str(value)
        .replace(",", "")
        .replace("₹", "")
        .replace("Rs.", "")
        .replace("Rs", "")
        .strip()
    )

    try:
        float(cleaned)

        return {
            "status": "pass",
            "score": 100,
            "actual_value": str(value),
            "expected_value": "Valid numeric value",
            "confidence": confidence
        }

    except (ValueError, TypeError):

        return {
            "status": "fail",
            "score": 0,
            "actual_value": str(value),
            "expected_value": "Valid numeric value",
            "confidence": confidence
        }


def validate_required_any(
    extracted_fields: list[dict[str, Any]],
    fields: list[str]
) -> dict[str, Any]:

    for field_name in fields:

        field = get_field_value(
            extracted_fields,
            field_name
        )

        if (
            field
            and field.get("field_value")
            and str(
                field.get("field_value")
            ).strip()
        ):
            return {
                "status": "pass",
                "score": 100,
                "actual_value": str(
                    field.get("field_value")
                ),
                "expected_value":
                    "At least one applicable entity declaration must be present",
                "confidence": float(
                    field.get("confidence") or 0
                ),
                "matched_field": field
            }

    return {
        "status": "fail",
        "score": 0,
        "actual_value": None,
        "expected_value":
            "At least one applicable entity declaration must be present",
        "confidence": 0.0,
        "matched_field": None
    }


def evaluate_rule(
    rule: dict[str, Any],
    extracted_fields: list[dict[str, Any]]
) -> dict[str, Any]:

    field_name = rule.get("field_name")

    field = get_field_value(
        extracted_fields,
        field_name
    )

    validation_type = normalize(
        rule.get("validation_type")
    )

    config = rule.get(
        "validation_config"
    ) or {}

    confidence = 0.0

    if field:
        confidence = float(
            field.get("confidence") or 0
        )

    # ==================================================
    # SPECIAL RULES
    # ==================================================

    if validation_type in {
        "font_dimension",
        "font_size",
        "dimension",
        "conditional_qr_validation"
    }:

        return {
            "rule": rule,
            "field": field,
            "status": "needs_review",
            "score": 50,
            "actual_value": (
                str(
                    field.get("field_value")
                )
                if field
                else None
            ),
            "expected_value":
                rule.get("requirement"),
            "confidence": confidence
        }

    # ==================================================
    # REQUIRED FIELD
    # ==================================================

    if validation_type in {
        "required",
        "mandatory",
        "presence"
    }:

        result = validate_required(
            field
        )

    # ==================================================
    # NUMERIC FIELD
    # ==================================================

    elif validation_type in {
        "required_numeric",
        "numeric"
    }:

        result = validate_numeric(
            field
        )

    # ==================================================
    # REQUIRED ANY
    # ==================================================

    elif validation_type == "required_any":

        fields = config.get(
            "fields",
            []
        )

        if not isinstance(fields, list):
            fields = []

        result = validate_required_any(
            extracted_fields,
            fields
        )

        field = result.pop(
            "matched_field",
            field
        )

    # ==================================================
    # DATE DECLARATION
    # ==================================================

    elif validation_type in {
    "date",
    "required_date",
    "date_declaration",
    "unit_sale_price",
    "unit_price",
}:
     result = validate_required(field)
    # ==================================================
    # UNKNOWN VALIDATION
    # ==================================================

    else:

        if (
            field
            and field.get("field_value")
        ):

            result = {
                "status": "unknown",
                "score": 50,
                "actual_value":
                    str(
                        field.get(
                            "field_value"
                        )
                    ),
                "expected_value":
                    rule.get(
                        "requirement"
                    ),
                "confidence":
                    confidence
            }

        else:

            result = {
                "status": "unknown",
                "score": 0,
                "actual_value": None,
                "expected_value":
                    rule.get(
                        "requirement"
                    ),
                "confidence": 0.0
            }

    # ==================================================
    # LOW OCR CONFIDENCE
    # ==================================================

    if (
        result.get("status") == "pass"
        and confidence > 0
        and confidence < 0.60
    ):

        result["status"] = "needs_review"
        result["score"] = 50

        # ==================================================
    # HUMAN REVIEW FLAG
    # ==================================================

    if (
        rule.get("requires_human_review") is True
        and result.get("status") == "pass"
        and confidence < 0.75
    ):
        result["status"] = "needs_review"
        result["score"] = 50

    return {
        "rule": rule,
        "field": field,
        **result,
    }

def calculate_compliance_score(
    results: list[dict[str, Any]]
) -> float:

    if not results:
        return 0.0

    total_weight = 0.0
    weighted_score = 0.0

    severity_weights = {
        "critical": 1.5,
        "high": 1.25,
        "medium": 1.0,
        "low": 0.75
    }

    for result in results:

        rule = result.get(
            "rule"
        ) or {}

        severity = normalize(
            rule.get("severity")
        )

        weight = severity_weights.get(
            severity,
            1.0
        )

        score = float(
            result.get("score") or 0
        )

        weighted_score += (
            score * weight
        )

        total_weight += weight

    if total_weight == 0:
        return 0.0

    return round(
        weighted_score / total_weight,
        2
    )


def calculate_compliance_status(
    results: list[dict[str, Any]]
) -> str:

    if not results:
        return "review_required"

    if any(
        result.get("status") == "fail"
        for result in results
    ):
        return "non_compliant"

    if any(
        result.get("status") == "needs_review"
        for result in results
    ):
        return "review_required"

    if any(
        result.get("status") == "unknown"
        for result in results
    ):
        return "review_required"

    return "compliant"