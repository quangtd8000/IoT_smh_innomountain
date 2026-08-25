from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.sensor import SensorData
from app.schemas.telemetry import SensorDataCreate, SensorDataResponse, TelemetryBucket
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


@router.get(
    "/devices/{device_id}/telemetry/aggregate",
    response_model=ApiResponse[List[TelemetryBucket]],
)
def get_telemetry_aggregate(
    device_id: int,
    bucket_seconds: int = Query(default=60, ge=10, le=86400),
    start_time: Optional[datetime] = None,
    end_time: Optional[datetime] = None,
    max_points: int = Query(default=500, ge=1, le=2000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Gop telemetry thanh cac o thoi gian deu nhau, tinh trung binh trong SQL.

    Endpoint /telemetry thuong tra ve tung ban ghi tho va bi chan o 1000 dong.
    Cam bien gui khoang nua giay mot lan, nen 1000 dong chi phu ~8 phut — khong
    the ve duoc bieu do 1 gio hay 6 gio. Gop san o day thi mot khoang bao lau
    cung chi tra ve toi da max_points diem.
    """
    check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])

    # Dieu kien dung cot tran, khong boc trong ham, de con dung duoc chi muc
    # idx_sensor_data_device_timestamp tren (device_id, timestamp DESC).
    conditions = ["device_id = :device_id"]
    params = {
        "device_id": device_id,
        "bucket": bucket_seconds,
        "max_points": max_points,
    }
    if start_time is not None:
        conditions.append('"timestamp" >= :start_time')
        params["start_time"] = start_time
    if end_time is not None:
        conditions.append('"timestamp" <= :end_time')
        params["end_time"] = end_time

    where_sql = " AND ".join(conditions)

    # jsonb_typeof de tranh vo khi extra_metrics chua gia tri khong phai so.
    # Lay max_points o MOI NHAT (order desc + limit) roi dao lai cho tang dan.
    sql = text(f"""
        SELECT * FROM (
            SELECT
                to_timestamp(floor(extract(epoch FROM "timestamp") / :bucket) * :bucket) AS bucket_ts,
                avg(temperature) AS temperature,
                avg(humidity)    AS humidity,
                avg(pm25)        AS pm25,
                avg(co2)         AS co2,
                avg(CASE WHEN jsonb_typeof(extra_metrics -> 'voc_index') = 'number'
                         THEN (extra_metrics ->> 'voc_index')::double precision END) AS voc_index,
                avg(CASE WHEN jsonb_typeof(extra_metrics -> 'nox_index') = 'number'
                         THEN (extra_metrics ->> 'nox_index')::double precision END) AS nox_index,
                count(*) AS n
            FROM sensor_data
            WHERE {where_sql}
            GROUP BY 1
            ORDER BY 1 DESC
            LIMIT :max_points
        ) t
        ORDER BY bucket_ts ASC
    """)

    rows = db.execute(sql, params).mappings().all()

    return ApiResponse(data=[
        TelemetryBucket(
            timestamp=r["bucket_ts"],
            temperature=r["temperature"],
            humidity=r["humidity"],
            pm25=r["pm25"],
            co2=r["co2"],
            voc_index=r["voc_index"],
            nox_index=r["nox_index"],
            count=r["n"],
        )
        for r in rows
    ])
