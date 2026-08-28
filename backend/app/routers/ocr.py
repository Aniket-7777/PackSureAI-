import os
import tempfile

from fastapi import APIRouter, HTTPException
from postgrest.exceptions import APIError

from ..database import supabase
from ..services.ocr_service import (
    extract_product_fields,
    run_ocr,
)

router = APIRouter(
    prefix="/api/ocr",
    tags=["OCR"],
)


@router.post("/process/{inspection_id}")
def process_inspection_ocr(
    inspection_id: str,
):
    """
    Process the latest uploaded inspection image.
    """

    try:
        # ----------------------------------------------
        # Get inspection
        # ----------------------------------------------

        inspection_result = (
            supabase.table("inspections")
            .select("*")
            .eq(
                "id",
                inspection_id,
            )
            .limit(1)
            .execute()
        )

        if not inspection_result.data:
            raise HTTPException(
                status_code=404,
                detail="Inspection not found",
            )

        # ----------------------------------------------
        # Get latest image
        # ----------------------------------------------

        image_result = (
            supabase.table("inspection_images")
            .select("*")
            .eq(
                "inspection_id",
                inspection_id,
            )
            .order(
                "created_at",
                desc=True,
            )
            .limit(1)
            .execute()
        )

        if not image_result.data:
            raise HTTPException(
                status_code=404,
                detail="No image found for this inspection",
            )

        image = image_result.data[0]
        image_id = image["id"]

        storage_bucket = image.get("storage_bucket") or "inspection-images"

        storage_path = image.get("storage_path")

        if not storage_path:
            raise HTTPException(
                status_code=400,
                detail="Image storage path is missing",
            )

        # ----------------------------------------------
        # Download image
        # ----------------------------------------------

        image_bytes = supabase.storage.from_(storage_bucket).download(storage_path)

        if not image_bytes:
            raise HTTPException(
                status_code=404,
                detail="Could not download inspection image",
            )

        # ----------------------------------------------
        # Temporary image
        # ----------------------------------------------

        suffix = ".jpg"

        mime_type = image.get("mime_type")

        if mime_type == "image/png":
            suffix = ".png"
        elif mime_type == "image/webp":
            suffix = ".webp"

        temp_path = None

        try:
            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix,
            ) as temp_file:
                temp_file.write(image_bytes)

                temp_path = temp_file.name

            # ------------------------------------------
            # Remove previous OCR data for this image
            # ------------------------------------------

            previous_ocr = (
                supabase.table("ocr_results")
                .select("id")
                .eq(
                    "inspection_id",
                    inspection_id,
                )
                .eq(
                    "image_id",
                    image_id,
                )
                .execute()
            )

            previous_ocr_ids = [row["id"] for row in (previous_ocr.data or [])]

            if previous_ocr_ids:
                previous_fields = (
                    supabase.table("extracted_fields")
                    .select("id")
                    .eq(
                        "inspection_id",
                        inspection_id,
                    )
                    .eq(
                        "image_id",
                        image_id,
                    )
                    .execute()
                )

                previous_field_ids = [row["id"] for row in (previous_fields.data or [])]

                # field_confidences
                for field_id in previous_field_ids:
                    (
                        supabase.table("field_confidences")
                        .delete()
                        .eq(
                            "extracted_field_id",
                            field_id,
                        )
                        .execute()
                    )

                # extracted_fields
                (
                    supabase.table("extracted_fields")
                    .delete()
                    .eq(
                        "inspection_id",
                        inspection_id,
                    )
                    .eq(
                        "image_id",
                        image_id,
                    )
                    .execute()
                )

                # OCR blocks
                for ocr_id in previous_ocr_ids:
                    (
                        supabase.table("ocr_blocks")
                        .delete()
                        .eq(
                            "ocr_result_id",
                            ocr_id,
                        )
                        .execute()
                    )

                # OCR results
                (
                    supabase.table("ocr_results")
                    .delete()
                    .eq(
                        "inspection_id",
                        inspection_id,
                    )
                    .eq(
                        "image_id",
                        image_id,
                    )
                    .execute()
                )

            # ------------------------------------------
            # Run OCR
            # ------------------------------------------

            ocr_data = run_ocr(temp_path)

            # ------------------------------------------
            # Save OCR result
            # ------------------------------------------

            ocr_payload = {
                "inspection_id": inspection_id,
                "image_id": image_id,
                "engine": ocr_data["engine"],
                "engine_version": ocr_data["engine_version"],
                "language": ocr_data["language"],
                "raw_text": ocr_data["raw_text"],
                "confidence": ocr_data["confidence"],
                "processing_time_ms": ocr_data["processing_time_ms"],
            }

            ocr_result = supabase.table("ocr_results").insert(ocr_payload).execute()

            if not ocr_result.data:
                raise HTTPException(
                    status_code=500,
                    detail="OCR result could not be saved",
                )

            ocr_record = ocr_result.data[0]

            ocr_result_id = ocr_record["id"]

            # ------------------------------------------
            # Save OCR blocks
            # ------------------------------------------

            blocks_payload = []

            for block in ocr_data["blocks"]:
                blocks_payload.append(
                    {
                        "ocr_result_id": ocr_result_id,
                        "text": str(block["text"]),
                        "confidence": float(block["confidence"]),
                        "bounding_box": [
                            [
                                int(point[0]),
                                int(point[1]),
                            ]
                            for point in block["bounding_box"]
                        ],
                        "polygon": [
                            [
                                int(point[0]),
                                int(point[1]),
                            ]
                            for point in block["bounding_box"]
                        ],
                        "line_number": int(block["line_number"]),
                        "block_number": int(block["block_number"]),
                    }
                )

            if blocks_payload:
                (supabase.table("ocr_blocks").insert(blocks_payload).execute())

            # ------------------------------------------
            # Extract fields
            # ------------------------------------------

            extracted = extract_product_fields(ocr_data["raw_text"],ocr_data["blocks"])

            extracted_records = []

            for field_name, field in extracted.items():
                extracted_records.append(
                    {
                        "inspection_id": inspection_id,
                        "image_id": image_id,
                        "ocr_result_id": ocr_result_id,
                        "field_name": field_name,
                        "field_value": field["field_value"],
                        "normalized_value": field["normalized_value"],
                        "confidence": field["confidence"],
                        "source_text": field["source_text"],
                        "extraction_method": field["extraction_method"],
                        "language": "en",
                        "validation_status": "pending",
                    }
                )

            saved_fields = []

            if extracted_records:
                field_result = (
                    supabase.table("extracted_fields")
                    .insert(extracted_records)
                    .execute()
                )

                saved_fields = field_result.data or []

            # ------------------------------------------
            # Save field confidence
            # ------------------------------------------

            confidence_records = []

            for field_record in saved_fields:
                confidence = float(field_record.get("confidence") or 0)

                confidence_records.append(
                    {
                        "extracted_field_id": field_record["id"],
                        "ocr_confidence": confidence,
                        "extraction_confidence": confidence,
                        "validation_confidence": confidence,
                        "final_confidence": confidence,
                        "confidence_level": (
                            "high"
                            if confidence >= 0.85
                            else "medium"
                            if confidence >= 0.60
                            else "low"
                        ),
                    }
                )

            if confidence_records:
                (
                    supabase.table("field_confidences")
                    .insert(confidence_records)
                    .execute()
                )

            # ------------------------------------------
            # Update inspection
            # ------------------------------------------

            (
                supabase.table("inspections")
                .update(
                    {
                        "status": "processing",
                        "ocr_confidence": ocr_data["confidence"],
                    }
                )
                .eq(
                    "id",
                    inspection_id,
                )
                .execute()
            )

            return {
                "success": True,
                "message": "OCR processing completed",
                "inspection_id": inspection_id,
                "ocr_result_id": ocr_result_id,
                "raw_text": ocr_data["raw_text"],
                "confidence": ocr_data["confidence"],
                "processing_time_ms": ocr_data["processing_time_ms"],
                "blocks": ocr_data["blocks"],
                "fields": saved_fields,
            }

        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

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
            print(
                "Failed to mark inspection as failed:",
                cleanup_exc,
            )

        raise HTTPException(
            status_code=500,
            detail=(f"OCR processing failed: {exc!s}"),
        ) from exc
