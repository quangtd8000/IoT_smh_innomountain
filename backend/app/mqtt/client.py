import logging
import paho.mqtt.client as mqtt
from app.config import settings

logger = logging.getLogger("mqtt")
mqtt_client = None


def get_mqtt_client():
    global mqtt_client
    if mqtt_client is None:
        client_id = "smarthome-backend-service"
        try:
            mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=client_id)
        except AttributeError:
            mqtt_client = mqtt.Client(client_id=client_id)

        if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
            mqtt_client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
    return mqtt_client
