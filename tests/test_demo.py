from ereditas.demo import DemoSession
from ereditas.settings import Settings


def _session() -> DemoSession:
    return DemoSession(Settings(_env_file=None, meta_api_key="", model_api_key=""))


def test_two_days_scan_does_not_open_tree():
    s = _session()
    s.advance(2)
    snap = s.scan()
    assert snap["days"] == 2
    assert snap["chips"]["device"] is False
    assert len(snap["posts"]) == 3
    assert snap["tree_open"] is False
    assert snap["may_release"] is False


def test_worked_case_opens_tree_and_passed_releases_scope():
    s = _session()
    snap = s.worked_case()
    assert snap["tree_open"] is True
    assert snap["news"] == "obituary"
    assert snap["posterior"] > 20
    released = s.answer("Ana", "passed")
    assert released["may_release"] is True
    assert released["packet"] is not None
    assert "password" not in released["packet"]["whatsapp_body"].lower()
    assert all("ereditas://grant/" in item["link"] for item in released["packet"]["items"])
    assert any(w["done"] for w in released["wishes"])
