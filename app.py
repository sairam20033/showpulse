import os, re, json, sqlite3, logging, secrets
from datetime import datetime, timezone
from urllib.parse import urlparse
import requests
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from apscheduler.schedulers.background import BackgroundScheduler
from pywebpush import webpush, WebPushException

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
DB = os.getenv("DATABASE_PATH", "showpulse.db")
CHECK_MINUTES = int(os.getenv("CHECK_MINUTES", "30"))
VAPID_PUBLIC = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_EMAIL = os.getenv("VAPID_CLAIMS_EMAIL", "mailto:admin@example.com")
RESEND_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM = os.getenv("RESEND_FROM_EMAIL", "")
app = FastAPI(title="ShowPulse API", version="1.0.0")

def db():
    c = sqlite3.connect(DB)
    c.row_factory = sqlite3.Row
    return c

def init_db():
    with db() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS movies(
          id INTEGER PRIMARY KEY AUTOINCREMENT, url TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL, event_code TEXT NOT NULL, city TEXT NOT NULL,
          last_state TEXT NOT NULL DEFAULT '{}', last_checked TEXT)""")
        c.execute("""CREATE TABLE IF NOT EXISTS subscriptions(
          id INTEGER PRIMARY KEY AUTOINCREMENT, endpoint TEXT UNIQUE NOT NULL,
          subscription TEXT NOT NULL)""")
        c.execute("""CREATE TABLE IF NOT EXISTS emails(
          email TEXT PRIMARY KEY, created_at TEXT NOT NULL)""")

def parse_url(url):
    p = urlparse(url)
    if p.scheme != "https" or p.netloc not in ("in.bookmyshow.com", "www.bookmyshow.com"):
        raise ValueError("Please use a valid BookMyShow India movie URL.")
    parts = p.path.strip("/").split("/")
    event = next((x for x in parts if re.fullmatch(r"ET\d{8,}", x)), None)
    if not event or "movies" not in parts:
        raise ValueError("Could not find a BookMyShow movie event code in that URL.")
    i = parts.index("movies")
    city = parts[i+1] if i+1 < len(parts) else "unknown"
    slug = parts[i+2] if i+2 < len(parts) else "Movie"
    name = re.sub(r"-+", " ", re.sub(r"-[A-Z]{2,}\d+$", "", slug)).title()
    return event, city, name

def fetch_movie(url, event, city):
    # BookMyShow's web endpoint is undocumented and can change or block automated requests.
    # Treat failures as unknown; never interpret a failed request as sold out.
    regions = {
      "hyderabad": ("HYD","17.385","78.487","tep"),
      "chennai": ("CHEN","13.056","80.206","tf3"),
      "mumbai": ("MUMBAI","19.076","72.878","te7"),
      "bengaluru": ("BANG","12.972","77.594","tdr"),
      "delhi-ncr": ("NCR","28.613","77.209","ttn"),
      "pune": ("PUNE","18.520","73.856","te2"),
      "kolkata": ("KOLK","22.573","88.364","tun"),
      "kochi": ("KOCH","9.932","76.267","t9z"),
    }
    code, lat, lon, geohash = regions.get(city, (city.upper()[:6],"0","0",""))
    api = "https://in.bookmyshow.com/api/movies-data/v4/showtimes-by-event/primary-dynamic"
    headers = {
      "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      "Accept":"application/json, text/plain, */*",
      "Referer":url, "x-app-code":"WEB", "x-region-code":code,
      "x-region-slug":city, "x-geohash":geohash, "x-latitude":lat,
      "x-longitude":lon, "x-location-selection":"manual"
    }
    r = requests.get(api, headers=headers, params={
      "eventCode":event, "dateCode":"", "isDesktop":"true",
      "regionCode":code, "xLocationShared":"false", "lat":lat, "lon":lon
    }, timeout=20)
    r.raise_for_status()
    data = r.json()
    root = data.get("data", {})
    dates, shows = [], []
    for w in root.get("topStickyWidgets", []):
        if w.get("type") == "horizontal-block-list":
            for item in w.get("data", []):
                texts = item.get("data", [])
                if len(texts) >= 3:
                    dates.append({"date":item.get("id",""),"style":item.get("styleId","")})
    for w in root.get("showtimeWidgets", []):
        if w.get("type") != "groupList": continue
        for group in w.get("data", []):
            if group.get("type") != "venueGroup": continue
            for card in group.get("data", []):
                if card.get("type") != "venue-card": continue
                add = card.get("additionalData", {})
                for st in card.get("showtimes", []):
                    extra = st.get("additionalData", {})
                    cats = []
                    for cat in extra.get("categories", []):
                        cats.append({
                          "category":cat.get("priceDesc",""),
                          "price":cat.get("curPrice",""),
                          "status":str(cat.get("availStatus",""))
                        })
                    shows.append({
                      "theatre":add.get("venueName","Unknown theatre"),
                      "time":st.get("title",""),
                      "date":str(extra.get("showDateCode", extra.get("dateCode",""))),
                      "categories":cats
                    })
    movie_name = name_from_data(data) or None
    return {"movie_name":movie_name,"dates":dates,"shows":shows,"checked_at":datetime.now(timezone.utc).isoformat()}

def name_from_data(data):
    try:
      for w in data.get("data",{}).get("bottomSheetData",{}).get("format-selector",{}).get("widgets",[]):
        if w.get("type") == "vertical-text-list":
          for item in w.get("data",[]):
            if item.get("styleId") == "bottomsheet-subtitle": return item.get("text")
    except Exception: pass
    return None

def state_summary(state):
    return json.dumps({"dates":state.get("dates",[]),"shows":state.get("shows",[])}, sort_keys=True)

def send_email(subject, body):
    if not RESEND_KEY or not RESEND_FROM: return False
    r = requests.post("https://api.resend.com/emails",
      headers={"Authorization":f"Bearer {RESEND_KEY}","Content-Type":"application/json"},
      json={"from":RESEND_FROM,"to":get_emails(),"subject":subject,"text":body}, timeout=20)
    r.raise_for_status()
    return True

def get_emails():
    with db() as c: return [r["email"] for r in c.execute("SELECT email FROM emails")]

def send_push(title, body, url):
    if not VAPID_PRIVATE or not VAPID_PUBLIC: return
    with db() as c: subs = c.execute("SELECT endpoint,subscription FROM subscriptions").fetchall()
    for row in subs:
        try:
            webpush(json.loads(row["subscription"]), json.dumps({"title":title,"body":body,"url":url}),
              vapid_private_key=VAPID_PRIVATE,
              vapid_claims={"sub":VAPID_EMAIL})
        except WebPushException as e:
            logging.warning("Push delivery failed: %s", e)
            if getattr(e, "response", None) and e.response.status_code == 410:
                with db() as c: c.execute("DELETE FROM subscriptions WHERE endpoint=?",(row["endpoint"],))

def monitor_all():
    with db() as c: movies = c.execute("SELECT * FROM movies").fetchall()
    for movie in movies:
        try:
            current = fetch_movie(movie["url"], movie["event_code"], movie["city"])
            old = json.loads(movie["last_state"] or "{}")
            # First successful poll establishes a baseline; subsequent polls alert on new show/date data.
            changes = []
            old_dates = {x.get("date") for x in old.get("dates",[])}
            for d in current["dates"]:
                if d.get("date") and d.get("date") not in old_dates and old_dates:
                    changes.append(f"New booking date: {d['date']}")
            old_shows = {json.dumps(x,sort_keys=True) for x in old.get("shows",[])}
            for show in current["shows"]:
                key = json.dumps(show,sort_keys=True)
                if key not in old_shows and old_shows:
                    changes.append(f"New show: {show['theatre']} — {show['time']}")
            # Availability status changes for matching theatre/time/category.
            old_by_key = {}
            for s in old.get("shows",[]):
                for cat in s.get("categories",[]):
                    old_by_key[(s.get("theatre"),s.get("time"),cat.get("category"))] = cat.get("status")
            for s in current["shows"]:
                for cat in s.get("categories",[]):
                    key=(s.get("theatre"),s.get("time"),cat.get("category"))
                    prev=old_by_key.get(key)
                    if prev == "0" and cat.get("status") != "0":
                        changes.append(f"Tickets available: {s['theatre']} — {s['time']} ({cat.get('category')} ₹{cat.get('price')})")
            with db() as c:
                c.execute("UPDATE movies SET name=?,last_state=?,last_checked=? WHERE id=?",
                  (current.get("movie_name") or movie["name"], state_summary(current), current["checked_at"], movie["id"]))
            if changes:
                body = movie["name"] + "\n" + "\n".join(dict.fromkeys(changes)) + "\n" + movie["url"]
                send_push("ShowPulse: " + movie["name"], "\n".join(dict.fromkeys(changes)), movie["url"])
                try: send_email("ShowPulse alert: " + movie["name"], body)
                except Exception: logging.exception("Email alert failed")
        except Exception:
            logging.exception("Monitoring failed for %s", movie["url"])

class MovieIn(BaseModel):
    url: str
class EmailIn(BaseModel):
    email: EmailStr
class SubscriptionIn(BaseModel):
    subscription: dict

@app.on_event("startup")
def startup():
    init_db()
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(monitor_all, "interval", minutes=CHECK_MINUTES, id="movie-monitor", max_instances=1)
    scheduler.start()
    app.state.scheduler = scheduler

@app.get("/api/config")
def config():
    return {"check_interval_minutes":CHECK_MINUTES,"push_enabled":bool(VAPID_PUBLIC),"email_enabled":bool(RESEND_KEY and RESEND_FROM)}

@app.get("/api/movies")
def movies():
    with db() as c: rows=c.execute("SELECT * FROM movies ORDER BY id DESC").fetchall()
    result=[]
    for r in rows:
        state=json.loads(r["last_state"] or "{}")
        result.append({"id":r["id"],"url":r["url"],"name":r["name"],"city":r["city"],
          "event_code":r["event_code"],"last_checked":r["last_checked"],
          "show_count":len(state.get("shows",[]))})
    return result

@app.post("/api/movies")
def add_movie(item: MovieIn):
    try: event,city,name=parse_url(item.url.strip())
    except ValueError as e: raise HTTPException(400,str(e))
    try:
        with db() as c: c.execute("INSERT INTO movies(url,name,event_code,city) VALUES(?,?,?,?)",(item.url.strip(),name,event,city))
    except sqlite3.IntegrityError: raise HTTPException(409,"This movie is already being tracked.")
    return {"ok":True,"name":name,"event_code":event}

@app.delete("/api/movies/{movie_id}")
def delete_movie(movie_id:int):
    with db() as c: c.execute("DELETE FROM movies WHERE id=?",(movie_id,))
    return {"ok":True}

@app.post("/api/check")
def check_now():
    monitor_all()
    return {"ok":True,"message":"Check completed. See server logs for any source/API errors."}

@app.post("/api/email")
def add_email(item: EmailIn):
    with db() as c: c.execute("INSERT OR IGNORE INTO emails(email,created_at) VALUES(?,?)",(item.email,datetime.now(timezone.utc).isoformat()))
    return {"ok":True}

@app.get("/api/vapid-public-key")
def vapid_key():
    return {"publicKey":VAPID_PUBLIC}

@app.post("/api/subscribe")
def subscribe(item: SubscriptionIn):
    endpoint=item.subscription.get("endpoint")
    if not endpoint: raise HTTPException(400,"Invalid push subscription")
    with db() as c: c.execute("INSERT OR REPLACE INTO subscriptions(endpoint,subscription) VALUES(?,?)",(endpoint,json.dumps(item.subscription)))
    return {"ok":True}

app.mount("/", StaticFiles(directory="static", html=True), name="static")
