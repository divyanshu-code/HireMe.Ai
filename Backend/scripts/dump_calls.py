import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def dump():
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client.get_database("hireme_ai")
    
    calls = await db.calls.find({"call_status": "COMPLETED"}).to_list(10)
    for c in calls:
        print(f"Call ID: {c.get('_id')}")
        print(f"Result: {c.get('structured_result')}")
        print("-" * 40)
        
    client.close()

if __name__ == "__main__":
    asyncio.run(dump())
