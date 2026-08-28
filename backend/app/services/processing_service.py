from typing import Any
from uuid import UUID

from fastapi import HTTPException
from postgrest.exceptions import APIError

from ..database import supabase
from ..routers.compliance import run_compliance
from ..routers.ocr import process_inspection_ocr


def get_inspection(
    inspection_id: str,
) -> dict[str, Any]:
    result = (
        supabase.table("inspections")
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


def get_inspection_images(
    inspection_id: str,
) -> list[dict[str, Any]]:
    result = (
        supabase.table("inspection_images")
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


def process_inspection(
    inspection_id: str,
) -> dict[str, Any]:

    inspection_id = inspection_id.strip().strip('"').strip("'")

    try:
        UUID(inspection_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail="Invalid inspection ID",
        ) from exc

    try:
        inspection = get_inspection(inspection_id)

        images = get_inspection_images(inspection_id)

        if not images:
            raise HTTPException(
                status_code=400,
                detail=("No evidence images found for this inspection"),
            )

        current_status = inspection.get("status")

        if current_status in {
            "completed",
            "review_required",
        }:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Inspection has already been "
                    f"processed with status "
                    f"'{current_status}'"
                ),
            )

        (
            supabase.table("inspections")
            .update(
                {
                    "status": "processing",
                }
            )
            .eq(
                "id",
                inspection_id,
            )
            .execute()
        )

        ocr_response = process_inspection_ocr(inspection_id)

        compliance_response = run_compliance(inspection_id)

        final_inspection = get_inspection(inspection_id)

        return {
            "success": True,
            "message": ("Inspection processing completed successfully"),
            "inspection_id": inspection_id,
            "inspection_number": final_inspection.get("inspection_number"),
            "status": final_inspection.get("status"),
            "compliance_status": final_inspection.get("compliance_status"),
            "compliance_score": final_inspection.get("compliance_score"),
            "ocr": ocr_response,
            "compliance": compliance_response,
        }

    except HTTPException:
        raise

    except APIError as exc:
        try:
            (
                supabase.table("inspections")
                .update(
                    {
                        "status": "failed",
                    }
                )
                .eq(
                    "id",
                    inspection_id,
                )
                .execute()
            )

        except APIError as cleanup_exc:
            print(f"Failed to mark inspection as failed: {cleanup_exc!s}")

        raise HTTPException(
            status_code=500,
            detail=(f"Inspection processing failed: {exc!s}"),
        ) from exc
