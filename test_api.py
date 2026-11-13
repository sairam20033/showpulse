import os, tempfile
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
from fastapi.testclient import TestClient
from app.main import app

c = TestClient(app)
URL = "https://in.bookmyshow.com/movies/hyderabad/ene-repeat-telugu/ET00506990"


def test_add_list_patch_delete():
    r = c.post("/movies", json={"url": URL})
    assert r.status_code == 201
    m = r.json()
    assert (m["title"], m["language"], m["city"], m["status"]) == ("Ene Repeat", "Telugu", "Hyderabad", "PENDING")
    assert c.post("/movies", json={"url": URL}).status_code == 409
    assert len(c.get("/movies").json()) == 1
    assert c.patch(f"/movies/{m['id']}", json={"is_active": False}).json()["is_active"] is False
    assert c.delete(f"/movies/{m['id']}").status_code == 204
    assert c.get("/movies").json() == []


def test_rejects_bad_urls():
    for bad in ["nope", "https://evil.com/movies/a/b/ET00000001", "https://in.bookmyshow.com/movies/x"]:
        assert c.post("/movies", json={"url": bad}).status_code == 422


def test_404():
    assert c.delete("/movies/999").status_code == 404
