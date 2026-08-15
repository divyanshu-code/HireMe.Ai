import asyncio
import httpx

from app.core.config import settings

async def test_coresignal():
    url = "https://api.coresignal.com/cdapi/v2/employee_base/collect/182849843"
    headers = {
        "apikey": settings.CORESIGNAL_API_KEY,
        "Content-Type": "application/json",
        "accept": "application/json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {response.json()}")
        except Exception:
            print(f"Response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_coresignal())
