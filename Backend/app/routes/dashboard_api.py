from fastapi import APIRouter, HTTPException
import logging
import asyncio
from app.database.mongodb import db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_metrics():
    """
    Retrieve real-time metrics for the hiring pipeline and recent activity.
    """
    try:
        # Run independent counts concurrently for speed
        total_jobs_task = db.client.get_database("hireme_ai").jobs.count_documents({})
        total_candidates_task = db.client.get_database("hireme_ai").candidates.count_documents({})
        enriched_candidates_task = db.client.get_database("hireme_ai").candidates.count_documents({"outreach_status": "enriched"})
        contacted_candidates_task = db.client.get_database("hireme_ai").candidates.count_documents({"outreach_status": "called"})
        
        # Calls collection metrics
        total_calls_task = db.client.get_database("hireme_ai").calls.count_documents({})
        completed_calls_task = db.client.get_database("hireme_ai").calls.count_documents({
            "$or": [{"status": {"$in": ["completed", "COMPLETED", "success"]}}, {"call_status": {"$in": ["completed", "COMPLETED", "success"]}}]
        })
        interested_candidates_task = db.client.get_database("hireme_ai").calls.count_documents({
            "structured_result.interested": {"$in": [True, "Yes", "yes", "true", "True"]}
        })
        qualified_candidates_task = db.client.get_database("hireme_ai").calls.count_documents({
            "structured_result.qualified": {"$in": [True, "Yes", "yes", "true", "True"]}
        })

        # Await all counts
        (
            total_jobs, total_candidates, enriched_candidates, contacted_candidates,
            total_calls, completed_calls, interested_candidates, qualified_candidates
        ) = await asyncio.gather(
            total_jobs_task, total_candidates_task, enriched_candidates_task, contacted_candidates_task,
            total_calls_task, completed_calls_task, interested_candidates_task, qualified_candidates_task
        )

        # Fetch recent 5 calls joined with jobs for recent activity table
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
                    "callee_name": 1,
                    "status": 1,
                    "call_status": 1,
                    "structured_result": 1,
                    "created_at": {"$dateToString": {"format": "%Y-%m-%dT%H:%M:%S.%LZ", "date": "$created_at"}},
                    "job_title": {"$ifNull": ["$job.title", "Unknown Job"]}
                }
            },
            {
                "$sort": {"created_at": -1}
            },
            {
                "$limit": 5
            }
        ]
        
        recent_activity_cursor = db.client.get_database("hireme_ai").calls.aggregate(pipeline)
        recent_activity = await recent_activity_cursor.to_list(length=5)
        
        # Normalize status and structure for UI
        for call in recent_activity:
            call["display_status"] = call.get("call_status") or call.get("status") or "unknown"

        return {
            "metrics": {
                "total_jobs": total_jobs,
                "total_candidates": total_candidates,
                "candidates_awaiting_outreach": enriched_candidates,
                "candidates_contacted": contacted_candidates,
                "total_calls": total_calls,
                "completed_calls": completed_calls,
                "interested_candidates": interested_candidates,
                "qualified_candidates": qualified_candidates
            },
            "recent_activity": recent_activity
        }

    except Exception as e:
        logger.error(f"Failed to fetch dashboard metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard metrics")
