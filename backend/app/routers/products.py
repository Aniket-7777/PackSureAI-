
from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field

from ..database import supabase

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


class ProductCreate(BaseModel):
    barcode: str = Field(..., min_length=1)

    product_name: str | None = None
    brand_name: str | None = None

    category: str | None = None
    subcategory: str | None = None

    manufacturer_name: str | None = None
    manufacturer_address: str | None = None

    packer_name: str | None = None
    packer_address: str | None = None

    importer_name: str | None = None
    importer_address: str | None = None

    net_quantity: str | None = None
    unit: str | None = None

    mrp: float | None = None
    currency: str | None = "INR"

    manufacturing_date: str | None = None
    expiry_date: str | None = None

    batch_number: str | None = None

    consumer_care: str | None = None

    country_of_origin: str | None = None

    product_description: str | None = None


class ProductUpdate(BaseModel):
    barcode: str | None = None

    product_name: str | None = None
    brand_name: str | None = None

    category: str | None = None
    subcategory: str | None = None

    manufacturer_name: str | None = None
    manufacturer_address: str | None = None

    packer_name: str | None = None
    packer_address: str | None = None

    importer_name: str | None = None
    importer_address: str | None = None

    net_quantity: str | None = None
    unit: str | None = None

    mrp: float | None = None
    currency: str | None = None

    manufacturing_date: str | None = None
    expiry_date: str | None = None

    batch_number: str | None = None

    consumer_care: str | None = None

    country_of_origin: str | None = None

    product_description: str | None = None


@router.get("/")
def get_products():
    try:
        result = (
            supabase
            .table("products")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "count": len(result.data or []),
            "data": result.data or []
        }

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve products: {exc!s}"
        )


@router.get("/barcode/{barcode}")
def get_product_by_barcode(barcode: str):
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
            raise HTTPException(
                status_code=404,
                detail="Product not found for this barcode"
            )

        return {
            "success": True,
            "found": True,
            "data": result.data[0]
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Barcode lookup failed: {exc!s}"
        )


@router.get("/{product_id}")
def get_product(product_id: str):
    try:
        result = (
            supabase
            .table("products")
            .select("*")
            .eq("id", product_id)
            .limit(1)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return {
            "success": True,
            "data": result.data[0]
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve product: {exc!s}"
        )


@router.post("/")
def create_product(product: ProductCreate):
    barcode = product.barcode.strip()

    if not barcode:
        raise HTTPException(
            status_code=400,
            detail="Barcode is required"
        )

    try:
        existing = (
            supabase
            .table("products")
            .select("id")
            .eq("barcode", barcode)
            .limit(1)
            .execute()
        )

        if existing.data:
            raise HTTPException(
                status_code=409,
                detail="Product with this barcode already exists"
            )

        payload = product.model_dump(exclude_none=True)
        payload["barcode"] = barcode

        result = (
            supabase
            .table("products")
            .insert(payload)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=500,
                detail="Product could not be saved"
            )

        return {
            "success": True,
            "message": "Product created successfully",
            "data": result.data[0]
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create product: {exc!s}"
        )


@router.patch("/{product_id}")
def update_product(
    product_id: str,
    product: ProductUpdate
):
    try:
        payload = product.model_dump(exclude_none=True)

        if not payload:
            raise HTTPException(
                status_code=400,
                detail="No fields provided for update"
            )

        if "barcode" in payload:
            payload["barcode"] = payload["barcode"].strip()

            if not payload["barcode"]:
                raise HTTPException(
                    status_code=400,
                    detail="Barcode cannot be empty"
                )

        result = (
            supabase
            .table("products")
            .update(payload)
            .eq("id", product_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return {
            "success": True,
            "message": "Product updated successfully",
            "data": result.data[0]
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update product: {exc!s}"
        )


@router.delete("/{product_id}")
def delete_product(product_id: str):
    try:
        existing = (
            supabase
            .table("products")
            .select("id")
            .eq("id", product_id)
            .limit(1)
            .execute()
        )

        if not existing.data:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        supabase \
            .table("products") \
            .delete() \
            .eq("id", product_id) \
            .execute()

        return {
            "success": True,
            "message": "Product deleted successfully"
        }

    except HTTPException:
        raise

    except APIError as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete product: {exc!s}"
        )