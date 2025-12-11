from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy import (
    ForeignKey,
    TIMESTAMP,
    text,
    Text,
    String
)

from app.db.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    message_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True), primary_key=True, autoincrement=True
    )

    conversation_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("chat_conversations.conversation_id", ondelete="CASCADE"),
        nullable=False,
    )

    sender_user_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    content_text: Mapped[str] = mapped_column(Text, nullable=True)
    
    attachment_url: Mapped[str] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
    )

    # Relationships
    conversation = relationship("ChatConversation", backref="messages")
    sender = relationship("User", foreign_keys=[sender_user_id])

    def __repr__(self) -> str:
        return f"<ChatMessage id={self.message_id} conversation={self.conversation_id}>"
