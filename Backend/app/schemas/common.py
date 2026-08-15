from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import BeforeValidator
from typing import Annotated, Optional

# A custom type to handle MongoDB ObjectIds in Pydantic.
# Pydantic v2 uses Annotated and BeforeValidator to cast the ObjectId to a string before validation.
PyObjectId = Annotated[str, BeforeValidator(str)]

class MongoBaseModel(BaseModel):
    """
    Base model for all MongoDB documents.
    Maps the MongoDB '_id' to 'id' in our Pydantic schemas.
    """
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={PyObjectId: str}
    )
