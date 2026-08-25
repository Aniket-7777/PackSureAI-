from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean, 
    TIMESTAMP, ForeignKey
)
from sqlalchemy.dialects.postgresql import JSONB, ENUM
from app.core.database import Base

user_role_enum = ENUM('INSPECTOR', 'SUPERVISOR', 'ADMIN', name='user_role', create_type=False)
inspection_category_enum = ENUM('FOOD', 'COSMETIC', 'ELECTRONIC', 'GENERAL_GOODS', 'MEDICAL_DEVICE', name='inspection_category', create_type=False)
inspection_status_enum = ENUM('PENDING', 'PASS', 'FAIL', 'WARNING', 'MANUAL_REVIEW', name='inspection_status', create_type=False)
image_side_enum = ENUM('FRONT', 'BACK', 'TOP', 'BOTTOM', 'SIDE', 'FULL_PANEL', name='image_side_type', create_type=False)
rule_status_enum = ENUM('PASS', 'FAIL', 'WARNING', 'NOT_APPLICABLE', name='rule_status', create_type=False)
violation_severity_enum = ENUM('MINOR', 'MAJOR', 'CRITICAL', name='violation_severity', create_type=False)

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(user_role_enum, default='INSPECTOR')
    badge_number = Column(String(50), unique=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

class LegalMetrologyRule(Base):
    __tablename__ = "legal_metrology_rules"
    __table_args__ = {'extend_existing': True}

    rule_id = Column(Integer, primary_key=True, index=True)
    rule_code = Column(String(50), unique=True, nullable=False)
    rule_title = Column(String(255), nullable=False)
    applicable_category = Column(String(50), default='ALL')
    mandatory_field = Column(String(50), nullable=False)
    validation_regex = Column(String(255), nullable=True)
    penalty_clause = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

class Inspection(Base):
    __tablename__ = "inspections"
    __table_args__ = {'extend_existing': True}

    inspection_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    commodity_name = Column(String(200))
    brand_name = Column(String(100))
    category = Column(inspection_category_enum, nullable=False)
    overall_status = Column(inspection_status_enum, default='PENDING')
    latitude = Column(Numeric(10, 8), nullable=True)
    longitude = Column(Numeric(11, 8), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

class ScannedImage(Base):
    __tablename__ = "scanned_images"
    __table_args__ = {'extend_existing': True}

    image_id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.inspection_id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    image_side = Column(image_side_enum, default='FRONT')
    raw_ocr_text = Column(Text, nullable=True)
    ocr_raw_json = Column(JSONB, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    __table_args__ = {'extend_existing': True}

    field_id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.inspection_id", ondelete="CASCADE"), nullable=False)
    image_id = Column(Integer, ForeignKey("scanned_images.image_id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(50), nullable=False)
    extracted_value = Column(Text, nullable=False)
    confidence_score = Column(Numeric(5, 4), nullable=True)
    bounding_box = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

class ComplianceEvaluation(Base):
    __tablename__ = "compliance_evaluations"
    __table_args__ = {'extend_existing': True}

    evaluation_id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.inspection_id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(Integer, ForeignKey("legal_metrology_rules.rule_id"), nullable=False)
    status = Column(rule_status_enum, nullable=False)
    evaluation_details = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)

class Violation(Base):
    __tablename__ = "violations"
    __table_args__ = {'extend_existing': True}

    violation_id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.inspection_id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(Integer, ForeignKey("legal_metrology_rules.rule_id"), nullable=False)
    severity = Column(violation_severity_enum, default='MAJOR')
    detected_value = Column(Text, nullable=True)
    expected_format = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), default=datetime.utcnow)