from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field

from ..database import supabase

router = APIRouter(
    prefix="/api/scanner",
    tags=["Scanner"]
)


class BarcodeLookup(BaseModel):
    barcode: str = Field(..., min_length=1)


@router.post("/lookup")
def lookup_barcode(data: BarcodeLookup):
    barcode = data.barcode.strip()

    if not barcode:
        raise HTTPException(
            status_code=400,
            detail="Barcode is required"
        )

    try:
        result = (
            supabase
            .table("products")
            .select("*")
            .eq("barcode", barcode)
            .limit(1)
            .execute()
        )

        if result.data:
            return {
                "success": True,
                "found": True,
                "barcode": barcode,
                "message": "Product found",
                "data": result.data[0]
            }

        return {
            "success": True,
            "found": False,
            "barcode": barcode,
            "message": (
                "Barcode scanned successfully, "
                "but product is not yet registered"
            ),
            "data": None
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Barcode lookup failed: {exc!s}"
        )


@router.get("/{barcode}")
def get_barcode(barcode: str):
    barcode = barcode.strip()

    if not barcode:
        raise HTTPException(
            status_code=400,
            detail="Barcode is required"
        )

    try:
        result = (
            supabase
            .table("products")
            .select("*")
            .eq("barcode", barcode)
            .limit(1)
            .execute()
        )

        if not result.data:
            return {
                "success": True,
                "found": False,
                "barcode": barcode,
                "data": None
            }

        return {
            "success": True,
            "found": True,
            "barcode": barcode,
            "data": result.data[0]
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Barcode lookup failed: {exc!s}"
        )