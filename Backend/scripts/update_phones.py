import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def update_phones():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("hireme_ai")
    
    # Update all candidates with the real phone number
    result = await db.candidates.update_many(
        {},
        {"$set": {"phone": settings.TEST_PHONE_NUMBER}}
    )
    print(f"Updated {result.modified_count} candidates in MongoDB with your real phone number: {settings.TEST_PHONE_NUMBER}")
    client.close()

if __name__ == "__main__":
    asyncio.run(update_phones())
