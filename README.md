# HireMe.Ai 🤖

HireMe.Ai is an advanced, end-to-end AI Recruiter SaaS platform that automates the most time-consuming parts of the hiring process: candidate sourcing, phone screening, and interview scheduling.

By combining powerful data enrichment APIs with conversational Voice AI, HireMe.Ai acts as a 24/7 robotic recruiter that can find candidates, call them on their phones, conduct human-like technical screens, and summarize the results on a beautiful dashboard.

---

## 🎯 Problem Being Solved

Modern recruiters spend up to 70% of their day on repetitive tasks:
1. Manually scrolling through LinkedIn/Apollo to find candidates.
2. Dialing hundreds of phone numbers only to get voicemails or un-interested candidates.
3. Conducting repetitive 10-minute screening calls to ask the exact same basic questions (Notice period? Salary expectations? Tech stack?).

**HireMe.Ai solves this by fully automating the top-of-funnel pipeline.** Recruiters simply define a job description, and the system automatically finds candidates, instantly calls them via an AI Voice Agent, and presents only the highly qualified, interested candidates on a dashboard.

---

## 🛠️ Technology Stack

The application is built using a modern, decoupled architecture:

### Frontend
- **Next.js 14** (App Router, React)
- **Tailwind CSS** (for styling)
- **Lucide React** (Icons)
- **Vercel** (Hosting)

### Backend
- **Python 3.11+ & FastAPI** (High-performance API framework)
- **MongoDB** (NoSQL Database via Motor async driver)
- **Pydantic** (Data validation and settings management)
- **Render** (Hosting)

### Third-Party Integrations
- **Hunar Voice AI**: Powers the conversational AI agent that physically calls candidates over the telecom network.
- **Coresignal API**: Used to enrich candidate profiles and fetch their personal mobile numbers.
- **Apollo API** *(Alternative)*: Used for broad candidate searching.

---

## ✨ Features

- **Automated Candidate Sourcing**: Search for candidates by Job Title, Skills, and Location.
- **One-Click AI Outreach**: Instantly dispatch a Voice AI agent to call a candidate on their mobile phone.
- **Conversational Screening**: The AI naturally asks about experience, salary expectations, notice period, and interview availability.
- **Real-Time Webhooks**: The moment the candidate hangs up, the call transcript and AI-extracted summary are pushed to the dashboard.
- **Dynamic Dashboard**: View hiring pipelines, conversion metrics, and recent call activities at a glance.
- **Cost-Optimized Enrichment**: Intelligent API usage to prevent massive billing spikes.

---

## 🔄 Application Workflow

1. **Job Creation**: The recruiter creates a new Job inside the dashboard (e.g., "Senior Python Developer").
2. **Sourcing**: The recruiter clicks "Find Candidates". The backend searches the database (or external APIs) for matching profiles.
3. **Target Selection**: The recruiter identifies a promising candidate and clicks **Start AI Outreach**.
4. **Enrichment**: The backend queries Coresignal to find the candidate's personal mobile phone number.
5. **AI Dispatch**: The backend sends the phone number and Job Details to the Hunar AI API.
6. **The Call**: Hunar physically calls the candidate. The AI introduces itself, conducts the screening, and hangs up.
7. **The Summary**: A webhook fires back to the FastAPI backend containing the transcript and a structured JSON summary of the candidate's answers.
8. **Pipeline Update**: The dashboard instantly updates to show if the candidate was "Qualified" and "Interested".

---

## 💡 How I Reduced Extra API Costs

Data enrichment APIs (like Coresignal or Apollo) are highly expensive and charge per API hit. I implemented two major cost-saving strategies:

### 1. Database Caching for Search Results
**The Problem:** If a recruiter searches for candidates for a "Senior Python Engineer" role, evaluates a few, and then comes back the next day to find more candidates for the *same* role, clicking "Find Candidates" again would trigger another expensive API search, duplicating costs for data we already paid for.
**The Solution:** All sourced candidates are permanently cached in **MongoDB** under their respective Job ID. When a recruiter opens a job, the system instantly loads the candidates from the local database for free. We only hit the external search API if the recruiter explicitly requests *more/new* candidates.

### 2. On-Demand Phone Enrichment
**The Problem:** Querying external APIs for personal phone numbers is the most expensive operation. Finding 500 candidates and fetching 500 phone numbers immediately would incur massive costs, even for candidates the recruiter doesn't actually want to call.
**The Solution:** I implemented an **On-Demand Enrichment Strategy**. When searching for candidates, the app only fetches basic, cheap metadata (Name, Title, Company). We do *not* fetch phone numbers yet. Only when the recruiter explicitly clicks the **"Start AI Outreach"** button on a specific candidate does the backend fire a targeted request to Coresignal just for that single person. This guarantees that premium credits are *only* spent on candidates who are actually being called, reducing external API costs by over 95%.

---

## 🚀 Setup & Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (Local or Atlas)
- API Keys: Hunar AI, Coresignal

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   MONGODB_URI=mongodb://localhost:27017
   HUNAR_API_KEY=your_key_here
   CORESIGNAL_API_KEY=your_key_here
   TEST_PHONE_NUMBER=+919876543210
   ```
4. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser!

---
*Built with ❤️ for modern recruiting.*
