from fastapi import APIRouter, HTTPException, Depends
from typing import Any, Dict, List
from app.services.hunar_service import hunar_service
from app.schemas.hunar import HunarCallRequest, HunarBulkCallRequest, HunarAgentCreate, HunarAgentUpdate

router = APIRouter(prefix="/hunar", tags=["Hunar AI Integrations"])

@router.get("/agents/")
async def list_agents(page: int = 1, page_size: int = 20):
    """List all configured voice agents from Hunar."""
    return await hunar_service.list_agents(page=page, page_size=page_size)

@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get specific agent details."""
    return await hunar_service.get_agent(agent_id)

@router.post("/agents/")
async def create_agent(agent_data: HunarAgentCreate):
    """Create a new recruiter voice agent."""
    return await hunar_service.create_agent(agent_data.model_dump(exclude_unset=True))

@router.put("/agents/{agent_id}")
async def update_agent(agent_id: str, agent_data: HunarAgentUpdate):
    """Update an existing recruiter voice agent."""
    return await hunar_service.update_agent(agent_id, agent_data.model_dump(exclude_unset=True))


@router.get("/calls/{call_id}")
async def get_call_details(call_id: str):
    """Retrieve details and analytics for a specific call."""
    return await hunar_service.get_call_details(call_id)
