from fastapi import APIRouter, HTTPException
import logging
from typing import List, Dict, Any
from app.schemas.job import JobCreate, JobInDB
from app.database.mongodb import db
from datetime import datetime, timezone
from bson import ObjectId
from app.schemas.apollo import ApolloSearchRequest
from app.services.coresignal_service import coresignal_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_jobs():
    """Retrieve all jobs from the database."""
    try:
        jobs_cursor = db.client.get_database("hireme_ai").jobs.find().sort("created_at", -1)
        jobs = await jobs_cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for job in jobs:
            job["id"] = str(job["_id"])
            del job["_id"]
            
        return jobs
    except Exception as e:
        logger.error(f"Error fetching jobs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch jobs")

@router.post("/", response_model=Dict[str, Any])
async def create_job(job: JobCreate):
    """Create a new job."""
    try:
        job_doc = job.model_dump()
        job_doc["created_at"] = datetime.now(timezone.utc)
        
        result = await db.client.get_database("hireme_ai").jobs.insert_one(job_doc)
        
        job_doc["id"] = str(result.inserted_id)
        if "_id" in job_doc:
            del job_doc["_id"]
            
        return job_doc
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail="Failed to create job")

@router.get("/{job_id}", response_model=Dict[str, Any])
async def get_job(job_id: str):
    """Retrieve a specific job and its candidate count."""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
            
        job = await db.client.get_database("hireme_ai").jobs.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
            
        job["id"] = str(job["_id"])
        del job["_id"]
        
        # Fetch number of candidates for this job broken down by status
        pipeline_stats = {
            "discovered": await db.client.get_database("hireme_ai").candidates.count_documents({"job_id": ObjectId(job_id), "outreach_status": "discovered"}),
            "enriched": await db.client.get_database("hireme_ai").candidates.count_documents({"job_id": ObjectId(job_id), "outreach_status": "enriched"}),
            "called": await db.client.get_database("hireme_ai").candidates.count_documents({"job_id": ObjectId(job_id), "outreach_status": "called"})
        }
        job["candidate_count"] = sum(pipeline_stats.values())
        job["pipeline"] = pipeline_stats
        
        return job
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching job details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch job")

@router.get("/{job_id}/candidates", response_model=List[Dict[str, Any]])
async def get_job_candidates(job_id: str):
    """Retrieve all saved/enriched candidates for a specific job."""
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
            
        candidates_cursor = db.client.get_database("hireme_ai").candidates.find({"job_id": ObjectId(job_id)}).sort("created_at", -1)
        candidates = await candidates_cursor.to_list(length=200)
        
        for cand in candidates:
            cand["id"] = str(cand["_id"])
            cand["job_id"] = str(cand["job_id"])
            del cand["_id"]
            
        return candidates
    except Exception as e:
        logger.error(f"Error fetching job candidates: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch candidates")

@router.post("/{job_id}/search-candidates")
async def search_job_candidates(job_id: str, request: ApolloSearchRequest):
    """
    Search for new candidates based on job requirements.
    This abstracts away the underlying sourcing provider (Apollo).
    """
    try:
        if not ObjectId.is_valid(job_id):
            raise HTTPException(status_code=400, detail="Invalid job ID format")
            
        results = await coresignal_service.search_people(
            job_titles=request.job_titles,
            locations=request.locations,
            keywords=request.keywords,
            page=request.page,
            page_size=request.page_size
        )
        
        candidates = results.get("candidates", [])
        if candidates:
            from pymongo import UpdateOne
            import datetime
            
            operations = []
            for c in candidates:
                # Upsert by apollo_id (which maps to Coresignal ID under the hood)
                apollo_id = c.get("apollo_id")
                if not apollo_id:
                    continue
                    
                update_doc = {
                    "$setOnInsert": {
                        "name": c.get("name"),
                        "email": None,
                        "phone": None,
                        "location": c.get("location"),
                        "job_title": c.get("title"),
                        "skills": [],
                        "apollo_source_info": {
                            "id": apollo_id,
                            "linkedin_url": c.get("linkedin_url"),
                            "organization": c.get("organization_domain")
                        },
                        "job_id": ObjectId(job_id),
                        "outreach_status": "discovered",
                        "created_at": datetime.datetime.now(datetime.timezone.utc)
                    }
                }
                operations.append(UpdateOne({"apollo_source_info.id": apollo_id, "job_id": ObjectId(job_id)}, update_doc, upsert=True))
                
            if operations:
                await db.client.get_database("hireme_ai").candidates.bulk_write(operations)
                
        return results
    except Exception as e:
        logger.error(f"Error searching for candidates: {e}")
        raise HTTPException(status_code=500, detail="Failed to search for candidates")
