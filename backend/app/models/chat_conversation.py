from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy import (
    ForeignKey,
    TIMESTAMP,
    text,
)

from app.db.database import Base


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    conversation_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True), primary_key=True, autoincrement=True
    )

    agreement_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("agreements.agreement_id", ondelete="CASCADE"),
        nullable=False,
    )

    buyer_user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    seller_user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
    )

    # Relationships
    agreement = relationship("Agreement", backref="conversations")
    buyer = relationship("User", foreign_keys=[buyer_user_id], backref="buyer_conversations")
    seller = relationship("User", foreign_keys=[seller_user_id], backref="seller_conversations")
    
    # Cascade delete messages when conversation is deleted
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", passive_deletes=True)

    def __repr__(self) -> str:
        return f"<ChatConversation id={self.conversation_id} agreement={self.agreement_id}>"
