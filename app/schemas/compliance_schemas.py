from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RuleResponse(BaseModel):
    rule_id: int
    rule_code: str
    rule_title: str
    applicable_category: str
    mandatory_field: str
    validation_regex: Optional[str] = None
    penalty_clause: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class HealthCheckResponse(BaseModel):
    status: str
    engine: str
    active_rules_count: int
    timestamp: datetime