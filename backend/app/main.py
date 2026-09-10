import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError, HTTPException

from app.config import settings
from app.database import SessionLocal
from app.mqtt.client import get_mqtt_client
from app.mqtt.subscriber import on_connect, on_message
from app.services.device_status import mark_stale_devices_offline
from app.routers import auth, homes, rooms, devices, telemetry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")


def _mark_stale_once() -> None:
    db = SessionLocal()
    try:
        mark_stale_devices_offline(db)
    finally:
        db.close()


async def stale_device_worker(interval_seconds: int = 30) -> None:
    """Job nền đánh dấu thiết bị hết hạn last_seen thành offline.

    Thay cho logic ghi DB từng nằm trong GET list_devices (endpoint phải
    chỉ-đọc, và ghi trong GET dễ đè trạng thái online vừa được subscriber cập).
    """
    while True:
        await asyncio.sleep(interval_seconds)
        try:
            await asyncio.to_thread(_mark_stale_once)
        except Exception as e:
            logger.error(f"stale_device_worker failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = get_mqtt_client()
    client.on_connect = on_connect
    client.on_message = on_message
    try:
        logger.info(f"Connecting to MQTT broker {settings.MQTT_HOST}:{settings.MQTT_PORT}...")
        client.connect_async(settings.MQTT_HOST, settings.MQTT_PORT, keepalive=60)
        client.loop_start()
        logger.info("MQTT client loop started")
    except Exception as e:
        logger.error(f"Failed to start MQTT client: {e}")

    status_task = asyncio.create_task(stale_device_worker())
    yield

    status_task.cancel()
    try:
        client.loop_stop()
        client.disconnect()
        logger.info("MQTT client stopped")
    except Exception as e:
        logger.error(f"Error stopping MQTT client: {e}")


app = FastAPI(
    title="Smart Home Backend",
    version="1.0.0",
    description="Smart Home FastAPI Backend Specification v1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": exc.detail
            }
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": str(exc.detail)
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_err = errors[0] if errors else {}
    msg = f"{first_err.get('loc', ['field'])[-1]}: {first_err.get('msg', 'Validation error')}"
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg
            }
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred"
            }
        }
    )


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "success": True,
        "data": {
            "status": "healthy",
            "version": "1.0.0"
        }
    }


app.include_router(auth.router, prefix="/api")
app.include_router(homes.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(devices.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")
