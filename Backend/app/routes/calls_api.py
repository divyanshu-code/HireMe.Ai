from fastapi import APIRouter, HTTPException
import logging
from app.database.mongodb import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/calls", tags=["Calls"])

@router.get("/")
async def list_calls():
    """
    Retrieve all outreach calls, joining with the jobs collection to get the job title.
    """
    try:
        pipeline = [
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "job_id",
                    "foreignField": "_id",
                    "as": "job"
                }
            },
            {
                "$unwind": {
                    "path": "$job",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "hunar_call_id": 1,
                    "callee_name": 1,
                    "mobile_number": 1,
                    "status": 1,
                    "call_status": 1,
                    "duration": 1,
                    "recording_url": 1,
                    "structured_result": 1,
                    "created_at": {"$dateToString": {"format": "%Y-%m-%dT%H:%M:%S.%LZ", "date": "$created_at"}},
                    "job_title": {"$ifNull": ["$job.title", "Unknown Job"]}
                }
            },
            {
                "$sort": {"created_at": -1}
            }
        ]
        
        calls_cursor = db.client.get_database("hireme_ai").calls.aggregate(pipeline)
        calls = await calls_cursor.to_list(length=100)
        
        from app.services.hunar_service import hunar_service
        from bson import ObjectId
        import asyncio

        # Auto-sync calls that might be stuck without webhooks
        sync_tasks = []
        async def sync_call(c):
            if not c.get("hunar_call_id") or c.get("display_status") in ["COMPLETED", "NOT_CONNECTED", "FAILED"]:
                return
            try:
                hunar_data = await hunar_service.get_call_details(c["hunar_call_id"])
                update_data = {
                    "status": hunar_data.get("status"),
                    "call_status": hunar_data.get("status"),
                    "duration": (hunar_data.get("duration_minutes") or 0) * 60 + (hunar_data.get("duration_seconds") or 0),
                    "recording_url": hunar_data.get("recording_url"),
                    "structured_result": hunar_data.get("result") or c.get("structured_result")
                }
                await db.client.get_database("hireme_ai").calls.update_one(
                    {"_id": ObjectId(c["_id"])},
                    {"$set": update_data}
                )
                c.update(update_data)
                c["display_status"] = update_data["call_status"]
            except Exception as e:
                logger.warning(f"Failed to auto-sync call {c['_id']}: {e}")

        # Normalize status first so we can check it
        for call in calls:
            call["display_status"] = call.get("call_status") or call.get("status") or "unknown"
            sync_tasks.append(sync_call(call))
            
        # Run syncs in parallel
        await asyncio.gather(*sync_tasks)
            
        return calls

    except Exception as e:
        logger.error(f"Failed to list calls: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch calls")

@router.get("/{call_id}")
async def get_call(call_id: str):
    """
    Retrieve a specific outreach call, joined with the jobs collection.
    """
    try:
        from bson import ObjectId
        if not ObjectId.is_valid(call_id):
            raise HTTPException(status_code=400, detail="Invalid Call ID")
            
        pipeline = [
            {
                "$match": {"_id": ObjectId(call_id)}
            },
            {
                "$lookup": {
                    "from": "jobs",
                    "localField": "job_id",
                    "foreignField": "_id",
                    "as": "job"
                }
            },
            {
                "$unwind": {
                    "path": "$job",
                    "preserveNullAndEmptyArrays": True
                }
            },
            {
                "$project": {
                    "_id": {"$toString": "$_id"},
                    "hunar_call_id": 1,
                    "callee_name": 1,
                    "mobile_number": 1,
                    "status": 1,
                    "call_status": 1,
                    "duration": 1,
                    "recording_url": 1,
                    "structured_result": 1,
                    "created_at": {"$dateToString": {"format": "%Y-%m-%dT%H:%M:%S.%LZ", "date": "$created_at"}},
                    "job_title": {"$ifNull": ["$job.title", "Unknown Job"]}
                }
            }
        ]
        
        calls_cursor = db.client.get_database("hireme_ai").calls.aggregate(pipeline)
        calls = await calls_cursor.to_list(length=1)
        
        if not calls:
            raise HTTPException(status_code=404, detail="Call not found")
            
        call = calls[0]
        call["display_status"] = call.get("call_status") or call.get("status") or "unknown"
        
        # Auto-sync single call
        from app.services.hunar_service import hunar_service
        try:
            if call.get("hunar_call_id"):
                hunar_data = await hunar_service.get_call_details(call["hunar_call_id"])
                update_data = {
                    "status": hunar_data.get("status"),
                    "call_status": hunar_data.get("status"),
                    "duration": (hunar_data.get("duration_minutes") or 0) * 60 + (hunar_data.get("duration_seconds") or 0),
                    "recording_url": hunar_data.get("recording_url"),
                    "structured_result": hunar_data.get("result") or call.get("structured_result")
                }
                await db.client.get_database("hireme_ai").calls.update_one(
                    {"_id": ObjectId(call_id)},
                    {"$set": update_data}
                )
                call.update(update_data)
                call["display_status"] = update_data["call_status"] or call["display_status"]
        except Exception as e:
            logger.warning(f"Failed to auto-sync call {call_id}: {e}")
            
        return call

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch call {call_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch call details")
