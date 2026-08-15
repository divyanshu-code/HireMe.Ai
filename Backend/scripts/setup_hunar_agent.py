import asyncio
import os
import sys
import httpx
from dotenv import load_dotenv

# Load environment variables
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

HUNAR_API_KEY = os.getenv("HUNAR_API_KEY")

if not HUNAR_API_KEY:
    print("Error: HUNAR_API_KEY not found in .env")
    sys.exit(1)

HEADERS = {
    "X-API-Key": HUNAR_API_KEY,
    "Content-Type": "application/json"
}

BASE_URL = "https://api.voice.hunar.ai/external/v1"

AGENT_PAYLOAD = {
    "name": "Tech Recruitment Screening Agent",
    "language": "ENGLISH",
    "voice_persona": "NEHA",
    "persona_name": "Sarah",
    "objective": "A professional and conversational AI recruiter that contacts candidates to screen them for a specific job role, assessing their interest, experience, and basic qualifications without making the call unnecessarily long.",
    "agent_prompt": (
        "You are Sarah, an AI recruiter calling on behalf of {company_name}. "
        "You are calling the candidate, {callee_name}, regarding their application or fit for the {job_title} role. "
        "Your tone should be professional, brief, respectful, and conversational. Do not sound robotic. "
        "Your goal is to briefly explain the role and ask a few screening questions: "
        "1. Are they still interested and looking for opportunities? "
        "2. Do they have relevant experience in {required_skills}? "
        "3. What is their notice period and expected salary? "
        "4. When are they available for an interview? "
        "Keep your responses short. Acknowledge their answers politely and move to the next question smoothly."
    ),
    "introduction": "Hi {callee_name}, this is Sarah calling from {company_name} regarding the {job_title} position. Am I speaking at a good time?",
    "result_prompt": (
        "Based on the conversation, extract the candidate's hiring information exactly as requested. "
        "Summarize their experience, skills match, notice period, expected salary, and interview availability. "
        "If they did not provide an answer for a specific field, leave it as 'Not provided'. "
        "Provide a short recruiter_summary of the candidate's overall fit and communication."
    ),
    "result_schema": {
        "interested": "boolean",
        "relevant_experience": "string",
        "skills_match": "string",
        "notice_period": "string",
        "expected_salary": "string",
        "interview_availability": "string",
        "qualified": "boolean",
        "recruiter_summary": "string"
    }
}

async def setup_agent():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # First, check if an agent with this name already exists
        print("Checking for existing agents...")
        response = await client.get(f"{BASE_URL}/agents/?page_size=100", headers=HEADERS)
        if response.status_code == 200:
            agents = response.json().get("results", [])
            for agent in agents:
                if agent["name"] == AGENT_PAYLOAD["name"]:
                    print(f"Agent already exists! ID: {agent['id']}")
                    print("Updating existing agent...")
                    update_response = await client.put(f"{BASE_URL}/agents/{agent['id']}/", headers=HEADERS, json=AGENT_PAYLOAD)
                    if update_response.status_code == 200:
                        print(f"Successfully updated agent: {agent['id']}")
                        return agent['id']
                    else:
                        print(f"Failed to update agent: {update_response.text}")
                        return None

        # Create new agent
        print("Creating new agent...")
        create_response = await client.post(f"{BASE_URL}/agents/", headers=HEADERS, json=AGENT_PAYLOAD)
        if create_response.status_code == 200:
            agent = create_response.json()
            print(f"Successfully created agent! ID: {agent['id']}")
            return agent['id']
        else:
            print(f"Failed to create agent: {create_response.text}")
            return None

if __name__ == "__main__":
    agent_id = asyncio.run(setup_agent())
    if agent_id:
        print(f"\n--- SUCCESS ---\nPlease add the following to your .env file:\nHUNAR_AGENT_ID=\"{agent_id}\"")
    else:
        print("\n--- FAILED ---")
