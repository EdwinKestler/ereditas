import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { backReplayPlan, guideStep } from "./guide.ts";
import type { Snapshot } from "./session.ts";

function snap(over: Partial<Snapshot> = {}): Snapshot {
  return {
    demo: true,
    owner: "Elena Reyes",
    error: null,
    days: 0,
    chips: { device: true, meta: true, heartbeat: true },
    news: "none",
    scanned: false,
    messaged: false,
    confirmation: "silent",
    next_contact: "Daniel Ruiz",
    tree_open: false,
    may_release: false,
    posterior: 0.0001,
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

describe("guideStep", () => {
  it("maps rest, one quiet day, and a fresh start to step 1", () => {
    assert.equal(guideStep(snap()).id, "1");
    assert.equal(guideStep(snap({ days: 1 })).id, "1");
    assert.equal(guideStep(snap({ days: 0, scanned: false, tree_open: false })).id, "1");
  });

  it("maps the server-backed demo path without local counters", () => {
    assert.equal(guideStep(snap({ days: 2 })).id, "2");
    assert.equal(guideStep(snap({ days: 2, scanned: true, posterior_label: "6.95%" })).id, "3");
    assert.equal(guideStep(snap({ days: 10, scanned: true, tree_open: true })).id, "4");
    assert.equal(
      guideStep(snap({ days: 10, scanned: true, tree_open: true, messaged: true })).id,
      "5",
    );
  });

  it("maps every human-answer branch from the snapshot", () => {
    assert.equal(
      guideStep(
        snap({ days: 10, scanned: true, tree_open: true, messaged: true, confirmation: "passed" }),
      ).id,
      "6a",
    );
    assert.equal(
      guideStep(
        snap({ days: 10, scanned: true, tree_open: true, messaged: true, confirmation: "unsure" }),
      ).id,
      "6b",
    );
    assert.equal(
      guideStep(
        snap({ days: 0, scanned: false, tree_open: false, messaged: false, confirmation: "well" }),
      ).id,
      "6c",
    );
  });
});

describe("backReplayPlan", () => {
  it("rebuilds each prior snapshot state from reset", () => {
    assert.deepEqual(backReplayPlan("2"), { actions: ["reset", "advance"], tab: "pulse" });
    assert.deepEqual(backReplayPlan("3"), {
      actions: ["reset", "advance", "advance"],
      tab: "pulse",
    });
    assert.deepEqual(backReplayPlan("4"), {
      actions: ["reset", "advance", "advance", "scan"],
      tab: "watch",
    });
    assert.deepEqual(backReplayPlan("5"), {
      actions: ["reset", "advance", "advance", "scan", "worked"],
      tab: "pulse",
    });
  });

  it("returns every answered or release view to step 5 without replaying voice", () => {
    for (const id of ["6a", "7a", "8a", "6b", "6c"] as const) {
      const plan = backReplayPlan(id);
      assert.deepEqual(plan, {
        actions: ["reset", "advance", "advance", "scan", "worked", "message"],
        tab: "circle",
      });
      assert.equal(plan.actions.includes("voice" as never), false);
    }
  });
});
