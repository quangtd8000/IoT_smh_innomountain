from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.schemas.common import ApiResponse
from app.services.auth import get_current_user
from app.services.permission import check_home_permission

router = APIRouter(tags=["Rooms"])


@router.get("/homes/{home_id}/rooms", response_model=ApiResponse[List[RoomResponse]])
def list_rooms(
    home_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner", "admin", "member"])
    rooms = db.query(Room).filter(Room.home_id == home_id).all()
    return ApiResponse(data=[RoomResponse.model_validate(r) for r in rooms])


@router.post("/homes/{home_id}/rooms", response_model=ApiResponse[RoomResponse], status_code=status.HTTP_201_CREATED)
def create_room(
    home_id: int,
    room_in: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner", "admin"])
    room = Room(home_id=home_id, name=room_in.name)
    db.add(room)
    db.commit()
    db.refresh(room)
    return ApiResponse(data=RoomResponse.model_validate(room))


@router.get("/rooms/{room_id}", response_model=ApiResponse[RoomResponse])
def get_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ROOM_NOT_FOUND", "message": f"Room {room_id} not found"}
        )
    check_home_permission(db, current_user.id, room.home_id, ["owner", "admin", "member"])
    return ApiResponse(data=RoomResponse.model_validate(room))


@router.put("/rooms/{room_id}", response_model=ApiResponse[RoomResponse])
def update_room(
    room_id: int,
    room_in: RoomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ROOM_NOT_FOUND", "message": f"Room {room_id} not found"}
        )
    check_home_permission(db, current_user.id, room.home_id, ["owner", "admin"])
    if room_in.name is not None:
        room.name = room_in.name
    db.commit()
    db.refresh(room)
    return ApiResponse(data=RoomResponse.model_validate(room))


@router.delete("/rooms/{room_id}", response_model=ApiResponse[dict])
def delete_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "ROOM_NOT_FOUND", "message": f"Room {room_id} not found"}
        )
    check_home_permission(db, current_user.id, room.home_id, ["owner", "admin"])
    db.delete(room)
    db.commit()
    return ApiResponse(data={"deleted": True, "room_id": room_id})
