import json

from fastapi.testclient import TestClient

from ereditas.companion import app, sessions

SECRET_NEEDLES = ("password", "seed phrase", "meta_api_key", "hf_token", "modal_token")


def setup_function() -> None:
    sessions.clear()


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


def test_health_does_not_create_a_session_cookie():
    client = TestClient(app)

    response = client.get("/api/health")

    assert response.status_code == 200
    assert "set-cookie" not in response.headers


def test_first_api_request_sets_a_private_six_hour_cookie():
    client = TestClient(app)

    response = client.get("/api/state", headers={"X-Forwarded-Proto": "https"})

    cookie = response.headers["set-cookie"]
    assert "ereditas_sid=" in cookie
    assert "HttpOnly" in cookie
    assert "Max-Age=21600" in cookie
    assert "Path=/" in cookie
    assert "SameSite=lax" in cookie
    assert "Secure" in cookie


def test_malformed_and_unknown_session_cookies_are_replaced():
    malformed = TestClient(app)
    malformed.cookies.set(
        "ereditas_sid", "../../not-a-session", domain="testserver.local", path="/"
    )

    malformed_response = malformed.get("/api/state")
    malformed_sid = malformed.cookies.get("ereditas_sid")

    assert malformed_response.status_code == 200
    assert malformed_sid != "../../not-a-session"
    assert malformed_sid is not None
    assert len(malformed_sid) == 24

    unknown = TestClient(app)
    unknown.cookies.set(
        "ereditas_sid", "A" * 24, domain="testserver.local", path="/"
    )

    unknown_response = unknown.get("/api/state")

    assert unknown_response.status_code == 200
    assert unknown.cookies.get("ereditas_sid") != "A" * 24


def test_clients_have_isolated_sessions_and_reset_only_the_caller():
    client_a = TestClient(app)
    client_b = TestClient(app)

    client_a.post("/api/advance", json={"days": 2})
    client_a.post("/api/scan")
    opened = client_a.post("/api/worked-case").json()
    assert opened["tree_open"] is True
    passed = client_a.post(
        "/api/answer", json={"who": "Ana", "answer": "passed"}
    ).json()
    assert passed["may_release"] is True

    resting = client_b.get("/api/state").json()
    assert resting["days"] == 0
    assert resting["ring"] == 11
    assert resting["tree_open"] is False
    assert resting["packet"] is None

    client_b.post("/api/advance", json={"days": 1})
    reset_a = client_a.post("/api/reset").json()
    still_b = client_b.get("/api/state").json()

    assert reset_a["days"] == 0
    assert reset_a["ring"] == 11
    assert still_b["days"] == 1


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
