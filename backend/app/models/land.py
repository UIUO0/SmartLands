from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import (
    String, Text, Enum, DECIMAL, TIMESTAMP, text, BigInteger, CHAR, ForeignKey
)
from app.db.database import Base

class Land(Base):
    __tablename__ = "lands"

    land_id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)

    # may be NULL قبل البيع
    owner_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("users.user_id", onupdate="CASCADE", ondelete="SET NULL"),
        nullable=True
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # لو سكيمتك فيها اسم عمود مختلف عدّله هنا
    price_amount: Mapped[float] = mapped_column(DECIMAL(12, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(CHAR(3), nullable=False, default="SAR")

    status: Mapped[str] = mapped_column(
        Enum("available", "reserved", "sold", "archived", name="land_status_enum"),
        nullable=False,
        default="available",
    )

    area_sq_m: Mapped[float | None] = mapped_column(DECIMAL(12, 2), nullable=True)

    address_line: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    country: Mapped[str | None] = mapped_column(CHAR(2), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)

    latitude: Mapped[float | None] = mapped_column(DECIMAL(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(DECIMAL(9, 6), nullable=True)
    google_place_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # لو عندك FK فعلي في DB إلى land_images(image_id) ما يحتاج relationship الآن
    cover_image_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[str] = mapped_column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP"),
        server_onupdate=text("CURRENT_TIMESTAMP"),
    )
