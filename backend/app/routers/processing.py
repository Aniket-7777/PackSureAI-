from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from ..services.processing_service import process_inspection

router = APIRouter(
    prefix="/api/processing",
    tags=["Processing"],
)


@router.post("/{inspection_id}/run")
def run_full_processing(
    inspection_id: str,
):
    try:
        return process_inspection(inspection_id)

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=(f"Inspection processing failed: {exc!s}"),
        ) from exc
