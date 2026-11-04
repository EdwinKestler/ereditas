"""Algorithm 2: scoped release, never a password dump."""

import pytest

from ereditas.vault import (
    Action,
    Grant,
    Role,
    Vault,
    VaultError,
)


def _seeded_vault() -> Vault:
    vault = Vault()
    vault.add_grant(
        Grant(
            id="drive",
            asset="Google Drive — family photos",
            heir="Ana",
            role=Role.PRIMARY_HEIR,
            action=Action.SHARE,
            high_value=False,
        )
    )
    vault.add_grant(
        Grant(
            id="facebook",
            asset="Facebook account",
            heir="Ana",
            role=Role.PRIMARY_HEIR,
            action=Action.MEMORIALIZE,
            high_value=False,
        )
    )
    vault.add_grant(
        Grant(
            id="wallet",
            asset="Hardware wallet (view-only)",
            heir="Ana",
            role=Role.PRIMARY_HEIR,
            action=Action.VIEW,
            high_value=True,
        )
    )
    vault.add_grant(
        Grant(
            id="bank",
            asset="Bank login",
            heir="Counsel",
            role=Role.EXECUTOR,
            action=Action.HOLD,
            high_value=True,
        )
    )
    return vault


def test_release_refused_until_passed():
    vault = _seeded_vault()
    with pytest.raises(VaultError, match="gate"):
        vault.release(confirmer="Ana", confirmer_role=Role.PRIMARY_HEIR, passed=False)


def test_primary_passed_releases_ordinary_scopes_only():
    vault = _seeded_vault()
    packet = vault.release(
        confirmer="Ana", confirmer_role=Role.PRIMARY_HEIR, passed=True
    )
    ids = {item.grant_id for item in packet.items}
    assert ids == {"drive", "facebook"}
    assert all(item.secret is None for item in packet.items)
    assert all(item.link.startswith("ereditas://grant/") for item in packet.items)
    assert packet.whatsapp_body.find("password") == -1
    assert "seed" not in packet.whatsapp_body.lower()


def test_high_value_waits_for_second_confirmer():
    vault = _seeded_vault()
    vault.release(confirmer="Ana", confirmer_role=Role.PRIMARY_HEIR, passed=True)
    packet = vault.release(
        confirmer="Counsel",
        confirmer_role=Role.EXECUTOR,
        passed=True,
        second_confirmer=True,
    )
    ids = {item.grant_id for item in packet.items}
    assert "wallet" in ids
    assert "bank" in ids


def test_audit_log_records_each_release():
    vault = _seeded_vault()
    vault.release(confirmer="Ana", confirmer_role=Role.PRIMARY_HEIR, passed=True)
    assert len(vault.audit) == 1
    row = vault.audit[0]
    assert row["confirmer"] == "Ana"
    assert "drive" in row["grant_ids"]
    assert "secret" not in row
