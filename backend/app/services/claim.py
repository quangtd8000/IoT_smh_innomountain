"""Claim token để thiết bị mới TỰ ĐĂNG KÝ vào đúng ngôi nhà.

Vấn đề scale: nếu mỗi board phải cấu hình tay UID + tạo device trên web trước
khi cắm điện, thì thêm node thứ N là N thao tác tay — không scale được.

Cách làm ở đây không cần bảng DB mới: token là HMAC(khoá server) trên
`home_id. expiry`. Backend cấp token này cho owner/admin ngay trước khi ghép
nối BLE; ESP32 lưu vào NVS và gửi kèm mỗi bản tin telemetry. Backend thấy UID
lạ + token hợp lệ thì tự tạo device trong đúng home đó.

Stateless nên không cần dọn rác, không cần thêm migration, và token tự hết hạn.
"""

import base64
import hashlib
import hmac
import time
from typing import Optional

from app.config import settings

# Token sống 1 giờ: đủ cho một buổi lắp đặt, ngắn để token lộ ra cũng vô dụng.
CLAIM_TTL_SECONDS = 3600


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64decode(text: str) -> bytes:
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def _signature(home_id: int, expires_at: int) -> bytes:
    message = f"{home_id}.{expires_at}".encode()
    return hmac.new(settings.JWT_SECRET.encode(), message, hashlib.sha256).digest()


def issue_claim_token(home_id: int, ttl_seconds: int = CLAIM_TTL_SECONDS) -> str:
    """Cấp token cho phép thiết bị tự đăng ký vào `home_id`."""
    expires_at = int(time.time()) + ttl_seconds
    payload = f"{home_id}.{expires_at}".encode()
    return _b64encode(payload + b"." + _signature(home_id, expires_at))


def verify_claim_token(token: Optional[str]) -> Optional[int]:
    """Trả về `home_id` nếu token hợp lệ và chưa hết hạn, ngược lại None."""
    if not token or not isinstance(token, str):
        return None
    try:
        raw = _b64decode(token)
        home_part, expires_part, signature = raw.split(b".", 2)
        home_id = int(home_part)
        expires_at = int(expires_part)
    except (ValueError, TypeError):
        return None

    # compare_digest: so sánh chống dò thời gian.
    if not hmac.compare_digest(signature, _signature(home_id, expires_at)):
        return None
    if expires_at < int(time.time()):
        return None
    return home_id
