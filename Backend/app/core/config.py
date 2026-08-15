from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "HireMe.Ai API"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    
    # External APIs
    HUNAR_API_KEY: str = ""
    HUNAR_AGENT_ID: str = ""
    CORESIGNAL_API_KEY: str = ""
    
    # Testing
    TEST_PHONE_NUMBER: str = "+15550199999"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")

settings = Settings()
