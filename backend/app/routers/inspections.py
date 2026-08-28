from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel

from ..database import supabase

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])


class InspectionCreate(BaseModel):
    product_id: str | None = None
    officer_id: str | None = None
    location_id: str | None = None
    barcode: str | None = None
    notes: str | None = None


class InspectionUpdate(BaseModel):
    product_id: str | None = None
    officer_id: str | None = None
    location_id: str | None = None
    barcode: str | None = None
    status: str | None = None
    compliance_status: str | None = None
    compliance_score: float | None = None
    ocr_confidence: float | None = None
    notes: str | None = None
    completed_at: str | None = None


def generate_inspection_number():
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")

    return f"PKS-{timestamp}"


@router.get("/")
def get_inspections():
    try:
        result = (
            supabase.table("inspections")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "count": len(result.data or []),
            "data": result.data or [],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve inspections: {exc!s}"
        )


@router.get("/number/{inspection_number}")
def get_inspection_by_number(inspection_number: str):
    try:
        result = (
            supabase.table("inspections")
            .select("*")
            .eq("inspection_number", inspection_number)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Inspection not found")

        return {"success": True, "data": result.data[0]}

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve inspection: {exc!s}"
        )


@router.get("/barcode/{barcode}")
def get_inspections_by_barcode(barcode: str):
    barcode = barcode.strip()

    if not barcode:
        raise HTTPException(status_code=400, detail="Barcode is required")

    try:
        result = (
            supabase.table("inspections")
            .select("*")
            .eq("barcode", barcode)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "count": len(result.data or []),
            "data": result.data or [],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve inspections: {exc!s}"
        )


@router.get("/{inspection_id}")
def get_inspection(inspection_id: str):
    try:
        result = (
            supabase.table("inspections")
            .select("*")
            .eq("id", inspection_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Inspection not found")

        return {"success": True, "data": result.data[0]}

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve inspection: {exc!s}"
        )


@router.post("/")
def create_inspection(inspection: InspectionCreate):
    try:
        inspection_number = generate_inspection_number()

        payload = inspection.model_dump(exclude_none=True)

        payload["inspection_number"] = inspection_number
        payload["status"] = "draft"

        if "barcode" in payload:
            payload["barcode"] = payload["barcode"].strip()

        result = supabase.table("inspections").insert(payload).execute()

        if not result.data:
            raise HTTPException(
                status_code=500, detail="Inspection could not be created"
            )

        return {
            "success": True,
            "message": "Inspection created successfully",
            "inspection_number": inspection_number,
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to create inspection: {exc!s}"
        )


@router.patch("/{inspection_id}")
def update_inspection(inspection_id: str, inspection: InspectionUpdate):
    try:
        payload = inspection.model_dump(exclude_none=True)

        if not payload:
            raise HTTPException(status_code=400, detail="No fields provided for update")

        if "barcode" in payload:
            payload["barcode"] = payload["barcode"].strip()

        result = (
            supabase.table("inspections")
            .update(payload)
            .eq("id", inspection_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Inspection not found")

        return {
            "success": True,
            "message": "Inspection updated successfully",
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to update inspection: {exc!s}"
        )


@router.delete("/{inspection_id}")
def delete_inspection(inspection_id: str):
    try:
        existing = (
            supabase.table("inspections")
            .select("id")
            .eq("id", inspection_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(status_code=404, detail="Inspection not found")

        (supabase.table("inspections").delete().eq("id", inspection_id).execute())

        return {"success": True, "message": "Inspection deleted successfully"}

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete inspection: {exc!s}"
        )


@router.patch("/{inspection_id}/start")
def start_inspection(
    inspection_id: str,
):
    try:
        existing = (
            supabase.table("inspections")
            .select("id,status")
            .eq("id", inspection_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found",
            )

        current_status = existing.data[0].get("status")

        allowed_statuses = {
            "draft",
            "uploaded",
        }

        if current_status not in allowed_statuses:
            raise HTTPException(
                status_code=400,
                detail=(f"Inspection cannot be started from status '{current_status}'"),
            )

        result = (
            supabase.table("inspections")
            .update(
                {
                    "status": "processing",
                    "started_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("id", inspection_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Inspection could not be started",
            )

        return {
            "success": True,
            "message": "Inspection started",
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start inspection: {exc}",
        ) from exc


@router.patch("/{inspection_id}/complete")
def complete_inspection(
    inspection_id: str,
):
    try:
        existing = (
            supabase.table("inspections")
            .select("id,status")
            .eq("id", inspection_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found",
            )

        current_status = existing.data[0].get("status")

        if current_status not in {
            "processing",
            "uploaded",
        }:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Inspection cannot be completed from status '{current_status}'"
                ),
            )

        result = (
            supabase.table("inspections")
            .update(
                {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .eq("id", inspection_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Inspection could not be completed",
            )

        return {
            "success": True,
            "message": "Inspection completed",
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(f"Failed to complete inspection: {exc}"),
        ) from exc


@router.patch("/{inspection_id}/review-required")
def mark_review_required(
    inspection_id: str,
):
    try:
        existing = (
            supabase.table("inspections")
            .select("id")
            .eq("id", inspection_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found",
            )

        result = (
            supabase.table("inspections")
            .update(
                {
                    "status": "review_required",
                }
            )
            .eq("id", inspection_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail=("Inspection could not be marked for review"),
            )

        return {
            "success": True,
            "message": "Inspection marked for review",
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(f"Failed to mark inspection for review: {exc}"),
        ) from exc


@router.patch("/{inspection_id}/fail")
def fail_inspection(
    inspection_id: str,
):
    try:
        existing = (
            supabase.table("inspections")
            .select("id")
            .eq("id", inspection_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found",
            )

        result = (
            supabase.table("inspections")
            .update(
                {
                    "status": "failed",
                }
            )
            .eq("id", inspection_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Inspection could not be marked failed",
            )

        return {
            "success": True,
            "message": "Inspection marked as failed",
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to mark inspection failed: {exc}",
        ) from exc


@router.get("/{inspection_id}/status")
def get_inspection_status(
    inspection_id: str,
):
    try:
        result = (
            supabase.table("inspections")
            .select(
                "id,inspection_number,status,"
                "compliance_status,compliance_score,"
                "ocr_confidence,started_at,"
                "completed_at,updated_at"
            )
            .eq("id", inspection_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found",
            )

        return {
            "success": True,
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get inspection status: {exc}",
        ) from exc
