from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class RelayChannelBase(BaseModel):
    channel: int
    name: str
    state: bool = False


class RelayChannelCreate(RelayChannelBase):
    pass


class RelayChannelUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[bool] = None


class RelayChannelResponse(RelayChannelBase):
    id: int
    device_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IRCommandBase(BaseModel):
    name: str
    protocol: Optional[str] = "NEC"
    address: Optional[int] = None
    command: Optional[int] = None
    bits: Optional[int] = None
    repeats: int = 1
    frequency: int = 38000
    raw_data: Optional[List[int]] = None
    extra_data: Optional[Dict[str, Any]] = None


class IRCommandCreate(IRCommandBase):
    pass


class IRCommandResponse(IRCommandBase):
    id: int
    ir_device_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IRDeviceCreate(BaseModel):
    name: str
    target_type: str
    brand: Optional[str] = None
    emitter_pin: Optional[int] = 1


class IRDeviceResponse(BaseModel):
    id: int
    device_id: int
    name: str
    target_type: str
    brand: Optional[str] = None
    emitter_pin: int
    created_at: datetime
    updated_at: datetime
    commands: Optional[List[IRCommandResponse]] = []

    class Config:
        from_attributes = True


class DeviceCreate(BaseModel):
    device_uid: str
    name: str
    device_type: Optional[str] = "controller"
    room_id: Optional[int] = None


class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    room_id: Optional[int] = None
    device_type: Optional[str] = None


class DeviceCredentialCreate(BaseModel):
    mqtt_username: str
    password: str


class DeviceCredentialResponse(BaseModel):
    id: int
    device_id: int
    mqtt_username: str
    enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DeviceResponse(BaseModel):
    id: int
    home_id: int
    room_id: Optional[int] = None
    device_uid: str
    name: str
    device_type: str
    status: str
    created_at: datetime
    last_seen: Optional[datetime] = None
    relay_channels: Optional[List[RelayChannelResponse]] = []
    ir_devices: Optional[List[IRDeviceResponse]] = []

    class Config:
        from_attributes = True


class DeviceCommandRequest(BaseModel):
    command: str
    value: Optional[Any] = None
    channel: Optional[int] = None
    state: Optional[bool] = None
    extra: Optional[Dict[str, Any]] = None
