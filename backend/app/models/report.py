from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import BIGINT
from sqlalchemy import (
    ForeignKey,
    TIMESTAMP,
    text,
    Text,
    String,
    Enum
)

from app.db.database import Base

class Report(Base):
    __tablename__ = "reports"

    report_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True), primary_key=True, autoincrement=True
    )

    user_reporter_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    user_reported_id: Mapped[int] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )

    conversation_id: Mapped[Optional[int]] = mapped_column(
        BIGINT(unsigned=True),
        ForeignKey("chat_conversations.conversation_id", ondelete="SET NULL"),
        nullable=True,
    )

    report_reason: Mapped[str] = mapped_column(Text, nullable=False)

    # Valid/Invalid status from AI
    report_status: Mapped[str] = mapped_column(
        Enum("valid", "invalid", "pending", name="report_status_enum"),
        nullable=False,
        default="pending"
    )

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, server_default=text("CURRENT_TIMESTAMP")
    )

    # Relationships
    reporter = relationship("User", foreign_keys=[user_reporter_id], backref="reports_made")
    reported = relationship("User", foreign_keys=[user_reported_id], backref="reports_received")
    conversation = relationship("ChatConversation", backref="reports")

    def __repr__(self) -> str:
        return f"<Report id={self.report_id} status={self.report_status}>"
