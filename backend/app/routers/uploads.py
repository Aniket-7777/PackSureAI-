from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from ..database import supabase

router = APIRouter(
    prefix="/api/evidence",
    tags=["Evidence"],
)


@router.get("/{inspection_id}/summary")
def get_evidence_summary(
    inspection_id: str,
):
    """
    Return a compact evidence summary for an inspection.
    """

    try:
        inspection = (
            supabase.table("inspections")
            .select("id, inspection_number")
            .eq(
                "id",
                inspection_id,
            )
            .limit(1)
            .execute()
        )

        if not inspection.data:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found",
            )

        result = (
            supabase.table("inspection_images")
            .select(
                "id, image_type, file_name, "
                "mime_type, file_size, "
                "capture_sequence, created_at"
            )
            .eq(
                "inspection_id",
                inspection_id,
            )
            .order(
                "capture_sequence",
                desc=False,
            )
            .execute()
        )

        images = result.data or []

        total_size = sum(image.get("file_size") or 0 for image in images)

        return {
            "success": True,
            "inspection": inspection.data[0],
            "total_images": len(images),
            "total_size_bytes": total_size,
            "images": images,
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(f"Failed to retrieve evidence summary: {exc!s}"),
        ) from exc


@router.get("/image/{image_id}")
def get_evidence_image(
    image_id: str,
):
    """
    Retrieve a single evidence record.
    """

    try:
        result = (
            supabase.table("inspection_images")
            .select("*")
            .eq(
                "id",
                image_id,
            )
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Evidence not found",
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
            detail=(f"Failed to retrieve evidence: {exc!s}"),
        ) from exc
