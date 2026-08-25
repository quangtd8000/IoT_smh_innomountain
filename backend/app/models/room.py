from sqlalchemy import Column, BigInteger, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id = Column(BigInteger, primary_key=True, index=True)
    home_id = Column(BigInteger, ForeignKey("homes.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)

    home = relationship("Home", back_populates="rooms")
    devices = relationship("Device", back_populates="room")
