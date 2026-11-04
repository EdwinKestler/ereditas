import json

from fastapi.testclient import TestClient

from ereditas.companion import app, session

SECRET_NEEDLES = ("password", "seed phrase", "meta_api_key", "hf_token", "modal_token")


def setup_function() -> None:
    session.reset()


def test_health_and_home():
    client = TestClient(app)
    health = client.get("/api/health")
    assert health.status_code == 200
    body = health.json()
    assert "meta_configured" in body
    assert isinstance(body["meta_configured"], bool)
    assert "api_key" not in body
    assert "meta_api_key" not in body
    home = client.get("/")
    assert home.status_code == 200
    assert b"Ereditas" in home.content


def test_cors_allows_grok_origin():
    client = TestClient(app)
    response = client.get("/api/health", headers={"Origin": "http://127.0.0.1:8080"})
    assert response.headers.get("access-control-allow-origin") == "http://127.0.0.1:8080"


def test_two_day_scan_keeps_tree_closed():
    client = TestClient(app)
    client.post("/api/advance", json={"days": 2})
    snap = client.post("/api/scan").json()
    assert snap["days"] == 2
    assert snap["tree_open"] is False
    assert snap["may_release"] is False
    assert snap["posterior"] < 20
    assert len(snap["posts"]) == 3
    assert all(post["boxes"] for post in snap["posts"])
    assert snap["messaged"] is False


def test_message_and_passed_refused_while_tree_closed():
    client = TestClient(app)
    client.post("/api/advance", json={"days": 2})
    client.post("/api/scan")
    blocked = client.post("/api/message").json()
    assert blocked["tree_open"] is False
    assert blocked["messaged"] is False
    assert blocked["error"]
    refused = client.post("/api/answer", json={"who": "Ana", "answer": "passed"}).json()
    assert refused["may_release"] is False
    assert refused["packet"] is None
    assert refused["error"]


def test_worked_case_then_passed():
    client = TestClient(app)
    opened = client.post("/api/worked-case").json()
    assert opened["tree_open"] is True
    assert opened["posterior"] > 20
    ping = client.post("/api/message").json()
    assert ping["messaged"] is True
    assert ping["thread"]
    assert all("password" not in row["text"].lower() for row in ping["thread"])
    done = client.post("/api/answer", json={"who": "Ana", "answer": "passed"}).json()
    assert done["may_release"] is True
    ids = {item["grant_id"] for item in done["packet"]["items"]}
    assert ids == {"drive", "facebook"}
    held = {g["id"] for g in done["grants"] if g["high_value"]}
    assert held == {"wallet", "bank"}
    assert all(not g["released"] for g in done["grants"] if g["high_value"])
    assert all(g["released"] for g in done["grants"] if g["id"] in ids)
    dump = json.dumps(done).lower()
    for needle in SECRET_NEEDLES:
        assert needle not in dump
    assert "ereditas://grant/" in dump
    assert done["owner"] == "Elena Reyes (demo persona)"


def test_voice_answer_closed_tree_and_unknown_clip_are_refused():
    client = TestClient(app)

    closed = client.post(
        "/api/voice-answer", json={"who": "Ana", "clip": "ana-passed"}
    )
    traversal = client.post(
        "/api/voice-answer", json={"who": "Ana", "clip": "../../ana-passed"}
    )
    unknown = client.post(
        "/api/voice-answer", json={"who": "Ana", "clip": "ana-other"}
    )

    assert closed.status_code == 200
    assert closed.json()["packet"] is None
    assert closed.json()["error"]
    assert traversal.status_code == 422
    assert unknown.status_code == 422


def test_voice_answer_snapshot_is_safe_and_releases_only_ordinary_scopes():
    client = TestClient(app)
    client.post("/api/worked-case")
    client.post("/api/message")

    response = client.post(
        "/api/voice-answer", json={"who": "Ana", "clip": "ana-passed"}
    )

    assert response.status_code == 200
    snap = response.json()
    assert snap["voice"]["who"] == "Ana"
    assert snap["voice"]["interpreted"] == "passed"
    assert {item["grant_id"] for item in snap["packet"]["items"]} == {
        "drive",
        "facebook",
    }
    dump = json.dumps(snap).lower()
    for needle in SECRET_NEEDLES:
        assert needle not in dump
