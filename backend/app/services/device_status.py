import logging
from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.device import Device

logger = logging.getLogger("device_status")

# Thiết bị không gửi telemetry/state trong khoảng này bị coi là offline.
# (Trước đây con số 120 nằm inline trong GET list_devices.)
DEVICE_OFFLINE_AFTER_SECONDS = 120


def mark_stale_devices_offline(db: Session) -> int:
    """Đánh dấu offline các thiết bị đang online nhưng đã hết hạn last_seen.

    Tách khỏi GET /homes/{id}/devices vì:
    - Endpoint list phải là thao tác chỉ-đọc;
    - Tránh cạnh tranh ghi DB với mqtt/subscriber.py (thiết bị vừa báo online
      có thể bị request GET cũ đè thành offline).
    Chỉ HTTP list mới cần đọc trạng thái; trạng thái "chuẩn" thuộc luồng
    MQTT state/telemetry + job nền này.
    """
    now = datetime.now(timezone.utc)
    stale = (
        db.query(Device)
        .filter(Device.status == "online")
        .filter(
            func.coalesce(
                func.extract("epoch", now - Device.last_seen),
                DEVICE_OFFLINE_AFTER_SECONDS + 1,
            )
            > DEVICE_OFFLINE_AFTER_SECONDS
        )
        .all()
    )
    for d in stale:
        d.status = "offline"
    if stale:
        db.commit()
        logger.info(f"Marked {len(stale)} stale device(s) offline")
    return len(stale)
