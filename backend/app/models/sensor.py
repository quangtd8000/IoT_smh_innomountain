from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, ForeignKey, DateTime, Float, Index
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(BigInteger, primary_key=True, index=True)
    device_id = Column(BigInteger, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)
    pm25 = Column(Float, nullable=True)
    co2 = Column(Float, nullable=True)
    extra_metrics = Column(JSONB, nullable=True)

    __table_args__ = (
        Index("idx_sensor_data_device_timestamp", "device_id", "timestamp"),
    )

    device = relationship("Device", back_populates="sensor_data")
