from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# -----------------
# AGENT SCHEMAS
# -----------------
class HunarAgentCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=64)
    language: str
    voice_persona: str
    persona_name: Optional[str] = None
    agent_prompt: str
    objective: str
    introduction: str
    result_prompt: str
    result_schema: Dict[str, Any]

class HunarAgentUpdate(HunarAgentCreate):
    """Updating an agent requires all fields when changing persona or language."""
    pass

# -----------------
# CALL SCHEMAS
# -----------------
class RetryConfig(BaseModel):
    max_retry_count: int = Field(..., ge=0, le=10)
    retry_interval_hours: int = Field(..., description="0, 3, 6, 9, 12, or 24")

class Guardrails(BaseModel):
    allowed_days: List[str]
    earliest_call_time: str
    last_call_time: str

class CallbackConfig(BaseModel):
    call_status_callback_url: Optional[str] = None
    call_recording_callback_url: Optional[str] = None
    call_result_callback_url: Optional[str] = None
    call_summary_callback_url: Optional[str] = None

class HunarCallRequest(BaseModel):
    agent_id: str
    callee_name: str
    mobile_number: str
    custom_data: Optional[Dict[str, Any]] = {}
    job_id: Optional[str] = None
    candidate_id: Optional[str] = None
    from_phone_number: Optional[str] = None
    request_id: Optional[str] = None
    retry_config: Optional[RetryConfig] = None
    guardrails: Optional[Guardrails] = None
    timezone: Optional[str] = None
    callback_config: Optional[CallbackConfig] = None

class BulkCallItem(BaseModel):
    callee_name: str
    mobile_number: str
    custom_data: Optional[Dict[str, Any]] = {}

class HunarBulkCallRequest(BaseModel):
    agent_id: str
    data: List[BulkCallItem]
    from_phone_number: Optional[str] = None
    request_id: Optional[str] = None
    retry_config: Optional[RetryConfig] = None
    guardrails: Optional[Guardrails] = None
    timezone: Optional[str] = None
    callback_config: Optional[CallbackConfig] = None
    remove_invalid_rows: bool = True
    remove_duplicate_phone_numbers: bool = True
