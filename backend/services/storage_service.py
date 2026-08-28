from ..database import supabase


BUCKET_NAME = "inspection-images"


def upload_image(
    file_bytes: bytes,
    storage_path: str,
    content_type: str
):

    result = supabase.storage.from_(
        BUCKET_NAME
    ).upload(
        storage_path,
        file_bytes,
        {
            "content-type": content_type,
            "upsert": "true"
        }
    )

    return result