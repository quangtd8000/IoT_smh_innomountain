from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.auth import UserResponse


class HomeCreate(BaseModel):
    name: str


class HomeUpdate(BaseModel):
    name: Optional[str] = None


class HomeMemberResponse(BaseModel):
    user_id: int
    home_id: int
    role: str
    joined_at: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


class HomeMemberAdd(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    email: Optional[str] = None
    role: str = "member"


class HomeResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    role: Optional[str] = None

    class Config:
        from_attributes = True
