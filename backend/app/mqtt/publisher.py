import json
import logging
from app.mqtt.client import get_mqtt_client
from app.database import SessionLocal
from app.models.device import Device

logger = logging.getLogger("mqtt")


def publish_device_command(home_id: int, device_id: int, payload: dict) -> bool:
    client = get_mqtt_client()
    topic = f"home/{home_id}/device/{device_id}/command"
    try:
        msg = json.dumps(payload)
        client.publish(topic, msg, qos=1)
        logger.info(f"Published command to {topic}: {msg}")

        # Also publish to smart_home/<device_uid>/command for device compatibility
        try:
            db = SessionLocal()
            try:
                device = db.query(Device).filter(Device.id == device_id).first()
                if device and device.device_uid:
                    uid_topic = f"smart_home/{device.device_uid}/command"
                    client.publish(uid_topic, msg, qos=1)
                    logger.info(f"Also published command to {uid_topic}: {msg}")
            finally:
                db.close()
        except Exception as e_uid:
            logger.debug(f"Could not publish to UID topic: {e_uid}")

        return True
    except Exception as e:
        logger.error(f"Failed to publish command to {topic}: {e}")
        return False
