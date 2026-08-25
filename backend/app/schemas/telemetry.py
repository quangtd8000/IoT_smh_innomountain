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


class TelemetryBucket(BaseModel):
    """Mot o thoi gian da gop san. Khong co id vi day la nhieu ban ghi cong lai."""
    timestamp: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    pm25: Optional[float] = None
    co2: Optional[float] = None
    voc_index: Optional[float] = None
    nox_index: Optional[float] = None
    count: int
