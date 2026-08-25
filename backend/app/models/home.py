from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Home(Base):
    __tablename__ = "homes"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    owner_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="owned_homes")
    members = relationship("HomeMember", back_populates="home", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="home", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="home", cascade="all, delete-orphan")


class HomeMember(Base):
    __tablename__ = "home_members"

    home_id = Column(BigInteger, ForeignKey("homes.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    role = Column(String(20), nullable=False, default="member")
    joined_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        CheckConstraint("role IN ('owner', 'admin', 'member')", name="chk_home_member_role"),
    )

    home = relationship("Home", back_populates="members")
    user = relationship("User", back_populates="memberships")
