import json
import logging
import re
from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.device import Device, RelayChannel
from app.models.sensor import SensorData

logger = logging.getLogger("mqtt")

# Topic Patterns:
TELEMETRY_PATTERN = re.compile(r"^home/(\d+)/device/(\d+)/telemetry$")
STATE_PATTERN = re.compile(r"^home/(\d+)/device/(\d+)/(state|status)$")
SMART_HOME_TEL_PATTERN = re.compile(r"^(?:smart_home|smarthome)/([^/]+)/telemetry$")
SMART_HOME_STATE_PATTERN = re.compile(r"^(?:smart_home|smarthome)/([^/]+)/(state|status)$")


def on_connect(client, userdata, flags, rc, properties=None):
    logger.info(f"Connected to MQTT Broker (rc={rc})")
    client.subscribe("home/+/device/+/telemetry", qos=1)
    client.subscribe("home/+/device/+/state", qos=1)
    client.subscribe("home/+/device/+/status", qos=1)
    client.subscribe("smart_home/+/telemetry", qos=1)
    client.subscribe("smart_home/+/state", qos=1)
    client.subscribe("smart_home/+/status", qos=1)
    client.subscribe("smarthome/+/telemetry", qos=1)
    client.subscribe("smarthome/+/state", qos=1)
    client.subscribe("smarthome/+/status", qos=1)
    logger.info("Subscribed to telemetry, state, and status topics")


def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload_str = msg.payload.decode("utf-8").strip()
        
        # Handle plain text (e.g. "online", "offline") vs JSON object
        if payload_str in ["online", "offline"]:
            payload = {"status": payload_str}
        else:
            try:
                payload = json.loads(payload_str)
            except Exception:
                payload = {"raw": payload_str}

        logger.info(f"Received MQTT msg on [{topic}]: {payload_str}")

        m_tel = TELEMETRY_PATTERN.match(topic)
        m_state = STATE_PATTERN.match(topic)
        m_sh_tel = SMART_HOME_TEL_PATTERN.match(topic)
        m_sh_state = SMART_HOME_STATE_PATTERN.match(topic)

        db = SessionLocal()
        try:
            if m_tel:
                home_id = int(m_tel.group(1))
                device_id = int(m_tel.group(2))
                device = db.query(Device).filter(Device.id == device_id, Device.home_id == home_id).first()
                if device:
                    process_telemetry(db, device, payload)
                else:
                    logger.warning(f"Device {device_id} in home {home_id} not found for telemetry")
            elif m_state:
                home_id = int(m_state.group(1))
                device_id = int(m_state.group(2))
                device = db.query(Device).filter(Device.id == device_id, Device.home_id == home_id).first()
                if device:
                    process_state(db, device, payload)
                else:
                    logger.warning(f"Device {device_id} in home {home_id} not found for state update")
            elif m_sh_tel:
                device_uid = m_sh_tel.group(1)
                device = db.query(Device).filter(Device.device_uid == device_uid).first()
                if not device and device_uid.startswith("node"):
                    device = db.query(Device).first()
                if device:
                    process_telemetry(db, device, payload)
                else:
                    logger.warning(f"Device UID {device_uid} not found for telemetry")
            elif m_sh_state:
                device_uid = m_sh_state.group(1)
                device = db.query(Device).filter(Device.device_uid == device_uid).first()
                if not device and device_uid.startswith("node"):
                    device = db.query(Device).first()
                if device:
                    process_state(db, device, payload)
                else:
                    logger.warning(f"Device UID {device_uid} not found for state update")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error handling MQTT message on [{msg.topic}]: {e}")


def process_telemetry(db, device: Device, payload: dict):
    now_utc = datetime.now(timezone.utc)
    ts = now_utc
    if "timestamp" in payload and payload["timestamp"]:
        try:
            ts = datetime.fromisoformat(str(payload["timestamp"]).replace("Z", "+00:00"))
        except Exception:
            pass

    temp = payload.get("temperature") if payload.get("temperature") is not None else payload.get("temp")
    rh = payload.get("humidity") if payload.get("humidity") is not None else payload.get("rh")
    pm25 = payload.get("pm25") if payload.get("pm25") is not None else payload.get("pm2_5")
    co2 = payload.get("co2")

    extra = payload.get("extra_metrics") or {}
    if not isinstance(extra, dict):
        extra = {}
    for k in ["voc_index", "nox_index", "sraw_voc", "sraw_nox", "pm1_0", "pm10", "uptime", "node_id"]:
        if k in payload and k not in extra:
            extra[k] = payload[k]

    sensor_rec = SensorData(
        device_id=device.id,
        timestamp=ts,
        temperature=temp,
        humidity=rh,
        pm25=pm25,
        co2=co2,
        extra_metrics=extra if extra else None
    )
    db.add(sensor_rec)
    device.last_seen = now_utc
    device.status = "online"
    db.commit()


def process_state(db, device: Device, payload: dict):
    now_utc = datetime.now(timezone.utc)
    device.last_seen = now_utc
    if "online" in payload:
        device.status = "online" if payload["online"] else "offline"
    elif "status" in payload:
        device.status = "online" if payload["status"] == "online" else "offline"
    else:
        device.status = "online"

    if "relays" in payload and isinstance(payload["relays"], list):
        for ch_info in payload["relays"]:
            ch_num = ch_info.get("channel")
            ch_state = ch_info.get("state")
            if ch_num is not None and ch_state is not None:
                ch = db.query(RelayChannel).filter(RelayChannel.device_id == device.id, RelayChannel.channel == ch_num).first()
                if ch:
                    ch.state = bool(ch_state)
                    ch.updated_at = now_utc

    db.commit()
