from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.device import Device, DeviceCredential, RelayChannel, IRDevice, IRCommand
from app.models.room import Room
from app.schemas.device import (
    DeviceCreate, DeviceUpdate, DeviceResponse,
    DeviceCredentialCreate, DeviceCredentialResponse,
    RelayChannelCreate, RelayChannelUpdate, RelayChannelResponse,
    IRDeviceCreate, IRDeviceResponse,
    IRCommandCreate, IRCommandResponse,
    DeviceCommandRequest
)
from app.schemas.common import ApiResponse
from app.services.auth import get_current_user, hash_password
from app.services.permission import check_home_permission, check_device_permission
from app.mqtt.publisher import publish_device_command

router = APIRouter(tags=["Devices"])


# 1. Devices in Home
@router.get("/homes/{home_id}/devices", response_model=ApiResponse[List[DeviceResponse]])
def list_devices(
    home_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner", "admin", "member"])
    devices = db.query(Device).filter(Device.home_id == home_id).order_by(Device.id).all()
    return ApiResponse(data=[DeviceResponse.model_validate(d) for d in devices])


@router.post("/homes/{home_id}/devices", response_model=ApiResponse[DeviceResponse], status_code=status.HTTP_201_CREATED)
def create_device(
    home_id: int,
    device_in: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    check_home_permission(db, current_user.id, home_id, ["owner", "admin"])

    if db.query(Device).filter(Device.device_uid == device_in.device_uid).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "DEVICE_UID_EXISTS", "message": f"Device with UID {device_in.device_uid} already exists"}
        )

    if device_in.room_id:
        room = db.query(Room).filter(Room.id == device_in.room_id, Room.home_id == home_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "ROOM_NOT_IN_HOME", "message": "Specified room does not belong to this home"}
            )

    device = Device(
        home_id=home_id,
        room_id=device_in.room_id,
        device_uid=device_in.device_uid,
        name=device_in.name,
        device_type=device_in.device_type or "controller"
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    # Auto-provision relay channels for controller/relay
    if device.device_type in ["controller", "relay"]:
        ch1 = RelayChannel(device_id=device.id, channel=1, name="Đèn", state=False)
        db.add(ch1)
        if device.device_type == "relay":
            ch2 = RelayChannel(device_id=device.id, channel=2, name="Quạt", state=False)
            db.add(ch2)
        db.commit()

    return ApiResponse(data=DeviceResponse.model_validate(device))


# 2. Single Device
@router.get("/devices/{device_id}", response_model=ApiResponse[DeviceResponse])
def get_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])
    return ApiResponse(data=DeviceResponse.model_validate(device))


@router.put("/devices/{device_id}", response_model=ApiResponse[DeviceResponse])
def update_device(
    device_id: int,
    device_in: DeviceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin"])
    if device_in.name is not None:
        device.name = device_in.name
    if device_in.device_type is not None:
        device.device_type = device_in.device_type
    if device_in.room_id is not None:
        if device_in.room_id > 0:
            room = db.query(Room).filter(Room.id == device_in.room_id, Room.home_id == device.home_id).first()
            if not room:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"code": "INVALID_ROOM", "message": "Room not found in this home"}
                )
            device.room_id = device_in.room_id
        else:
            device.room_id = None

    db.commit()
    db.refresh(device)
    return ApiResponse(data=DeviceResponse.model_validate(device))


@router.delete("/devices/{device_id}", response_model=ApiResponse[dict])
def delete_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin"])
    db.delete(device)
    db.commit()
    return ApiResponse(data={"deleted": True, "device_id": device_id})


# 3. Device Command
@router.post("/devices/{device_id}/command", response_model=ApiResponse[dict])
def send_command(
    device_id: int,
    cmd_in: DeviceCommandRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])

    payload = cmd_in.model_dump(exclude_none=True)

    if cmd_in.command == "relay" or "relay" in cmd_in.command:
        if cmd_in.channel is not None and cmd_in.state is not None:
            ch = db.query(RelayChannel).filter(
                RelayChannel.device_id == device_id,
                RelayChannel.channel == cmd_in.channel
            ).first()
            if ch:
                ch.state = cmd_in.state
                ch.updated_at = datetime.now(timezone.utc)
                db.commit()

    success = publish_device_command(device.home_id, device.id, payload)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "MQTT_PUBLISH_FAILED", "message": "Failed to publish command to MQTT broker"}
        )

    return ApiResponse(data={"dispatched": True, "device_id": device_id, "command": cmd_in.command})


# 4. Relay Channels
@router.get("/devices/{device_id}/relay-channels", response_model=ApiResponse[List[RelayChannelResponse]])
def list_relay_channels(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])
    channels = db.query(RelayChannel).filter(RelayChannel.device_id == device_id).order_by(RelayChannel.channel).all()
    return ApiResponse(data=[RelayChannelResponse.model_validate(c) for c in channels])


@router.post("/devices/{device_id}/relay-channels", response_model=ApiResponse[RelayChannelResponse], status_code=status.HTTP_201_CREATED)
def create_relay_channel(
    device_id: int,
    ch_in: RelayChannelCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin"])

    existing = db.query(RelayChannel).filter(RelayChannel.device_id == device_id, RelayChannel.channel == ch_in.channel).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "CHANNEL_EXISTS", "message": f"Channel {ch_in.channel} already configured for this device"}
        )

    ch = RelayChannel(
        device_id=device_id,
        channel=ch_in.channel,
        name=ch_in.name,
        state=ch_in.state
    )
    db.add(ch)
    db.commit()
    db.refresh(ch)
    return ApiResponse(data=RelayChannelResponse.model_validate(ch))


@router.put("/devices/{device_id}/relay-channels/{channel_id}", response_model=ApiResponse[RelayChannelResponse])
def update_relay_channel(
    device_id: int,
    channel_id: int,
    ch_in: RelayChannelUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])
    ch = db.query(RelayChannel).filter(RelayChannel.id == channel_id, RelayChannel.device_id == device_id).first()
    if not ch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "CHANNEL_NOT_FOUND", "message": f"Relay channel {channel_id} not found"}
        )

    if ch_in.name is not None:
        ch.name = ch_in.name
    if ch_in.state is not None:
        ch.state = ch_in.state
        publish_device_command(device.home_id, device.id, {
            "command": "relay",
            "channel": ch.channel,
            "state": ch.state
        })

    ch.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ch)
    return ApiResponse(data=RelayChannelResponse.model_validate(ch))


# 5. IR Devices & Commands
@router.get("/devices/{device_id}/ir-devices", response_model=ApiResponse[List[IRDeviceResponse]])
def list_ir_devices(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin", "member"])
    ir_devs = db.query(IRDevice).filter(IRDevice.device_id == device_id).all()
    return ApiResponse(data=[IRDeviceResponse.model_validate(ir) for ir in ir_devs])


@router.post("/devices/{device_id}/ir-devices", response_model=ApiResponse[IRDeviceResponse], status_code=status.HTTP_201_CREATED)
def create_ir_device(
    device_id: int,
    ir_in: IRDeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device, _ = check_device_permission(db, current_user.id, device_id, ["owner", "admin"])
    ir_dev = IRDevice(
        device_id=device_id,
        name=ir_in.name,
        target_type=ir_in.target_type,
        brand=ir_in.brand,
        emitter_pin=ir_in.emitter_pin or 1
    )
    db.add(ir_dev)
    db.commit()
    db.refresh(ir_dev)
    return ApiResponse(data=IRDeviceResponse.model_validate(ir_dev))


@router.get("/ir-devices/{ir_device_id}/commands", response_model=ApiResponse[List[IRCommandResponse]])
def list_ir_commands(
    ir_device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ir_dev = db.query(IRDevice).filter(IRDevice.id == ir_device_id).first()
    if not ir_dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "IR_DEVICE_NOT_FOUND", "message": "IR Device not found"}
        )
    check_device_permission(db, current_user.id, ir_dev.device_id, ["owner", "admin", "member"])
    commands = db.query(IRCommand).filter(IRCommand.ir_device_id == ir_device_id).all()
    return ApiResponse(data=[IRCommandResponse.model_validate(c) for c in commands])


@router.post("/ir-devices/{ir_device_id}/commands", response_model=ApiResponse[IRCommandResponse], status_code=status.HTTP_201_CREATED)
def create_ir_command(
    ir_device_id: int,
    cmd_in: IRCommandCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ir_dev = db.query(IRDevice).filter(IRDevice.id == ir_device_id).first()
    if not ir_dev:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "IR_DEVICE_NOT_FOUND", "message": "IR Device not found"}
        )
    check_device_permission(db, current_user.id, ir_dev.device_id, ["owner", "admin"])

    existing = db.query(IRCommand).filter(IRCommand.ir_device_id == ir_device_id, IRCommand.name == cmd_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "IR_COMMAND_EXISTS", "message": f"Command {cmd_in.name} already exists for this IR device"}
        )

    cmd = IRCommand(
        ir_device_id=ir_device_id,
        name=cmd_in.name,
        protocol=cmd_in.protocol or "NEC",
        address=cmd_in.address,
        command=cmd_in.command,
        bits=cmd_in.bits,
        repeats=cmd_in.repeats,
        frequency=cmd_in.frequency,
        raw_data=cmd_in.raw_data,
        extra_data=cmd_in.extra_data
    )
    db.add(cmd)
    db.commit()
    db.refresh(cmd)
    return ApiResponse(data=IRCommandResponse.model_validate(cmd))


@router.post("/ir-commands/{command_id}/send", response_model=ApiResponse[dict])
def send_ir_command(
    command_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cmd = db.query(IRCommand).filter(IRCommand.id == command_id).first()
    if not cmd:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "COMMAND_NOT_FOUND", "message": f"IR command {command_id} not found"}
        )
    ir_dev = db.query(IRDevice).filter(IRDevice.id == cmd.ir_device_id).first()
    device, _ = check_device_permission(db, current_user.id, ir_dev.device_id, ["owner", "admin", "member"])

    payload = {
        "command": "ir_send",
        "ir_device": ir_dev.name,
        "emitter_pin": ir_dev.emitter_pin,
        "name": cmd.name,
        "protocol": cmd.protocol,
        "address": cmd.address,
        "code": cmd.command,
        "bits": cmd.bits,
        "repeats": cmd.repeats,
        "frequency": cmd.frequency,
        "raw_data": cmd.raw_data,
        "extra_data": cmd.extra_data
    }

    success = publish_device_command(device.home_id, device.id, payload)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "MQTT_PUBLISH_FAILED", "message": "Failed to send IR command to MQTT"}
        )

    return ApiResponse(data={"sent": True, "command_id": command_id, "device_id": device.id})
