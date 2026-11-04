import { create } from "zustand";
import { api, type Snapshot } from "@/app/session";

export type Tab = "pulse" | "watch" | "circle" | "vault" | "wishes";

type State = {
  snap: Snapshot | null;
  tab: Tab;
  busy: boolean;
  offline: boolean;
  setTab: (tab: Tab) => void;
  hydrate: () => Promise<void>;
  advance: () => Promise<void>;
  scan: () => Promise<void>;
  worked: () => Promise<void>;
  message: () => Promise<void>;
  answer: (answer: "well" | "unsure" | "passed") => Promise<void>;
  reset: () => Promise<void>;
};

function tabAfter(path: string, snap: Snapshot, current: Tab): Tab {
  if (path === "/api/scan") return "watch";
  if (path === "/api/message") return "circle";
  if (path === "/api/answer" && snap.confirmation === "passed") return "wishes";
  if (path === "/api/answer" && snap.confirmation === "well") return "pulse";
  if (path === "/api/reset") return "pulse";
  return current;
}

export const useApp = create<State>((set, get) => {
  const run = async (path: string, method: "GET" | "POST" = "POST", body?: unknown) => {
    set({ busy: true });
    try {
      const snap = await api(path, method, body);
      set({
        snap,
        busy: false,
        offline: false,
        tab: tabAfter(path, snap, get().tab),
      });
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } catch {
      set({ busy: false, offline: true });
    }
  };

  return {
    snap: null,
    tab: "pulse",
    busy: false,
    offline: false,
    setTab: (tab) => set({ tab }),
    hydrate: () => run("/api/state", "GET"),
    advance: () => run("/api/advance", "POST", { days: 1 }),
    scan: () => run("/api/scan"),
    worked: () => run("/api/worked-case"),
    message: () => run("/api/message"),
    answer: (answer) => run("/api/answer", "POST", { who: "Ana", answer }),
    reset: () => run("/api/reset"),
  };
});
