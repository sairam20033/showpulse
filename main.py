from typing import Literal
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import Movie, SessionLocal
from .parse import parse_bms_url

app = FastAPI(title="ShowPulse API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


def get_db():
    with SessionLocal() as db:
        yield db


class MovieIn(BaseModel):
    url: str
    notify_mode: Literal["all", "opening", "soldout_to_available"] = "all"


class MoviePatch(BaseModel):
    is_active: bool | None = None
    notify_mode: Literal["all", "opening", "soldout_to_available"] | None = None


class MovieOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_code: str
    title: str
    language: str
    city: str
    movie_url: str
    poster_url: str | None
    status: str
    notify_mode: str
    is_active: bool
    last_checked: str | None = None


def out(m: Movie) -> MovieOut:
    o = MovieOut.model_validate(m)
    o.last_checked = m.last_checked.isoformat() if m.last_checked else None
    return o


def get_or_404(db: Session, movie_id: int) -> Movie:
    m = db.get(Movie, movie_id)
    if not m:
        raise HTTPException(404, "Movie not found")
    return m


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/movies", response_model=list[MovieOut])
def list_movies(db: Session = Depends(get_db)):
    return [out(m) for m in db.scalars(select(Movie).order_by(Movie.id))]


@app.post("/movies", response_model=MovieOut, status_code=201)
def add_movie(body: MovieIn, db: Session = Depends(get_db)):
    try:
        fields = parse_bms_url(body.url)
    except ValueError as e:
        raise HTTPException(422, str(e))
    if db.scalar(select(Movie).where(Movie.event_code == fields["event_code"])):
        raise HTTPException(409, "Already tracking this movie")
    m = Movie(**fields, notify_mode=body.notify_mode)
    db.add(m)
    db.commit()
    return out(m)


@app.patch("/movies/{movie_id}", response_model=MovieOut)
def update_movie(movie_id: int, body: MoviePatch, db: Session = Depends(get_db)):
    m = get_or_404(db, movie_id)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(m, k, v)
    db.commit()
    return out(m)


@app.delete("/movies/{movie_id}", status_code=204)
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    db.delete(get_or_404(db, movie_id))
    db.commit()
