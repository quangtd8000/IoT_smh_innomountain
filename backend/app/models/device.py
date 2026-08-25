from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, ForeignKey, DateTime, Boolean, Integer, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import relationship
from app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(BigInteger, primary_key=True, index=True)
    home_id = Column(BigInteger, ForeignKey("homes.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = Column(BigInteger, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True, index=True)
    device_uid = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False, default="controller")
    status = Column(String(20), nullable=False, default="offline")
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    last_seen = Column(DateTime(timezone=True), nullable=True)

    home = relationship("Home", back_populates="devices")
    room = relationship("Room", back_populates="devices")
    credentials = relationship("DeviceCredential", back_populates="device", uselist=False, cascade="all, delete-orphan")
    relay_channels = relationship("RelayChannel", back_populates="device", cascade="all, delete-orphan")
    ir_devices = relationship("IRDevice", back_populates="device", cascade="all, delete-orphan")
    sensor_data = relationship("SensorData", back_populates="device", cascade="all, delete-orphan")


class DeviceCredential(Base):
    __tablename__ = "device_credentials"

    id = Column(BigInteger, primary_key=True, index=True)
    device_id = Column(BigInteger, ForeignKey("devices.id", ondelete="CASCADE"), unique=True, nullable=False)
    mqtt_username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    enabled = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    device = relationship("Device", back_populates="credentials")


class RelayChannel(Base):
    __tablename__ = "relay_channels"

    id = Column(BigInteger, primary_key=True, index=True)
    device_id = Column(BigInteger, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    state = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("device_id", "channel", name="uq_relay_channel_device_channel"),
    )

    device = relationship("Device", back_populates="relay_channels")


class IRDevice(Base):
    __tablename__ = "ir_devices"

    id = Column(BigInteger, primary_key=True, index=True)
    device_id = Column(BigInteger, ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    target_type = Column(String(50), nullable=False)
    brand = Column(String(50), nullable=True)
    emitter_pin = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    device = relationship("Device", back_populates="ir_devices")
    commands = relationship("IRCommand", back_populates="ir_device", cascade="all, delete-orphan")


class IRCommand(Base):
    __tablename__ = "ir_commands"

    id = Column(BigInteger, primary_key=True, index=True)
    ir_device_id = Column(BigInteger, ForeignKey("ir_devices.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    protocol = Column(String(30), default="NEC")
    address = Column(BigInteger, nullable=True)
    command = Column(BigInteger, nullable=True)
    bits = Column(Integer, nullable=True)
    repeats = Column(Integer, nullable=False, default=1)
    frequency = Column(Integer, default=38000)
    raw_data = Column(ARRAY(Integer), nullable=True)
    extra_data = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("ir_device_id", "name", name="uq_ir_command_device_name"),
    )

    ir_device = relationship("IRDevice", back_populates="commands")
