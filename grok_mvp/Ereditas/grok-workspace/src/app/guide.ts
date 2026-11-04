import type { Snapshot } from "./session.ts";
import type { Tab } from "./store.ts";

export type GuideId = "1" | "2" | "3" | "4" | "5" | "6a" | "7a" | "8a" | "6b" | "6c";
export type ReplayAction = "reset" | "advance" | "scan" | "worked" | "message";

export type GuideStep = {
  id: GuideId;
  number: number;
  branch: string;
  title: string;
  happens: string;
  meta: string[];
  outcome: string;
};

export function guideStep(snap: Snapshot): GuideStep {
  if (snap.confirmation === "passed") return guideCopy("6a", snap);
  if (snap.confirmation === "unsure") return guideCopy("6b", snap);
  if (snap.confirmation === "well") return guideCopy("6c", snap);
  if (snap.messaged) return guideCopy("5", snap);
  if (snap.tree_open) return guideCopy("4", snap);
  if (snap.scanned) return guideCopy("3", snap);
  if (snap.days >= 2) return guideCopy("2", snap);
  return guideCopy("1", snap);
}

export function passedView(step: GuideStep, tab: Tab, snap: Snapshot): GuideStep {
  if (step.id !== "6a") return step;
  if (tab === "vault") return guideCopy("7a", snap);
  if (tab === "wishes") return guideCopy("8a", snap);
  return step;
}

export function guideCopy(id: GuideId, snap: Snapshot): GuideStep {
  const nextContact = snap.next_contact || "the next trusted contact";
  const narrative = snap.narrative.trim();
  const excerpt = narrative.length > 180 ? `${narrative.slice(0, 177)}…` : narrative;
  const copies: Record<GuideId, GuideStep> = {
    "1": {
      id,
      number: 1,
      branch: "Main path",
      title: "Elena's companion at rest",
      happens: "Her phone, Meta sessions, and $1 heartbeat are normal daily signs of life.",
      meta: ["Meta sessions · simulated"],
      outcome: "The vault is sealed.",
    },
    "2": {
      id,
      number: 2,
      branch: "Main path",
      title: "Two quiet days",
      happens: "The daily signals go dark.",
      meta: ["No Meta model in this step"],
      outcome: "Nothing unlocks. Silence alone never opens anything.",
    },
    "3": {
      id,
      number: 3,
      branch: "Main path",
      title: "Check the world",
      happens: "The companion checks memorial posts from Elena's registered circle on Facebook and Instagram.",
      meta: ["SAM 3.1", "sam-3.1 · live"],
      outcome: `Evidence is ${snap.posterior_label}, under the 20% bar. The tree stays closed and WhatsApp is refused.`,
    },
    "4": {
      id,
      number: 4,
      branch: "Main path",
      title: "The worked case",
      happens: "Ten silent days, a missed heartbeat, an obituary, and three memorial posts update the watch.",
      meta: ["SAM 3.1", "sam-3.1 · Bayesian evidence"],
      outcome: `Evidence is ${snap.posterior_label}. The tree opens. Ereditas may now ask, nothing more.`,
    },
    "5": {
      id,
      number: 5,
      branch: "Choose Ana's answer",
      title: "Ask Ana on WhatsApp",
      happens: "Ereditas sends one clear question to Elena's primary contact.",
      meta: ["WhatsApp · thread simulated"],
      outcome: "Nothing moves until a person answers.",
    },
    "6a": {
      id,
      number: 6,
      branch: "Ana confirms",
      title: "Ana confirms by voice note",
      happens: "Muse Voice Transcribe hears Ana's note. Muse Spark reads it as passed; doubt would become unsure.",
      meta: ["muse-voice-transcribe-1.0", "muse-spark-1.3"],
      outcome: "The human gate opens.",
    },
    "7a": {
      id,
      number: 7,
      branch: "Ana confirms",
      title: "Only what Elena chose",
      happens: "Drive and Facebook memorialization become 30-minute scoped links. No password is shared.",
      meta: ["Facebook memorialization · heir request"],
      outcome: "Wallet and bank stay held for a second person.",
    },
    "8a": {
      id,
      number: 8,
      branch: "Ana confirms",
      title: "Last wishes and Ana's letter",
      happens: excerpt || "Muse Spark writes Ana a plain-language letter from Elena's released wishes.",
      meta: ["Muse Spark 1.3", "muse-spark-1.3"],
      outcome: "The guided demo is complete.",
    },
    "6b": {
      id,
      number: 6,
      branch: "Ana is unsure",
      title: "Ana isn't sure",
      happens: "The voice note contains doubt, so the model chain returns unsure.",
      meta: ["muse-voice-transcribe-1.0", "muse-spark-1.3"],
      outcome: `Nothing is released. Ereditas escalates to ${nextContact}.`,
    },
    "6c": {
      id,
      number: 6,
      branch: "Elena is alive",
      title: "Elena is alive",
      happens: "Ana confirms Elena is well. The watch returns to normal listening.",
      meta: ["No Meta model in this step"],
      outcome: "The watch resets. Nothing is released.",
    },
  };
  return copies[id];
}

export function backReplayPlan(id: GuideId): { actions: ReplayAction[]; tab: Tab } {
  if (["6a", "7a", "8a", "6b", "6c"].includes(id)) {
    return {
      actions: ["reset", "advance", "advance", "scan", "worked", "message"],
      tab: "circle",
    };
  }
  if (id === "5") {
    return { actions: ["reset", "advance", "advance", "scan", "worked"], tab: "pulse" };
  }
  if (id === "4") {
    return { actions: ["reset", "advance", "advance", "scan"], tab: "watch" };
  }
  if (id === "3") return { actions: ["reset", "advance", "advance"], tab: "pulse" };
  if (id === "2") return { actions: ["reset", "advance"], tab: "pulse" };
  return { actions: ["reset"], tab: "pulse" };
}
