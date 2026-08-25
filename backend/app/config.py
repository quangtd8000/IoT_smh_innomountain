from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql://smarthome:inno123@postgres:5432/smarthome")
    MQTT_HOST: str = Field(default="emqx")
    MQTT_PORT: int = Field(default=1883)
    MQTT_USERNAME: str = Field(default="")
    MQTT_PASSWORD: str = Field(default="")
    JWT_SECRET: str = Field(default="5072e3068a46c492c1be3fd0204dfca29c5c92e31fce2989d46fe114ad6e7d26")
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_EXPIRE_MINUTES: int = Field(default=60)

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
