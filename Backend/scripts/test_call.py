import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

# Load environment variables
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

HUNAR_API_KEY = os.getenv("HUNAR_API_KEY")
HUNAR_AGENT_ID = os.getenv("HUNAR_AGENT_ID")

if not HUNAR_API_KEY or not HUNAR_AGENT_ID:
    print("Error: HUNAR_API_KEY or HUNAR_AGENT_ID not found in .env")
    sys.exit(1)

HEADERS = {
    "X-API-Key": HUNAR_API_KEY,
    "Content-Type": "application/json"
}

BASE_URL = "https://api.voice.hunar.ai/external/v1"

async def test_call():
    print("Initiating test call...")
    
    payload = {
        "agent_id": HUNAR_AGENT_ID,
        "callee_name": "Kalpana",
        "mobile_number": "+919821158480", # Formatting with +91
        "custom_data": {
            "company_name": "HireMe.Ai",
            "job_title": "swipper",
            "required_skills": "good communication, professional manner to handling the things"
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(f"{BASE_URL}/calls/", headers=HEADERS, json=payload)
        
        if response.status_code == 200:
            call_data = response.json()
            print("Call successfully initiated!")
            print(f"Call ID: {call_data['id']}")
            print(f"Status: {call_data['status']}")
            print("\nPlease wait a few moments for your phone to ring.")
        else:
            print(f"Failed to initiate call: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    asyncio.run(test_call())

