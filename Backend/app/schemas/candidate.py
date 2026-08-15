from typing import Optional, List, Dict, Any
from pydantic import Field
from datetime import datetime, timezone
from app.schemas.common import MongoBaseModel, PyObjectId

class CandidateBase(MongoBaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    job_title: Optional[str] = None
    skills: List[str] = []
    experience: Optional[str] = None
    apollo_source_info: Optional[Dict[str, Any]] = None
    job_id: PyObjectId
    outreach_status: str = Field(default="pending") # e.g., pending, enriched, calling, completed, failed

class CandidateCreate(CandidateBase):
    """Schema for adding a new candidate from Apollo search results."""
    pass

class CandidateInDB(CandidateBase):
    """Schema for a candidate in the database."""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
