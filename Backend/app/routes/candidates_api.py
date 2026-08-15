from fastapi import APIRouter, HTTPException
import logging
from typing import Dict, Any
from app.schemas.apollo import ApolloEnrichRequest
from app.schemas.hunar import HunarCallRequest, HunarBulkCallRequest
from app.services.coresignal_service import coresignal_service
from app.services.hunar_service import hunar_service
from app.database.mongodb import db
from datetime import datetime, timezone
from bson import ObjectId

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.post("/enrich")
async def enrich_candidate(request: ApolloEnrichRequest):
    """
    Enrich a specifically selected candidate to fetch their contact information.
    If a phone number is available, save them to the candidates collection.
    """
    try:
        enrichment_result = await coresignal_service.enrich_candidate(
            name=request.name,
            organization_domain=request.organization_domain,
            email=request.email
        )
        
        status = enrichment_result.get("status")
        
        if status == "phone_available":
            phone = enrichment_result.get("phone")
            apollo_data = enrichment_result.get("apollo_data", {})
            
            query = {
                "apollo_source_info.id": request.apollo_id,
                "job_id": ObjectId(request.job_id)
            }
            
            update_data = {
                "$set": {
                    "phone": phone,
                    "outreach_status": "enriched"
                },
                "$setOnInsert": {
                    "name": request.name,
                    "location": request.location or apollo_data.get("city"),
                    "job_title": request.title or apollo_data.get("title"),
                    "skills": [],
                    "created_at": datetime.now(timezone.utc)
                }
            }
            
            if request.email or apollo_data.get("email"):
                update_data["$set"]["email"] = request.email or apollo_data.get("email")
                
            from pymongo import ReturnDocument
            result = await db.client.get_database("hireme_ai").candidates.find_one_and_update(
                query, update_data, upsert=True, return_document=ReturnDocument.AFTER
            )
            
            return {
                "status": status,
                "candidate_id": str(result["_id"]) if result else None,
                "phone": phone
            }
        else:
            return {
                "status": status,
                "message": "Enrichment failed or phone number not available. Candidate not saved."
            }
            
    except Exception as e:
        logger.error(f"Enrichment endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to enrich candidate")

@router.post("/{candidate_id}/start-call")
async def start_candidate_call(candidate_id: str, call_request: HunarCallRequest):
    """
    Trigger an AI outreach call to a specific candidate and save the record.
    """
    try:
        if not ObjectId.is_valid(candidate_id):
            raise HTTPException(status_code=400, detail="Invalid Candidate ID")
            
        call_data = call_request.model_dump(exclude_unset=True)
        job_id = call_data.pop("job_id", None)
        # We ignore candidate_id from body if passed, prioritize path param
        call_data.pop("candidate_id", None)
        
        # 1. Trigger the call
        hunar_response = await hunar_service.create_call(call_data)
        
        # 2. Save the call record to MongoDB
        try:
            call_record = {
                "hunar_call_id": hunar_response.get("id"),
                "request_id": hunar_response.get("request_id"),
                "agent_id": hunar_response.get("agent_id") or call_request.agent_id,
                "status": hunar_response.get("status", "initiated"),
                "callee_name": call_request.callee_name,
                "mobile_number": call_request.mobile_number,
                "job_id": ObjectId(job_id) if job_id else None,
                "candidate_id": ObjectId(candidate_id),
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.client.get_database("hireme_ai").calls.insert_one(call_record)
            
            # Update candidate outreach status
            await db.client.get_database("hireme_ai").candidates.update_one(
                {"_id": ObjectId(candidate_id)},
                {"$set": {"outreach_status": "called"}}
            )
                
        except Exception as e:
            logger.error(f"Failed to save call to MongoDB: {e}")

        return hunar_response

    except Exception as e:
        logger.error(f"Failed to trigger call: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger AI call")

@router.post("/bulk-start-call")
async def start_bulk_calls(bulk_request: HunarBulkCallRequest):
    """Trigger multiple AI outreach calls at once."""
    try:
        return await hunar_service.create_bulk_calls(bulk_request.model_dump(exclude_unset=True))
    except Exception as e:
        logger.error(f"Failed to trigger bulk calls: {e}")
        raise HTTPException(status_code=500, detail="Failed to trigger bulk AI calls")
