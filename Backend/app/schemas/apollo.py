from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ApolloSearchRequest(BaseModel):
    job_titles: List[str] = Field(default_factory=list, description="List of job titles to search for")
    locations: List[str] = Field(default_factory=list, description="List of locations")
    keywords: List[str] = Field(default_factory=list, description="Keywords to include in search")
    page: int = 1
    page_size: int = 10

class ApolloEnrichRequest(BaseModel):
    job_id: str = Field(description="The internal job ID to link this candidate to")
    name: str = Field(description="Candidate's full name")
    organization_domain: Optional[str] = Field(default=None, description="Candidate's company domain")
    email: Optional[str] = Field(default=None, description="Candidate's email if known")
    linkedin_url: Optional[str] = Field(default=None, description="Candidate's linkedin URL")
    
    # Passing context from the search results to populate our Candidate DB record
    apollo_id: Optional[str] = None
    title: Optional[str] = None
    location: Optional[str] = None
