from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel

from ..database import supabase

router = APIRouter(
    prefix="/api/violations",
    tags=["Violations"],
)


class ResolveViolationRequest(BaseModel):
    resolved_by: str | None = None
    resolution_notes: str | None = None


@router.get("/inspection/{inspection_id}")
def get_inspection_violations(
    inspection_id: str,
):
    try:
        result = (
            supabase.table("violations")
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

        return {
            "success": True,
            "count": len(result.data or []),
            "data": result.data or [],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load violations: {exc}",
        ) from exc


@router.get("/{violation_id}")
def get_violation(
    violation_id: str,
):
    try:
        result = (
            supabase.table("violations")
            .select("*")
            .eq(
                "id",
                violation_id,
            )
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Violation not found",
            )

        return {
            "success": True,
            "data": result.data[0],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load violation: {exc}",
        ) from exc


@router.patch("/{violation_id}/resolve")
def resolve_violation(
    violation_id: str,
    request: ResolveViolationRequest,
):
    try:
        existing = (
            supabase.table("violations")
            .select("*")
            .eq(
                "id",
                violation_id,
            )
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Violation not found",
            )

        payload = {
            "is_resolved": True,
            "resolution_notes": request.resolution_notes,
        }

        if request.resolved_by:
            payload["resolved_by"] = request.resolved_by

        result = (
            supabase.table("violations")
            .update(payload)
            .eq(
                "id",
                violation_id,
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Violation could not be resolved",
            )

        return {
            "success": True,
            "message": "Violation resolved successfully",
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to resolve violation: {exc}",
        ) from exc


@router.patch("/{violation_id}/unresolve")
def unresolve_violation(
    violation_id: str,
):
    try:
        existing = (
            supabase.table("violations")
            .select("id")
            .eq(
                "id",
                violation_id,
            )
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Violation not found",
            )

        result = (
            supabase.table("violations")
            .update(
                {
                    "is_resolved": False,
                    "resolved_by": None,
                    "resolved_at": None,
                    "resolution_notes": None,
                }
            )
            .eq(
                "id",
                violation_id,
            )
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Violation could not be reopened",
            )

        return {
            "success": True,
            "message": "Violation reopened successfully",
            "data": result.data[0],
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reopen violation: {exc}",
        ) from exc


@router.get("/unresolved/all")
def get_unresolved_violations(
    limit: int = 50,
):
    try:
        limit = max(limit, 1)
        limit = min(limit, 100)

        result = (
            supabase.table("violations")
            .select("*")
            .eq(
                "is_resolved",
                False,
            )
            .order(
                "created_at",
                desc=True,
            )
            .limit(limit)
            .execute()
        )

        return {
            "success": True,
            "count": len(result.data or []),
            "data": result.data or [],
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(f"Failed to load unresolved violations: {exc}"),
        ) from exc
