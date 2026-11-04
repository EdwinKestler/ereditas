import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  boxStyle,
  canAnswer,
  canMessage,
  canVoiceAnswer,
  grantBadge,
  snapshotLooksSafe,
  toneFrom,
  voiceBadge,
  type Snapshot,
} from "./session.ts";

describe("api", () => {
  it("sends the visitor cookie on same-origin companion requests", async () => {
    const originalFetch = globalThis.fetch;
    let credentials: RequestCredentials | undefined;
    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      credentials = init?.credentials;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await api<{ ok: boolean }>("/api/health");
    } finally {
      globalThis.fetch = originalFetch;
    }

    assert.equal(credentials, "same-origin");
  });
});

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
    voice: null,
    grants: [],
    meta: {
      configured: false,
      muse_model: "muse-spark-1.3",
      muse_voice_model: "muse-voice-transcribe-1.0",
      sam_model: "sam-3.1",
      vocab: [],
    },
    index_note: "The ring measures silence, not death.",
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
    assert.equal(canVoiceAnswer(asked), true);
  });
});

describe("voiceBadge", () => {
  it("maps the model chain and interpretation for the Circle badge", () => {
    const voice = {
      who: "Ana",
      clip_url: "/static/voice/ana-passed.wav",
      transcript: "Elena falleció anoche.",
      interpreted: "passed" as const,
      quote: "Elena falleció anoche.",
      models: {
        transcribe: "muse-voice-transcribe-1.0",
        interpret: "muse-spark-1.3",
      },
      sources: { transcribe: "mock", interpret: "mock" },
    };

    assert.equal(voiceBadge(voice), "Muse Voice Transcribe → Muse Spark: PASSED");
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
