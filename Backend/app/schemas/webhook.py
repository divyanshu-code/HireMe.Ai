from typing import Dict, Any
from pydantic import Field
from datetime import datetime, timezone
from app.schemas.common import MongoBaseModel

class WebhookEvent(MongoBaseModel):
    """Schema for storing raw incoming webhooks for auditing and fallback processing."""
    source: str = "hunar"
    event_type: str
    idempotency_key: str
    payload: Dict[str, Any]
    processed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
