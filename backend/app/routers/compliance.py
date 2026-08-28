from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from ..database import supabase
from ..services.compliance_service import (
    calculate_compliance_score,
    calculate_compliance_status,
    evaluate_rule,
)

router = APIRouter(
    prefix="/api/compliance",
    tags=["Compliance"],
)


def normalize(value: Any) -> str:
    if value is None:
        return ""

    return str(value).strip().lower()


def today_utc():
    return datetime.now(timezone.utc).date()


def parse_date(value: Any):
    if not value:
        return today_utc()

    value = str(value)

    try:
        return datetime.strptime(
            value[:10],
            "%Y-%m-%d",
        ).replace(
            tzinfo=timezone.utc
        ).date()
    except ValueError:
        return today_utc()


def get_inspection(
    inspection_id: str,
) -> dict[str, Any]:

    result = (
        supabase
        .table("inspections")
        .select("*")
        .eq("id", inspection_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Inspection not found",
        )

    return result.data[0]


def get_extracted_fields(
    inspection_id: str,
) -> list[dict[str, Any]]:

    result = (
        supabase
        .table("extracted_fields")
        .select("*")
        .eq(
            "inspection_id",
            inspection_id,
        )
        .order(
            "created_at",
            desc=False,
        )
        .execute()
    )

    return result.data or []


def get_active_rules() -> list[dict[str, Any]]:

    result = (
        supabase
        .table("compliance_rules")
        .select("*")
        .eq(
            "status",
            "active",
        )
        .execute()
    )

    return result.data or []


def get_rule_versions(
    rule_id: str,
) -> list[dict[str, Any]]:

    result = (
        supabase
        .table("rule_versions")
        .select("*")
        .eq(
            "rule_id",
            rule_id,
        )
        .eq(
            "status",
            "active",
        )
        .order(
            "version_number",
            desc=True,
        )
        .execute()
    )

    return result.data or []


def get_latest_valid_rule_version(
    rule: dict[str, Any],
) -> dict[str, Any] | None:

    versions = get_rule_versions(
        rule["id"]
    )

    if not versions:
        return None

    current_date = today_utc()

    for version in versions:

        effective_from = parse_date(
            version.get("effective_from")
        )

        effective_to = (
            parse_date(
                version.get("effective_to")
            )
            if version.get("effective_to")
            else None
        )

        if effective_from > current_date:
            continue

        if (
            effective_to is not None
            and effective_to < current_date
        ):
            continue

        return version

    return None


def get_applicability(
    rule_id: str,
) -> list[dict[str, Any]]:

    result = (
        supabase
        .table("rule_applicability")
        .select("*")
        .eq(
            "rule_id",
            rule_id,
        )
        .execute()
    )

    return result.data or []


def get_category_from_fields(
    inspection: dict[str, Any],
    extracted_fields: list[dict[str, Any]],
) -> tuple[str, str | None, float]:

    category = normalize(
        inspection.get("category")
    )

    subcategory = normalize(
        inspection.get("subcategory")
    )

    confidence = 0.0

    if category:
        confidence = 0.8

    for field in extracted_fields:

        field_name = normalize(
            field.get("field_name")
        )

        value = normalize(
            field.get("field_value")
        )

        field_confidence = float(
            field.get("confidence") or 0
        )

        if field_name == "category" and value:
            category = value
            confidence = max(
                confidence,
                field_confidence,
            )

        if field_name == "subcategory" and value:
            subcategory = value
            confidence = max(
                confidence,
                field_confidence,
            )

    if not category:
        category = "packaged_commodity"
        confidence = 0.4

    return (
        category,
        subcategory or None,
        round(confidence, 4),
    )


def applicability_matches(
    applicability: dict[str, Any],
    category: str,
    subcategory: str | None,
    inspection: dict[str, Any],
) -> bool:

    configured_category = normalize(
        applicability.get("product_category")
    )

    configured_subcategory = normalize(
        applicability.get("product_subcategory")
    )

    configured_pack_type = normalize(
        applicability.get("pack_type")
    )

    configured_country = normalize(
        applicability.get("country")
    )

    inspection_pack_type = normalize(
        inspection.get("pack_type")
    )

    inspection_country = normalize(
        inspection.get("country_of_origin")
        or inspection.get("country")
    )

    if (
        configured_category
        and configured_category != normalize(category)
    ):
        return False

    if (
        configured_subcategory
        and configured_subcategory
        != normalize(subcategory)
    ):
        return False

    if (
        configured_pack_type
        and configured_pack_type
        != inspection_pack_type
    ):
        return False

    if (
        configured_country
        and configured_country
        != inspection_country
    ):
        return False

    quantity_min = applicability.get(
        "quantity_min"
    )

    quantity_max = applicability.get(
        "quantity_max"
    )

    if (
        quantity_min is not None
        or quantity_max is not None
    ):

        quantity = get_quantity(
            inspection
        )

        if quantity is None:
            return False

        if (
            quantity_min is not None
            and quantity < float(quantity_min)
        ):
            return False

        if (
            quantity_max is not None
            and quantity > float(quantity_max)
        ):
            return False

    return True


def get_quantity(
    inspection: dict[str, Any],
) -> float | None:

    value = (
        inspection.get("net_quantity")
        or inspection.get("quantity")
    )

    if value is None:
        return None

    try:
        cleaned = (
            str(value)
            .replace(",", "")
            .strip()
        )

        return float(cleaned)

    except (ValueError, TypeError):
        return None


def rule_category_matches(
    rule: dict[str, Any],
    category: str,
) -> bool:

    configured_categories = (
        rule.get("product_categories")
        or []
    )

    if not configured_categories:
        return True

    if isinstance(
        configured_categories,
        str,
    ):
        configured_categories = [
            configured_categories
        ]

    normalized_categories = {
        normalize(item)
        for item in configured_categories
    }

    return (
        normalize(category)
        in normalized_categories
    )


def merge_rule_version(
    rule: dict[str, Any],
    version: dict[str, Any],
) -> dict[str, Any]:

    merged = dict(rule)

    merged.update(
        {
            "rule_version_id": version.get("id"),
            "version_number": version.get(
                "version_number"
            ),
            "rule_text": version.get(
                "rule_text"
            ),
            "requirement": version.get(
                "requirement"
            ),
            "validation_type": version.get(
                "validation_type"
            ),
            "validation_config": (
                version.get(
                    "validation_config"
                )
                or {}
            ),
            "effective_from": version.get(
                "effective_from"
            ),
            "effective_to": version.get(
                "effective_to"
            ),
            "source_id": (
                version.get("source_id")
                or rule.get("source_id")
            ),
        }
    )

    return merged


def get_applicable_rules(
    inspection: dict[str, Any],
    extracted_fields: list[dict[str, Any]],
) -> tuple[
    list[dict[str, Any]],
    str,
    str | None,
    float,
]:

    category, subcategory, confidence = (
        get_category_from_fields(
            inspection,
            extracted_fields,
        )
    )

    applicable_rules = []

    rules = get_active_rules()

    for rule in rules:

        if not rule_category_matches(
            rule,
            category,
        ):
            continue

        version = get_latest_valid_rule_version(
            rule
        )

        if version is None:
            continue

        applicability_rows = (
            get_applicability(
                rule["id"]
            )
        )

        if applicability_rows:

            matched = any(
                applicability_matches(
                    applicability,
                    category,
                    subcategory,
                    inspection,
                )
                for applicability
                in applicability_rows
            )

            if not matched:
                continue

        elif rule.get("product_categories"):
            continue

        merged_rule = merge_rule_version(
            rule,
            version,
        )

        applicable_rules.append(
            merged_rule
        )

    return (
        applicable_rules,
        category,
        subcategory,
        confidence,
    )


def create_compliance_run(
    inspection_id: str,
) -> dict[str, Any]:

    payload = {
        "inspection_id": inspection_id,
        "overall_status": "processing",
        "total_rules": 0,
        "passed_rules": 0,
        "failed_rules": 0,
        "unknown_rules": 0,
        "skipped_rules": 0,
        "compliance_score": None,
    }

    result = (
        supabase
        .table("compliance_runs")
        .insert(payload)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to create compliance run",
        )

    return result.data[0]


def update_compliance_run(
    run_id: str,
    results: list[dict[str, Any]],
    score: float,
    status: str,
) -> dict[str, Any]:
    passed = sum(
        1
        for result in results
        if result.get("status") == "pass"
    )

    failed = sum(
        1
        for result in results
        if result.get("status") == "fail"
    )

    unknown = sum(
        1
        for result in results
        if result.get("status") == "unknown"
    )

    skipped = sum(
        1
        for result in results
        if result.get("status")
        in {"skipped", "needs_review"}
    )

    payload = {
        "overall_status": status,
        "total_rules": len(results),
        "passed_rules": passed,
        "failed_rules": failed,
        "unknown_rules": unknown,
        "skipped_rules": skipped,
        "compliance_score": score,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }

    result = (
        supabase
        .table("compliance_runs")
        .update(payload)
        .eq(
            "id",
            run_id,
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to update compliance run",
        )

    return result.data[0]

def delete_old_results(
    inspection_id: str,
) -> None:

    supabase.table(
        "compliance_results"
    ).delete().eq(
        "inspection_id",
        inspection_id,
    ).execute()


def save_compliance_results(
    inspection_id: str,
    compliance_run_id: str,
    results: list[dict[str, Any]],
) -> list[dict[str, Any]]:

    rows = []

    for result in results:

        rule = result.get("rule") or {}

        row = {
            "inspection_id": inspection_id,
            "compliance_run_id": compliance_run_id,
            "rule_id": rule.get("id"),
            "rule_version_id": (
                rule.get("rule_version_id")
            ),
            "status": result.get(
                "status",
                "unknown",
            ),
            "score": float(
                result.get("score") or 0
            ),
            "actual_value": result.get(
                "actual_value"
            ),
            "expected_value": result.get(
                "expected_value"
            ),
            "confidence": float(
                result.get("confidence") or 0
            ),
        }

        rows.append(row)

    if not rows:
        return []

    inserted = (
        supabase
        .table("compliance_results")
        .insert(rows)
        .execute()
    )

    return inserted.data or []


def update_inspection(
    inspection_id: str,
    score: float,
    status: str,
) -> dict[str, Any]:

    payload = {
        "compliance_score": score,
        "compliance_status": status,
        "status": "completed",
    }

    result = (
        supabase
        .table("inspections")
        .update(payload)
        .eq(
            "id",
            inspection_id,
        )
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=500,
            detail="Failed to update inspection",
        )

    return result.data[0]


@router.get("/rules")
def list_rules():

    try:
        rules = get_active_rules()

        return {
            "success": True,
            "count": len(rules),
            "data": rules,
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to retrieve compliance rules: "
                f"{exc!s}"
            ),
        ) from exc


@router.get("/rules/{rule_code}")
def get_rule(
    rule_code: str,
):

    try:
        result = (
            supabase
            .table("compliance_rules")
            .select("*")
            .eq(
                "rule_code",
                rule_code,
            )
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Compliance rule not found",
            )

        rule = result.data[0]

        version = get_latest_valid_rule_version(
            rule
        )

        return {
            "success": True,
            "data": {
                "rule": rule,
                "version": version,
                "applicability": get_applicability(
                    rule["id"]
                ),
            },
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to retrieve compliance rule: "
                f"{exc!s}"
            ),
        ) from exc


@router.get("/inspection/{inspection_id}")
def get_inspection_compliance(
    inspection_id: str,
):

    try:
        inspection = get_inspection(
            inspection_id
        )

        results = (
            supabase
            .table("compliance_results")
            .select("*")
            .eq(
                "inspection_id",
                inspection_id,
            )
            .order(
                "created_at",
                desc=False,
            )
            .execute()
        )

        runs = (
            supabase
            .table("compliance_runs")
            .select("*")
            .eq(
                "inspection_id",
                inspection_id,
            )
            .order(
                "created_at",
                desc=True,
            )
            .limit(10)
            .execute()
        )

        return {
            "success": True,
            "inspection": inspection,
            "results": results.data or [],
            "runs": runs.data or [],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to retrieve compliance data: "
                f"{exc!s}"
            ),
        ) from exc


@router.post("/run/{inspection_id}")
def run_compliance(
    inspection_id: str,
):

    try:
        inspection = get_inspection(
            inspection_id
        )

        extracted_fields = (
            get_extracted_fields(
                inspection_id
            )
        )

        rules, category, subcategory, category_confidence = (
            get_applicable_rules(
                inspection,
                extracted_fields,
            )
        )

        run = create_compliance_run(
            inspection_id
        )

        run_id = run["id"]

        evaluated_results = []

        for rule in rules:

            result = evaluate_rule(
                rule,
                extracted_fields,
            )

            evaluated_results.append(
                result
            )

        score = calculate_compliance_score(
            evaluated_results
        )

        compliance_status = (
            calculate_compliance_status(
                evaluated_results
            )
        )

        delete_old_results(
            inspection_id
        )

        saved_results = save_compliance_results(
            inspection_id,
            run_id,
            evaluated_results,
        )

        update_compliance_run(
            run_id,
            evaluated_results,
            score,
            "completed",
        )

        updated_inspection = update_inspection(
            inspection_id,
            score,
            compliance_status,
        )

        return {
            "success": True,
            "message": (
                "Compliance evaluation completed successfully"
            ),
            "inspection_id": inspection_id,
            "compliance_run_id": run_id,
            "category": category,
            "subcategory": subcategory,
            "category_confidence": (
                category_confidence
            ),
            "total_rules": len(
                evaluated_results
            ),
            "passed_rules": sum(
                1
                for item in evaluated_results
                if item.get("status") == "pass"
            ),
            "failed_rules": sum(
                1
                for item in evaluated_results
                if item.get("status") == "fail"
            ),
            "review_required_rules": sum(
                1
                for item in evaluated_results
                if item.get("status")
                == "needs_review"
            ),
            "compliance_score": score,
            "compliance_status": (
                compliance_status
            ),
            "results": saved_results,
            "inspection": updated_inspection,
        }

    except HTTPException:
        raise

    except APIError as exc:

        try:
            (
                supabase
                .table("compliance_runs")
                .update(
                    {
                        "overall_status": "failed"
                    }
                )
                .eq(
                    "inspection_id",
                    inspection_id,
                )
                .eq(
                    "overall_status",
                    "processing",
                )
                .execute()
            )

        except APIError:
            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "Compliance evaluation failed: "
                f"{exc!s}"
            ),
        ) from exc

    except Exception as exc:

        try:
            (
                supabase
                .table("compliance_runs")
                .update(
                    {
                        "overall_status": "failed"
                    }
                )
                .eq(
                    "inspection_id",
                    inspection_id,
                )
                .eq(
                    "overall_status",
                    "processing",
                )
                .execute()
            )

        except APIError:
            pass

        raise HTTPException(
            status_code=500,
            detail=(
                "Compliance evaluation failed: "
                f"{exc!s}"
            ),
        ) from exc