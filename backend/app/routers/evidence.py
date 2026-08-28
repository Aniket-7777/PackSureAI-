import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from postgrest.exceptions import APIError

from ..database import supabase

router = APIRouter(
    prefix="/api/evidence",
    tags=["Evidence"]
)


BUCKET_NAME = "inspection-images"


@router.post("/upload")
async def upload_evidence(
    inspection_id: str = Form(...),
    image_type: str = Form(...),
    file: UploadFile = File(...)
):

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed"
        )

    file_content = await file.read()

    if not file_content:

        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    extension = "jpg"

    if file.content_type == "image/png":
        extension = "png"

    elif file.content_type == "image/webp":
        extension = "webp"

    unique_name = (
        f"{uuid.uuid4().hex}.{extension}"
    )

    storage_path = (
        f"{inspection_id}/"
        f"{image_type}/"
        f"{unique_name}"
    )

    try:

        supabase.storage \
            .from_(BUCKET_NAME) \
            .upload(
                storage_path,
                file_content,
                {
                    "content-type":
                        file.content_type
                }
            )

    except APIError as error:

        print(
            "Storage upload error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Image upload failed"
        )

    image_url = (
        supabase.storage
        .from_(BUCKET_NAME)
        .get_public_url(
            storage_path
        )
    )

    database_record = {

        "inspection_id":
            inspection_id,

        "image_type":
            image_type,

        "file_name":
            file.filename,

        "storage_path":
            storage_path,

        "image_url":
            image_url
    }

    result = (
        supabase
        .table("inspection_images")
        .insert(database_record)
        .execute()
    )

    if not result.data:

        raise HTTPException(
            status_code=500,
            detail="Image uploaded but database record could not be created"
        )

    return {
        "success": True,
        "message":
            "Evidence uploaded successfully",
        "data":
            result.data[0]
    }


@router.get("/{inspection_id}")
def get_evidence(
    inspection_id: str
):

    result = (
        supabase
        .table("inspection_images")
        .select("*")
        .eq(
            "inspection_id",
            inspection_id
        )
        .order(
            "created_at",
            desc=True
        )
        .execute()
    )

    return {
        "success": True,
        "data":
            result.data or []
    }


@router.delete("/{evidence_id}")
def delete_evidence(
    evidence_id: str
):

    existing = (
        supabase
        .table("inspection_images")
        .select(
            "storage_path"
        )
        .eq(
            "id",
            evidence_id
        )
        .limit(1)
        .execute()
    )

    if not existing.data:

        raise HTTPException(
            status_code=404,
            detail="Evidence not found"
        )

    storage_path = (
        existing.data[0]
        .get("storage_path")
    )

    if storage_path:

        try:

            supabase.storage \
                .from_(BUCKET_NAME) \
                .remove([
                    storage_path
                ])

        except APIError as error:

            print(
                "Storage delete error:",
                error
            )

    (
        supabase
        .table("inspection_images")
        .delete()
        .eq(
            "id",
            evidence_id
        )
        .execute()
    )

    return {
        "success": True,
        "message":
            "Evidence deleted successfully"
    }