import asyncio
from app.services.hunar_service import hunar_service

async def check_call():
    try:
        call_id = "1f40fc52-a128-4d7a-8202-af66486401bc"
        print(f"Checking status for call: {call_id}...")
        resp = await hunar_service.get_call_details(call_id)
        print("Call Details:", resp)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(check_call())
