from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.sensor import SensorData
from app.schemas.telemetry import SensorDataCreate, SensorDataResponse
from app.schemas.common import ApiResponse
from app.services.auth import get_current_user
from app.services.permission import check_device_permission

router = APIRouter(tags=["Telemetry"])


@router.get("/devices/{device_id}/telemetry", response_model=ApiResponse[List[SensorDataResponse]])
def get_telemetry(
    device_id: int,
    limit: int = Query(default=50, ge=1, le=1000),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])

    query = db.query(SensorData).filter(SensorData.device_id == device_id)
    if start_time:
        query = query.filter(SensorData.timestamp >= start_time)
    if end_time:
        query = query.filter(SensorData.timestamp <= end_time)

    records = query.order_by(SensorData.timestamp.desc()).limit(limit).all()
    return ApiResponse(data=[SensorDataResponse.model_validate(r) for r in records])


@router.post("/devices/{device_id}/telemetry", response_model=ApiResponse[SensorDataResponse], status_code=status.HTTP_201_CREATED)
def record_telemetry(
    device_id: int,
    tel_in: SensorDataCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])

    sensor_rec = SensorData(
        device_id=device_id,
        timestamp=tel_in.timestamp or datetime.utcnow(),
        temperature=tel_in.temperature,
        humidity=tel_in.humidity,
        pm25=tel_in.pm25,
        co2=tel_in.co2,
        extra_metrics=tel_in.extra_metrics
    )
    db.add(sensor_rec)
    db.commit()
    db.refresh(sensor_rec)
    return ApiResponse(data=SensorDataResponse.model_validate(sensor_rec))
