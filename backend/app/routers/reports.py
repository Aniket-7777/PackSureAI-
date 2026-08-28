from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from postgrest.exceptions import APIError

from ..database import supabase
from ..services.report_service import build_compliance_pdf

router = APIRouter(
    prefix="/api/reports",
    tags=["Reports"],
)


def get_one(
    table: str,
    column: str,
    value: str,
) -> dict[str, Any] | None:
    result = (
        supabase
        .table(table)
        .select("*")
        .eq(column, value)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    return None


def get_latest_compliance_run(
    inspection_id: str,
) -> dict[str, Any] | None:
    result = (
        supabase
        .table("compliance_runs")
        .select("*")
        .eq("inspection_id", inspection_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    return None


def get_latest_fields(
    inspection_id: str,
) -> list[dict[str, Any]]:
    result = (
        supabase
        .table("extracted_fields")
        .select("*")
        .eq("inspection_id", inspection_id)
        .order("created_at", desc=True)
        .execute()
    )

    rows = result.data or []

    latest: dict[str, dict[str, Any]] = {}

    for row in rows:
        field_name = row.get("field_name")

        if field_name and field_name not in latest:
            latest[field_name] = row

    return list(latest.values())


def build_product_fallback(
    inspection: dict[str, Any],
    fields: list[dict[str, Any]],
) -> dict[str, Any] | None:
    values: dict[str, Any] = {}

    for field in fields:
        field_name = field.get("field_name")

        if field_name and field_name not in values:
            values[field_name] = (
                field.get("normalized_value")
                or field.get("field_value")
            )

    product_name = (
        values.get("product_name")
        or inspection.get("product_name")
    )

    brand_name = (
        values.get("brand_name")
        or inspection.get("brand_name")
    )

    barcode = (
        values.get("barcode")
        or inspection.get("barcode")
    )

    net_quantity = values.get("net_quantity")
    unit = values.get("unit")
    mrp = values.get("mrp")

    manufacturer_name = values.get(
        "manufacturer_name"
    )

    packer_name = values.get(
        "packer_name"
    )

    importer_name = values.get(
        "importer_name"
    )

    manufacturing_date = values.get(
        "manufacturing_date"
    )

    expiry_date = values.get(
        "expiry_date"
    )

    batch_number = values.get(
        "batch_number"
    )

    consumer_care = values.get(
        "consumer_care"
    )

    has_data = any(
        value is not None
        for value in (
            product_name,
            brand_name,
            barcode,
            net_quantity,
            unit,
            mrp,
            manufacturer_name,
            packer_name,
            importer_name,
            manufacturing_date,
            expiry_date,
            batch_number,
            consumer_care,
        )
    )

    if not has_data:
        return None

    return {
        "product_name": product_name,
        "brand_name": brand_name,
        "barcode": barcode,
        "net_quantity": net_quantity,
        "unit": unit,
        "mrp": mrp,
        "manufacturer_name": manufacturer_name,
        "packer_name": packer_name,
        "importer_name": importer_name,
        "manufacturing_date": manufacturing_date,
        "expiry_date": expiry_date,
        "batch_number": batch_number,
        "consumer_care": consumer_care,
        "source": "ocr_extraction",
    }


def get_report_data(
    inspection_id: str,
) -> dict[str, Any]:
    inspection = get_one(
        "inspections",
        "id",
        inspection_id,
    )

    if not inspection:
        raise HTTPException(
            status_code=404,
            detail="Inspection not found",
        )

    evidence_result = (
        supabase
        .table("inspection_images")
        .select("*")
        .eq("inspection_id", inspection_id)
        .order("created_at", desc=False)
        .execute()
    )

    evidence = evidence_result.data or []

    ocr_result = (
        supabase
        .table("ocr_results")
        .select("*")
        .eq("inspection_id", inspection_id)
        .order("created_at", desc=True)
        .execute()
    )

    ocr_results = ocr_result.data or []

    fields = get_latest_fields(
        inspection_id
    )

    product = None

    product_id = inspection.get(
        "product_id"
    )

    if product_id:
        product = get_one(
            "products",
            "id",
            product_id,
        )

    if product is None:
        product = build_product_fallback(
            inspection,
            fields,
        )

    latest_run = get_latest_compliance_run(
        inspection_id
    )

    compliance_results: list[dict[str, Any]] = []

    if latest_run:
        result_query = (
            supabase
            .table("compliance_results")
            .select("*")
            .eq(
                "compliance_run_id",
                latest_run["id"],
            )
            .order(
                "checked_at",
                desc=False,
            )
            .execute()
        )

        compliance_results = (
            result_query.data or []
        )

    violations_result = (
        supabase
        .table("violations")
        .select("*")
        .eq(
            "inspection_id",
            inspection_id,
        )
        .order(
            "created_at",
            desc=True,
        )
        .execute()
    )

    violations = (
        violations_result.data or []
    )

    total_rules = len(
        compliance_results
    )

    passed_rules = sum(
        1
        for item in compliance_results
        if item.get("status") == "pass"
    )

    failed_rules = sum(
        1
        for item in compliance_results
        if item.get("status") == "fail"
    )

    review_rules = sum(
        1
        for item in compliance_results
        if item.get("status")
        in {
            "needs_review",
            "review",
        }
    )

    unknown_rules = sum(
        1
        for item in compliance_results
        if item.get("status") == "unknown"
    )

    skipped_rules = sum(
        1
        for item in compliance_results
        if item.get("status") == "skipped"
    )

    resolved_violations = sum(
        1
        for item in violations
        if item.get("is_resolved") is True
    )

    unresolved_violations = (
        len(violations)
        - resolved_violations
    )

    report = {
        "report_type":
            "packaged_commodity_compliance",

        "inspection":
            inspection,

        "product":
            product,

        "latest_compliance_run":
            latest_run,

        "summary": {
            "compliance_status":
                inspection.get(
                    "compliance_status"
                ),

            "compliance_score":
                inspection.get(
                    "compliance_score"
                ),

            "ocr_confidence":
                inspection.get(
                    "ocr_confidence"
                ),

            "total_rules":
                total_rules,

            "passed_rules":
                passed_rules,

            "failed_rules":
                failed_rules,

            "needs_review":
                review_rules,

            "unknown_rules":
                unknown_rules,

            "skipped_rules":
                skipped_rules,

            "total_violations":
                len(violations),

            "resolved_violations":
                resolved_violations,

            "unresolved_violations":
                unresolved_violations,
        },

        "evidence":
            evidence,

        "ocr": {
            "results":
                ocr_results,

            "extracted_fields":
                fields,
        },

        "compliance": {
            "run":
                latest_run,

            "results":
                compliance_results,
        },

        "violations":
            violations,
    }

    return report


@router.get("/{inspection_id}")
def get_inspection_report(
    inspection_id: str,
):
    try:
        report = get_report_data(
            inspection_id
        )

        return {
            "success": True,
            "data": report,
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate report: "
                f"{exc!s}"
            ),
        ) from exc


@router.get("/{inspection_id}/summary")
def get_report_summary(
    inspection_id: str,
):
    try:
        report = get_report_data(
            inspection_id
        )

        summary = report["summary"]
        inspection = report["inspection"]

        return {
            "success": True,
            "data": {
                "inspection_id":
                    inspection_id,

                "inspection_number":
                    inspection.get(
                        "inspection_number"
                    ),

                "status":
                    inspection.get(
                        "status"
                    ),

                "compliance_status":
                    summary.get(
                        "compliance_status"
                    ),

                "compliance_score":
                    summary.get(
                        "compliance_score"
                    ),

                "total_rules":
                    summary.get(
                        "total_rules"
                    ),

                "passed":
                    summary.get(
                        "passed_rules"
                    ),

                "failed":
                    summary.get(
                        "failed_rules"
                    ),

                "needs_review":
                    summary.get(
                        "needs_review"
                    ),

                "violations":
                    summary.get(
                        "total_violations"
                    ),
            },
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to retrieve report summary: "
                f"{exc!s}"
            ),
        ) from exc


@router.get("/{inspection_id}/pdf")
def download_inspection_report(
    inspection_id: str,
):
    try:
        report = get_report_data(
            inspection_id
        )

        inspection = report[
            "inspection"
        ]

        pdf = build_compliance_pdf(
            report
        )

        inspection_number = (
            inspection.get(
                "inspection_number"
            )
            or inspection_id
        )

        filename = (
            f"{inspection_number}"
            "_compliance_report.pdf"
        )

        return StreamingResponse(
            pdf,
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    (
                        'attachment; '
                        f'filename="{filename}"'
                    ),
            },
        )

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to generate PDF: "
                f"{exc!s}"
            ),
        ) from exc