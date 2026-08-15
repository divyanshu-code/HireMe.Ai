import asyncio
from app.services.hunar_service import hunar_service
from app.core.config import settings

async def test_call():
    call_data = {
        "callee_name": "Divyanshu",
        "mobile_number": settings.TEST_PHONE_NUMBER
    }
    
    try:
        print(f"Triggering Hunar call to {settings.TEST_PHONE_NUMBER}...")
        resp = await hunar_service.create_call(call_data)
        print("Hunar API Response:", resp)
        
        call_id = resp.get("id")
        if call_id:
            print("\nWaiting 5 seconds to check call status...")
            await asyncio.sleep(5)
            status_resp = await hunar_service.get_call_details(call_id)
            print("Hunar Call Status:", status_resp)
            
    except Exception as e:
        print("Error triggering call:", e)

if __name__ == "__main__":
    asyncio.run(test_call())
