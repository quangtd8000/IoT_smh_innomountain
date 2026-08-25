from app.schemas.common import ApiResponse, ApiErrorResponse, ErrorDetail
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.schemas.home import HomeCreate, HomeUpdate, HomeResponse, HomeMemberAdd, HomeMemberResponse
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from app.schemas.device import (
    DeviceCreate, DeviceUpdate, DeviceResponse,
    DeviceCredentialCreate, DeviceCredentialResponse,
    RelayChannelCreate, RelayChannelUpdate, RelayChannelResponse,
    IRDeviceCreate, IRDeviceResponse,
    IRCommandCreate, IRCommandResponse,
    DeviceCommandRequest
)
from app.schemas.telemetry import SensorDataCreate, SensorDataResponse
