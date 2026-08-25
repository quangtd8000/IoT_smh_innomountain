from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class SensorDataBase(BaseModel):
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pm25: Optional[float] = None
    co2: Optional[float] = None
    extra_metrics: Optional[Dict[str, Any]] = None


class SensorDataCreate(SensorDataBase):
    timestamp: Optional[datetime] = None


class SensorDataResponse(SensorDataBase):
    id: int
    device_id: int
    timestamp: datetime

    class Config:
        from_attributes = True
