from motor.motor_asyncio import AsyncIOMotorClient
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class MongoDB:
    client: AsyncIOMotorClient = None

db = MongoDB()

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URI)
        # Send a ping to confirm a successful connection
        await db.client.admin.command('ping')
        logger.info("Connected to MongoDB successfully.")
        
        # Initialize database references
        database = db.client.get_database("hireme_ai")
        
        # Create Indexes for fast querying
        logger.info("Creating MongoDB indexes...")
        
        # Jobs indexes
        await database.jobs.create_index("status")
        
        # Candidates indexes
        await database.candidates.create_index("job_id")
        await database.candidates.create_index("outreach_status")
        
        # Calls/Outreach indexes
        await database.calls.create_index("candidate_id")
        await database.calls.create_index("job_id")
        await database.calls.create_index("hunar_call_id", unique=True, sparse=True)
        
        # Webhook indexes
        await database.webhooks.create_index("event_type")
        await database.webhooks.create_index("processed")
        await database.webhooks.create_index("idempotency_key", unique=True)
        
        logger.info("MongoDB indexes created successfully.")
        
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    logger.info("Closing MongoDB connection...")
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed.")
