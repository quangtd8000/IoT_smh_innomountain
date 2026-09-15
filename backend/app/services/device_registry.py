"""Tự đăng ký thiết bị mới khi bản tin đầu tiên tới.

Luồng scale: nạp cùng một firmware cho mọi board (UID suy từ MAC), cắm điện,
ghép nối BLE một lần để nhận Wi-Fi + `claim_token`. Bản tin telemetry đầu tiên
mang UID lạ + token hợp lệ -> backend tự tạo device trong đúng home, đúng loại
(relay/sensor), kèm 3 kênh công tắc nếu là relay.

Nhờ vậy thêm node thứ N không cần sửa platformio.ini, không cần tạo device tay.
"""

import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.device import Device, RelayChannel
from app.services.claim import verify_claim_token

logger = logging.getLogger("device_registry")

# Trùng với routers/devices.py — relay node có 3 kênh phần cứng.
MAX_RELAY_CHANNELS = 3


def _infer_device_type(payload: dict) -> str:
    """Suy loại thiết bị từ chính bản tin, không đoán theo tên.

    Firmware gửi `node_type` tường minh; nếu bản firmware cũ không gửi thì suy
    từ sự có mặt của trường `relays`.
    """
    node_type = payload.get("node_type")
    if node_type in ("relay", "sensor", "controller"):
        return node_type
    if isinstance(payload.get("relays"), list):
        return "relay"
    return "sensor"


def auto_register_device(db: Session, device_uid: str, payload: dict) -> Optional[Device]:
    """Tạo device cho UID lạ nếu bản tin mang claim token hợp lệ.

    Trả về Device vừa tạo, hoặc None nếu không có token / token sai-hết hạn
    (khi đó bản tin bị bỏ và ghi cảnh báo như trước).
    """
    home_id = verify_claim_token(payload.get("claim_token"))
    if home_id is None:
        return None

    device_type = _infer_device_type(payload)
    short_uid = device_uid[-5:] if len(device_uid) > 5 else device_uid
    name = f"{'Công tắc' if device_type == 'relay' else 'Cảm biến'} {short_uid}"

    device = Device(
        home_id=home_id,
        device_uid=device_uid,
        name=name,
        device_type=device_type,
        status="online",
    )
    db.add(device)
    db.flush()

    if device_type == "relay":
        db.add_all([
            RelayChannel(device_id=device.id, channel=ch, name=f"Công tắc {ch}", state=False)
            for ch in range(1, MAX_RELAY_CHANNELS + 1)
        ])

    db.commit()
    db.refresh(device)
    logger.info(
        f"Auto-registered device '{device_uid}' ({device_type}) into home {home_id} as id={device.id}"
    )
    return device