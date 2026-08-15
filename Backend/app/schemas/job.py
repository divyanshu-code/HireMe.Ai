from datetime import datetime, timezone
from typing import List, Optional
from pydantic import Field
from app.schemas.common import MongoBaseModel

class JobBase(MongoBaseModel):
    title: str
    description: str
    requirements: List[str] = []
    location: str
    experience: str
    status: str = Field(default="active") # e.g., active, closed

class JobCreate(JobBase):
    """Schema for creating a new job."""
    pass

class JobInDB(JobBase):
    """Schema for a job retrieved from the database."""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
