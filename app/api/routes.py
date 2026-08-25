from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timezone
import os
import traceback

from app.core.database import get_db
from app.models.compliance_models import (
    LegalMetrologyRule, Inspection, ScannedImage, 
    ExtractedField, ComplianceEvaluation, Violation, User
)
from app.schemas.compliance_schemas import RuleResponse, HealthCheckResponse
from app.services.image_processor import ImagePreprocessor
from app.services.ocr_engine import ocr_service
from app.services.field_parser import FieldParser
from app.services.rule_engine import ComplianceEngine

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/health", response_model=HealthCheckResponse, tags=["System Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        query = select(func.count()).select_from(LegalMetrologyRule).where(LegalMetrologyRule.is_active == True)
        result = await db.execute(query)
        total_rules = result.scalar() or 0

        return HealthCheckResponse(
            status="SUCCESS",
            engine="FastAPI + PostgreSQL (asyncpg)",
            active_rules_count=total_rules,
            timestamp=datetime.now(timezone.utc)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database handshake failed: {str(e)}")

@router.get("/rules", response_model=List[RuleResponse], tags=["Legal Metrology Rules"])
async def get_all_active_rules(db: AsyncSession = Depends(get_db)):
    try:
        query = select(LegalMetrologyRule).where(LegalMetrologyRule.is_active == True).order_by(LegalMetrologyRule.rule_id.asc())
        result = await db.execute(query)
        return result.scalars().all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch rules: {str(e)}")

@router.post("/scan/upload", tags=["Image OCR Inspection Pipeline"])
async def upload_and_process_package(
    file: UploadFile = File(...),
    commodity_name: Optional[str] = Form("Packaged Commodity"),
    brand_name: Optional[str] = Form("Unknown"),
    category: Optional[str] = Form("FOOD"),
    side: Optional[str] = Form("BACK"),
    db: AsyncSession = Depends(get_db)
):
    try:
        # Verify or seed default inspector user
        user_check = await db.execute(select(User).where(User.user_id == 1))
        if not user_check.scalar_one_or_none():
            db.add(User(
                user_id=1,
                name="Inspector Ansh",
                email="ansh.inspector@gov.in",
                password_hash="dummyhash",
                role="INSPECTOR",
                badge_number="LM-UP-2026-001"
            ))
            await db.flush()

        image_bytes = await file.read()
        file_path = os.path.join(UPLOAD_DIR, f"{int(datetime.now(timezone.utc).timestamp())}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        processed_img_np = ImagePreprocessor.preprocess_for_ocr(image_bytes)
        ocr_result = ocr_service.extract_text_and_boxes(processed_img_np)

        new_inspection = Inspection(
            user_id=1,
            commodity_name=commodity_name,
            brand_name=brand_name,
            category=category,
            overall_status="PENDING"
        )
        db.add(new_inspection)
        await db.flush()

        scanned_record = ScannedImage(
            inspection_id=new_inspection.inspection_id,
            image_url=file_path,
            image_side=side,
            raw_ocr_text=ocr_result["full_text"],
            ocr_raw_json=ocr_result["parsed_blocks"],
            processing_time_ms=ocr_result["processing_time_ms"]
        )
        db.add(scanned_record)
        await db.commit()
        await db.refresh(scanned_record)

        return {
            "status": "SUCCESS",
            "inspection_id": new_inspection.inspection_id,
            "image_id": scanned_record.image_id,
            "processing_time_ms": ocr_result["processing_time_ms"],
            "extracted_raw_text": ocr_result["full_text"],
            "detected_blocks_count": len(ocr_result["parsed_blocks"]),
            "ocr_blocks": ocr_result["parsed_blocks"]
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Image OCR processing failed: {str(e)}")

@router.post("/scan/inspect", tags=["SIH26034 Full Inspection Pipeline"])
async def run_full_label_inspection(
    file: UploadFile = File(...),
    commodity_name: Optional[str] = Form("Packaged Commodity"),
    brand_name: Optional[str] = Form("Brand Name"),
    category: Optional[str] = Form("FOOD"),
    side: Optional[str] = Form("BACK"),
    db: AsyncSession = Depends(get_db)
):
    try:
        user_check = await db.execute(select(User).where(User.user_id == 1))
        if not user_check.scalar_one_or_none():
            db.add(User(
                user_id=1,
                name="Inspector Ansh",
                email="ansh.inspector@gov.in",
                password_hash="dummyhash",
                role="INSPECTOR",
                badge_number="LM-UP-2026-001"
            ))
            await db.flush()

        # 1. Save uploaded image
        image_bytes = await file.read()
        file_path = os.path.join(UPLOAD_DIR, f"{int(datetime.now(timezone.utc).timestamp())}_{file.filename}")
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        # 2. Image Preprocessing & OCR
        processed_img_np = ImagePreprocessor.preprocess_for_ocr(image_bytes)
        ocr_result = ocr_service.extract_text_and_boxes(processed_img_np)

        # 3. Create Inspection Record
        new_inspection = Inspection(
            user_id=1,
            commodity_name=commodity_name,
            brand_name=brand_name,
            category=category,
            overall_status="PENDING"
        )
        db.add(new_inspection)
        await db.flush()

        # 4. Save Scanned Image Record
        scanned_record = ScannedImage(
            inspection_id=new_inspection.inspection_id,
            image_url=file_path,
            image_side=side,
            raw_ocr_text=ocr_result["full_text"],
            ocr_raw_json=ocr_result["parsed_blocks"],
            processing_time_ms=ocr_result["processing_time_ms"]
        )
        db.add(scanned_record)
        await db.flush()

        # 5. Extract Structured Declarations
        extracted_dict = FieldParser.extract_fields(ocr_result["parsed_blocks"], ocr_result["full_text"])
        
        for field_name, field_info in extracted_dict.items():
            ext_field = ExtractedField(
                inspection_id=new_inspection.inspection_id,
                image_id=scanned_record.image_id,
                field_name=field_name,
                extracted_value=str(field_info["value"]),
                confidence_score=field_info["confidence"],
                bounding_box=field_info["bounding_box"]
            )
            db.add(ext_field)

        # 6. Evaluate Against Legal Metrology Rules
        rules_query = select(LegalMetrologyRule).where(LegalMetrologyRule.is_active == True)
        rules_result = await db.execute(rules_query)
        active_rules = rules_result.scalars().all()

        compliance_result = ComplianceEngine.evaluate(
            rules=active_rules,
            extracted_fields=extracted_dict,
            category=category
        )

        new_inspection.overall_status = compliance_result["overall_status"]

        # 7. Record Compliance Evaluations & Violations in PostgreSQL
        for ev in compliance_result["evaluations"]:
            db.add(ComplianceEvaluation(
                inspection_id=new_inspection.inspection_id,
                rule_id=ev["rule_id"],
                status=ev["status"],
                evaluation_details=ev["details"]
            ))

        for vio in compliance_result["violations"]:
            db.add(Violation(
                inspection_id=new_inspection.inspection_id,
                rule_id=vio["rule_id"],
                severity=vio["severity"],
                detected_value=vio["detected_value"],
                expected_format=vio["expected_format"],
                explanation=vio["explanation"]
            ))

        await db.commit()

        return {
            "status": "SUCCESS",
            "inspection_id": new_inspection.inspection_id,
            "overall_verdict": compliance_result["overall_status"],
            "total_violations": len(compliance_result["violations"]),
            "extracted_declarations": extracted_dict,
            "violations": compliance_result["violations"],
            "evaluations": compliance_result["evaluations"],
            "processing_time_ms": ocr_result["processing_time_ms"]
        }

    except Exception as e:
        await db.rollback()
        print("Inspection Error:\n", traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Inspection failed: {str(e)}")

    @router.get("/inspections/history", tags=["Audit & History"])
    async def get_inspection_history(limit: int = 10, db: AsyncSession = Depends(get_db)):
        """Fetch the latest inspection records from PostgreSQL with their evaluations and violations."""
    query = select(Inspection).order_by(Inspection.inspection_id.desc()).limit(limit)
    result = await db.execute(query)
    inspections = result.scalars().all()
    
    records = []
    for insp in inspections:
        # Fetch related violations count
        v_query = select(func.count()).select_from(Violation).where(Violation.inspection_id == insp.inspection_id)
        v_res = await db.execute(v_query)
        violation_count = v_res.scalar() or 0

        records.append({
            "inspection_id": insp.inspection_id,
            "commodity_name": insp.commodity_name,
            "brand_name": insp.brand_name,
            "category": insp.category,
            "overall_status": insp.overall_status,
            "violations_count": violation_count,
            "created_at": insp.created_at
        })
    return records