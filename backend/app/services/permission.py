from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.home import HomeMember, Home
from app.models.device import Device


def get_home_membership(db: Session, user_id: int, home_id: int) -> Optional[HomeMember]:
    return db.query(HomeMember).filter(
        HomeMember.user_id == user_id,
        HomeMember.home_id == home_id
    ).first()


def check_home_permission(
    db: Session,
    user_id: int,
    home_id: int,
    allowed_roles: List[str] = ["owner", "admin", "member"]
) -> HomeMember:
    member = get_home_membership(db, user_id, home_id)
    if not member or member.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "FORBIDDEN", "message": "You do not have permission for this home"}
        )
    return member


def check_device_permission(
    db: Session,
    user_id: int,
    device_id: int,
    allowed_roles: List[str] = ["owner", "admin", "member"]
) -> Tuple[Device, HomeMember]:
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "DEVICE_NOT_FOUND", "message": f"Device with ID {device_id} not found"}
        )
    member = check_home_permission(db, user_id, device.home_id, allowed_roles)
    return device, member
