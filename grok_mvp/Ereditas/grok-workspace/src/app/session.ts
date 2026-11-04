export type Confirmation = "silent" | "well" | "unsure" | "passed";

export type Box = {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Post = {
  author: string;
  role: string;
  caption: string;
  image: string;
  object: string;
  boxes: Box[];
  source: string;
};

export type Grant = {
  id: string;
  asset: string;
  heir: string;
  role: string;
  action: string;
  high_value: boolean;
  released: boolean;
};

export type Wish = { id: string; label: string; done: boolean };

export type ThreadLine = { from: string; side?: "in" | "out"; text: string };

export type Packet = {
  confirmer: string;
  whatsapp_body: string;
  items: { grant_id: string; asset: string; heir: string; action: string; link: string; ttl_minutes: number }[];
};

export type Snapshot = {
  demo: boolean;
  owner: string;
  error: string | null;
  days: number;
  chips: { device: boolean; meta: boolean; heartbeat: boolean };
  news: string;
  scanned: boolean;
  messaged: boolean;
  confirmation: Confirmation;
  next_contact: string;
  tree_open: boolean;
  may_release: boolean;
  posterior: number;
  posterior_label: string;
  watch_index: number;
  ring: number;
  band: string;
  posts: Post[];
  packet: Packet | null;
  narrative: string;
  wishes: Wish[];
  thread: ThreadLine[];
  grants: Grant[];
  meta: {
    configured: boolean;
    muse_model: string;
    sam_model: string;
    vocab: string[];
  };
  index_note: string;
};

const SECRET_NEEDLES = ["password", "seed phrase", "meta_api_key", "hf_token", "modal_token"];

export function boxStyle(box: Box) {
  return {
    left: `${box.x * 100}%`,
    top: `${box.y * 100}%`,
    width: `${box.w * 100}%`,
    height: `${box.h * 100}%`,
  };
}

export function toneFrom(snap: Snapshot) {
  if (snap.confirmation === "passed") return "Confirmed";
  if (snap.confirmation === "well") return "Present";
  if (snap.band === "elevated") return "Elevated";
  if (snap.band === "quiet") return "Quiet";
  return "Steady";
}

export function canMessage(snap: Snapshot) {
  return snap.tree_open && !snap.messaged && snap.confirmation === "silent";
}

export function canAnswer(snap: Snapshot) {
  return snap.tree_open && snap.messaged && snap.confirmation === "silent";
}

export function grantBadge(grant: Grant, mayRelease: boolean) {
  if (grant.released) {
    return grant.action.charAt(0).toUpperCase() + grant.action.slice(1);
  }
  if (mayRelease && grant.high_value) return "Hold";
  return "Sealed";
}

export function snapshotLooksSafe(snap: Snapshot) {
  const dump = JSON.stringify(snap).toLowerCase();
  return SECRET_NEEDLES.every((needle) => !dump.includes(needle));
}

export async function api<T = Snapshot>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`Companion engine returned ${response.status}`);
  }
  return (await response.json()) as T;
}
