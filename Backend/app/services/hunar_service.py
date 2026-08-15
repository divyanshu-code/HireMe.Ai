import httpx
from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from app.core.config import settings

class HunarService:
    BASE_URL = "https://api.voice.hunar.ai/external/v1"
    
    def __init__(self):
        self.api_key = settings.HUNAR_API_KEY
        if not self.api_key:
            raise ValueError("HUNAR_API_KEY is not configured in the environment.")
        
        self.headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json"
        }

    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Any:
        """Helper to make HTTP requests and handle Hunar errors cleanly."""
        url = f"{self.BASE_URL}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.request(method, url, headers=self.headers, **kwargs)
                
                if response.status_code == 200:
                    return response.json()
                
                # Handle non-200 responses
                error_detail = f"Hunar API Error ({response.status_code})"
                try:
                    error_data = response.json()
                    error_detail = error_data.get("message", error_detail)
                except Exception:
                    error_detail = response.text or error_detail

                raise HTTPException(status_code=response.status_code, detail=error_detail)
                
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Failed to communicate with Hunar API: {str(e)}")

    # --- AGENTS ---
    async def list_agents(self, page: int = 1, page_size: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        params = {"page": page, "page_size": page_size}
        if status:
            params["status"] = status
        return await self._make_request("GET", "/agents/", params=params)

    async def get_agent(self, agent_id: str) -> Dict[str, Any]:
        return await self._make_request("GET", f"/agents/{agent_id}/")

    async def create_agent(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._make_request("POST", "/agents/", json=agent_data)

    async def update_agent(self, agent_id: str, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        return await self._make_request("PUT", f"/agents/{agent_id}/", json=agent_data)

    # --- CALLS ---
    async def create_call(self, call_data: Dict[str, Any]) -> Dict[str, Any]:
        if call_data.get("agent_id") == "default" or not call_data.get("agent_id"):
            call_data["agent_id"] = settings.HUNAR_AGENT_ID
        return await self._make_request("POST", "/calls/", json=call_data)

    async def create_bulk_calls(self, bulk_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        return await self._make_request("POST", "/calls/bulk/", json=bulk_data)

    async def get_call_details(self, call_id: str) -> Dict[str, Any]:
        return await self._make_request("GET", f"/calls/{call_id}/")

    async def list_calls(self, page: int = 1, page_size: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        params = {"page": page, "page_size": page_size}
        if status:
            params["status"] = status
        return await self._make_request("GET", "/calls/", params=params)

hunar_service = HunarService()
