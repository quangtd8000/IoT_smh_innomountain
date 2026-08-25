from typing import Optional
from pydantic import BaseModel


class RoomCreate(BaseModel):
    name: str


class RoomUpdate(BaseModel):
    name: Optional[str] = None


class RoomResponse(BaseModel):
    id: int
    home_id: int
    name: str

    class Config:
        from_attributes = True
