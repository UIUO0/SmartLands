from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import BigInteger, ForeignKey, String, Integer, TIMESTAMP, text, Boolean
from app.db.database import Base

class LandImage(Base):
    __tablename__ = "land_images"

    image_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    land_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("lands.land_id", onupdate="CASCADE", ondelete="CASCADE"), nullable=False)

    # نخزن رابط الصورة (أو مسار التخزين لاحقًا)
    file_url: Mapped[str] = mapped_column(String(1024), nullable=False)

    storage_key: Mapped[str | None] = mapped_column(String(255), nullable=True)  # اختياري
    is_cover: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
