import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  boxStyle,
  canAnswer,
  canMessage,
  grantBadge,
  snapshotLooksSafe,
  toneFrom,
  type Snapshot,
} from "./session.ts";

function base(over: Partial<Snapshot> = {}): Snapshot {
  return {
    demo: true,
    owner: "Elena Reyes (demo persona)",
    error: null,
    days: 0,
    chips: { device: true, meta: true, heartbeat: true },
    news: "none",
    scanned: false,
    messaged: false,
    confirmation: "silent",
    next_contact: "Ana",
    tree_open: false,
    may_release: false,
    posterior: 0.0077,
    posterior_label: "0.01%",
    watch_index: 0.11,
    ring: 11,
    band: "steady",
    posts: [],
    packet: null,
    narrative: "",
    wishes: [],
    thread: [],
    grants: [],
    meta: { configured: false, muse_model: "muse-spark-1.3", sam_model: "sam-3.1", vocab: [] },
    index_note: "The ring is a watch index, not P(Z=1|x).",
    ...over,
  };
}

describe("boxStyle", () => {
  it("turns unit fractions into CSS percents", () => {
    const style = boxStyle({ label: "candle", x: 0.3, y: 0.12, w: 0.4, h: 0.7 });
    assert.equal(style.left, "30%");
    assert.equal(style.top, "12%");
    assert.equal(style.width, "40%");
    assert.equal(style.height, "70%");
  });
});

describe("toneFrom", () => {
  it("maps confirmation and band onto Pulse labels", () => {
    assert.equal(toneFrom(base({ confirmation: "passed", band: "elevated" })), "Confirmed");
    assert.equal(toneFrom(base({ confirmation: "well", band: "steady" })), "Present");
    assert.equal(toneFrom(base({ band: "elevated" })), "Elevated");
    assert.equal(toneFrom(base({ band: "quiet" })), "Quiet");
    assert.equal(toneFrom(base()), "Steady");
  });
});

describe("gates", () => {
  it("blocks WhatsApp and answers until the 20% bar opens the tree", () => {
    const closed = base({ scanned: true, days: 2, tree_open: false });
    assert.equal(canMessage(closed), false);
    assert.equal(canAnswer(closed), false);
    const open = base({ scanned: true, days: 10, tree_open: true, messaged: false });
    assert.equal(canMessage(open), true);
    assert.equal(canAnswer(open), false);
    const asked = { ...open, messaged: true };
    assert.equal(canAnswer(asked), true);
  });
});

describe("grantBadge", () => {
  it("keeps high-value grants held after a single primary pass", () => {
    const drive = {
      id: "drive",
      asset: "Google Drive",
      heir: "Ana",
      role: "primary",
      action: "share",
      high_value: false,
      released: true,
    };
    const wallet = {
      id: "wallet",
      asset: "Hardware wallet",
      heir: "Ana",
      role: "primary",
      action: "view",
      high_value: true,
      released: false,
    };
    assert.equal(grantBadge({ ...drive, released: false }, false), "Sealed");
    assert.equal(grantBadge(drive, true), "Share");
    assert.equal(grantBadge(wallet, false), "Sealed");
    assert.equal(grantBadge(wallet, true), "Hold");
  });
});

describe("snapshotLooksSafe", () => {
  it("rejects payloads that carry secrets", () => {
    assert.equal(snapshotLooksSafe(base()), true);
    assert.equal(
      snapshotLooksSafe(
        base({
          packet: {
            confirmer: "Ana",
            whatsapp_body: "here is the password hunter2",
            items: [],
          },
        }),
      ),
      false,
    );
  });
});
