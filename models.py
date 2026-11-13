import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./showpulse.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class Movie(Base):
    __tablename__ = "movies"
    id: Mapped[int] = mapped_column(primary_key=True)
    event_code: Mapped[str] = mapped_column(String(20), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    language: Mapped[str] = mapped_column(String(40))
    city: Mapped[str] = mapped_column(String(60))
    movie_url: Mapped[str] = mapped_column(String(500))
    poster_url: Mapped[str | None] = mapped_column(String(500), default=None)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    notify_mode: Mapped[str] = mapped_column(String(30), default="all")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_checked: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    showtimes: Mapped[list["Showtime"]] = relationship(back_populates="movie", cascade="all, delete-orphan")


class Showtime(Base):
    __tablename__ = "showtimes"
    id: Mapped[int] = mapped_column(primary_key=True)
    movie_id: Mapped[int] = mapped_column(ForeignKey("movies.id"))
    theatre: Mapped[str] = mapped_column(String(200))
    show_date: Mapped[str] = mapped_column(String(10))
    show_time: Mapped[str] = mapped_column(String(10))
    category: Mapped[str] = mapped_column(String(60))
    price: Mapped[int | None] = mapped_column(default=None)
    availability_status: Mapped[str] = mapped_column(String(20))
    last_checked: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    movie: Mapped[Movie] = relationship(back_populates="showtimes")


Base.metadata.create_all(engine)
