import re
from urllib.parse import urlparse

LANGS = {"telugu", "hindi", "tamil", "english", "malayalam", "kannada", "japanese", "korean"}
PATH = re.compile(r"^/movies/([a-z0-9-]+)/([a-z0-9-]+)/(ET\d{8})/?$", re.I)


def parse_bms_url(raw: str) -> dict:
    """Returns movie fields from a BookMyShow URL, or raises ValueError."""
    u = urlparse(raw.strip())
    if u.scheme != "https" or u.hostname != "in.bookmyshow.com":
        raise ValueError("URL must start with https://in.bookmyshow.com/movies/")
    m = PATH.match(u.path)
    if not m:
        raise ValueError("URL must look like /movies/<city>/<name>/ET00000000")
    city, slug, code = m.groups()
    parts = slug.split("-")
    is_lang = parts[-1].lower() in LANGS
    return {
        "event_code": code.upper(),
        "city": city.title(),
        "title": " ".join(p.title() for p in (parts[:-1] if is_lang else parts)),
        "language": parts[-1].title() if is_lang else "Unknown",
        "movie_url": f"https://in.bookmyshow.com{u.path}",
    }
