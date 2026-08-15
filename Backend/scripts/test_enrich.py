import httpx
import asyncio

async def test_enrich():
    url = "http://localhost:8000/api/v1/candidates/enrich"
    payload = {
        "job_id": "64d0e6c8e4b0a70012e12c12", # Fake valid mongo id
        "name": "Sarah Chen",
        "organization_domain": "google.com",
        "email": "sarah@google.com"
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload)
            print("Status:", resp.status_code)
            print("Response:", resp.text)
        except Exception as e:
            print(e)

if __name__ == "__main__":
    asyncio.run(test_enrich())
