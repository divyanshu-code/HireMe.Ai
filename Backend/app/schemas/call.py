from typing import Optional, Dict, Any
from pydantic import Field
from datetime import datetime, timezone
from app.schemas.common import MongoBaseModel, PyObjectId

class CallBase(MongoBaseModel):
    candidate_id: PyObjectId
    job_id: PyObjectId
    hunar_call_id: Optional[str] = None
    request_id: Optional[str] = None
    phone_number: str
    call_status: str = Field(default="initiated") # e.g., initiated, ringing, completed, failed, busy
    duration: Optional[int] = None
    recording_url: Optional[str] = None
    structured_result: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None

class CallCreate(CallBase):
    """Schema for creating a new call record before initiating Hunar outreach."""
    pass

class CallInDB(CallBase):
    """Schema for a call record in the database."""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
