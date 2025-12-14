from __future__ import annotations

from datetime import datetime

from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base

class AIChatMessage(Base):
    __tablename__ = "ai_chat_messages"

    message_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    role: Mapped[str] = mapped_column(
        String(20), # "user" or "model"
        nullable=False
    )
    
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    # Relationships
    # No strict need for relationship back-ref unless we access messages from user frequently in object style
    # But good for consistency
    user = relationship("User", backref="ai_messages")

    def __repr__(self) -> str:
        return f"<AIChatMessage id={self.message_id} user={self.user_id} role={self.role}>"
