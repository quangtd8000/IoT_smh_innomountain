from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.home import Home, HomeMember
from app.schemas.home import HomeCreate, HomeUpdate, HomeResponse, HomeMemberAdd, HomeMemberResponse
from app.schemas.common import ApiResponse
from app.services.auth import get_current_user
from app.services.permission import check_home_permission

router = APIRouter(prefix="/homes", tags=["Homes"])


@router.get("", response_model=ApiResponse[List[HomeResponse]])
def list_homes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    memberships = db.query(HomeMember).filter(HomeMember.user_id == current_user.id).all()
    results = []
    for m in memberships:
        home = db.query(Home).filter(Home.id == m.home_id).first()
        if home:
            resp = HomeResponse(
                id=home.id,
                name=home.name,
                owner_id=home.owner_id,
                created_at=home.created_at,
                role=m.role
            )
            results.append(resp)
    return ApiResponse(data=results)


@router.post("", response_model=ApiResponse[HomeResponse], status_code=status.HTTP_201_CREATED)
def create_home(
    home_in: HomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    home = Home(
        name=home_in.name,
        owner_id=current_user.id
    )
    db.add(home)
    db.flush()

    membership = HomeMember(
        home_id=home.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(membership)
    db.commit()
    db.refresh(home)

    return ApiResponse(data=HomeResponse(
        id=home.id,
        name=home.name,
        owner_id=home.owner_id,
        created_at=home.created_at,
        role="owner"
    ))


@router.get("/{home_id}", response_model=ApiResponse[HomeResponse])
def get_home(
    home_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = check_home_permission(db, current_user.id, home_id, ["owner", "admin", "member"])
    home = db.query(Home).filter(Home.id == home_id).first()
    return ApiResponse(data=HomeResponse(
        id=home.id,
        name=home.name,
        owner_id=home.owner_id,
        created_at=home.created_at,
        role=member.role
    ))


@router.put("/{home_id}", response_model=ApiResponse[HomeResponse])
def update_home(
    home_id: int,
    home_in: HomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = check_home_permission(db, current_user.id, home_id, ["owner", "admin"])
    home = db.query(Home).filter(Home.id == home_id).first()
    if home_in.name is not None:
        home.name = home_in.name
    db.commit()
    db.refresh(home)
    return ApiResponse(data=HomeResponse(
        id=home.id,
        name=home.name,
        owner_id=home.owner_id,
        created_at=home.created_at,
        role=member.role
    ))


@router.delete("/{home_id}", response_model=ApiResponse[dict])
def delete_home(
    home_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner"])
    home = db.query(Home).filter(Home.id == home_id).first()
    db.delete(home)
    db.commit()
    return ApiResponse(data={"deleted": True, "home_id": home_id})


@router.get("/{home_id}/members", response_model=ApiResponse[List[HomeMemberResponse]])
def list_members(
    home_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner", "admin", "member"])
    members = db.query(HomeMember).filter(HomeMember.home_id == home_id).all()
    results = [HomeMemberResponse.model_validate(m) for m in members]
    return ApiResponse(data=results)


@router.post("/{home_id}/members", response_model=ApiResponse[HomeMemberResponse], status_code=status.HTTP_201_CREATED)
def add_member(
    home_id: int,
    member_in: HomeMemberAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner", "admin"])

    target_user = None
    if member_in.user_id:
        target_user = db.query(User).filter(User.id == member_in.user_id).first()
    elif member_in.username:
        target_user = db.query(User).filter(User.username == member_in.username).first()
    elif member_in.email:
        target_user = db.query(User).filter(User.email == member_in.email).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "USER_NOT_FOUND", "message": "Target user not found"}
        )

    if member_in.role not in ["owner", "admin", "member"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_ROLE", "message": "Role must be owner, admin, or member"}
        )

    existing = db.query(HomeMember).filter(HomeMember.home_id == home_id, HomeMember.user_id == target_user.id).first()
    if existing:
        existing.role = member_in.role
        db.commit()
        db.refresh(existing)
        return ApiResponse(data=HomeMemberResponse.model_validate(existing))

    new_member = HomeMember(
        home_id=home_id,
        user_id=target_user.id,
        role=member_in.role
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return ApiResponse(data=HomeMemberResponse.model_validate(new_member))


@router.delete("/{home_id}/members/{user_id}", response_model=ApiResponse[dict])
def remove_member(
    home_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner", "admin"])
    home = db.query(Home).filter(Home.id == home_id).first()
    if home.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "CANNOT_REMOVE_OWNER", "message": "Cannot remove the owner of the home"}
        )

    member = db.query(HomeMember).filter(HomeMember.home_id == home_id, HomeMember.user_id == user_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "MEMBER_NOT_FOUND", "message": "Member not found in this home"}
        )

    db.delete(member)
    db.commit()
    return ApiResponse(data={"removed": True, "user_id": user_id, "home_id": home_id})


@router.get("/{home_id}/provision-config", response_model=ApiResponse[dict])
def get_provision_config(
    home_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cấu hình provisioning ESP32 qua BLE (broker + MQTT credential).

    Credential MQTT không được hardcode trong bundle frontend (spec §30/§32:
    credential thuộc Backend↔EMQX↔ESP32). Frontend gọi endpoint này với JWT
    ngay trước khi ghép nối; chỉ owner/admin mới được cấp.
    """
    check_home_permission(db, current_user.id, home_id, ["owner", "admin"])
    if not settings.PROVISION_MQTT_USERNAME or not settings.PROVISION_MQTT_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "PROVISION_NOT_CONFIGURED",
                "message": "Máy chủ chưa cấu hình PROVISION_MQTT_USERNAME / PROVISION_MQTT_PASSWORD trong .env"
            }
        )
    return ApiResponse(data={
        "broker": settings.PROVISION_BROKER,
        "user": settings.PROVISION_MQTT_USERNAME,
        "pass_mqtt": settings.PROVISION_MQTT_PASSWORD,
    })
