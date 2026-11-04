import { useEffect, useState } from "react";
import {
  Activity,
  KeyRound,
  MessageCircle,
  Mic,
  Play,
  Radio,
  ScrollText,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { Seal } from "@/app/seal";
import {
  boxStyle,
  canAnswer,
  canMessage,
  canVoiceAnswer,
  grantBadge,
  toneFrom,
  voiceBadge,
  type Box,
  type Post,
  type VoiceAnswer,
} from "@/app/session";
import { useApp, type Tab } from "@/app/store";

const tabs: { id: Tab; label: string; icon: typeof Radio }[] = [
  { id: "pulse", label: "Pulse", icon: Radio },
  { id: "watch", label: "Watch", icon: Activity },
  { id: "circle", label: "Circle", icon: MessageCircle },
  { id: "vault", label: "Vault", icon: KeyRound },
  { id: "wishes", label: "Wishes", icon: ScrollText },
];

export function Companion() {
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const hydrate = useApp((s) => s.hydrate);
  const offline = useApp((s) => s.offline);
  const [film, setFilm] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
        <header className="flex items-center gap-3 px-5 pt-6 pb-2">
          <Seal className="size-11 text-gold" />
          <div className="min-w-0">
            <p className="font-display text-xl leading-none tracking-wide">Ereditas</p>
            <p className="mt-1 text-xs tracking-widest text-muted uppercase">Companion</p>
          </div>
          <button
            type="button"
            onClick={() => setFilm(true)}
            className="ml-auto flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm text-paper"
          >
            <Play className="size-4" strokeWidth={1.8} />
            Film
          </button>
        </header>
        <main className="flex-1 px-5 pt-3 pb-32">
          {offline && (
            <p className="mb-3 rounded-card border border-line bg-card px-4 py-3 text-sm text-gold">
              Companion engine is offline. Start it with ./scripts/run-companion.sh
            </p>
          )}
          {tab === "pulse" && <Pulse />}
          {tab === "watch" && <Watch />}
          {tab === "circle" && <Circle />}
          {tab === "vault" && <Vault />}
          {tab === "wishes" && <Wishes />}
        </main>
        <nav className="nav-bar fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper">
          <div className="mx-auto grid max-w-md grid-cols-5">
            {tabs.map((item) => {
              const Icon = item.icon;
              const on = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
                    on ? "text-gold" : "text-muted"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={1.6} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
      {film && (
        <div className="fixed inset-0 z-40 flex flex-col bg-scrim p-4">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between text-ink">
            <p className="font-display text-xl">Ereditas</p>
            <button
              type="button"
              onClick={() => setFilm(false)}
              className="grid size-11 place-items-center rounded-full border border-line"
              aria-label="Close film"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <video
              className="h-auto w-full max-w-3xl max-h-film rounded-card bg-scrim"
              src="/media/ereditas.mp4"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Pulse() {
  const snap = useApp((s) => s.snap);
  if (!snap) {
    return (
      <section className="rise space-y-4">
        <h1 className="font-display text-3xl leading-tight">Connecting the watch.</h1>
      </section>
    );
  }
  const tone = toneFrom(snap);
  const heading =
    snap.confirmation === "passed"
      ? "The circle has answered."
      : snap.confirmation === "well"
        ? "You are still here."
        : snap.band === "elevated"
          ? "The watch is elevated."
          : snap.band === "quiet"
            ? "A quiet stretch."
            : "The watch is quiet.";

  return (
    <section className="rise space-y-4">
      <div>
        <p className="text-sm text-muted">Good morning</p>
        <h1 className="font-display text-3xl leading-tight">{heading}</h1>
      </div>
      <Gauge pct={snap.ring} tone={tone} />
      <p className="text-center text-sm text-muted">
        {snap.index_note} Posterior {snap.posterior_label}. Tree {snap.tree_open ? "open" : "closed"}.
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Chip label="Device" value={snap.chips.device ? "4h" : `${snap.days}d`} />
        <Chip label="Meta" value={snap.chips.meta ? "Active" : "Silent"} />
        <Chip label="$1 fee" value={snap.chips.heartbeat ? "Paid" : "Missed"} />
      </div>
      <ol className="space-y-2 rounded-card border border-line bg-card p-3">
        <Step n="1" done={snap.days > 0} text="No device or Meta activity" />
        <Step n="2" done={snap.scanned} text="News, obituaries, Facebook & Instagram" />
        <Step n="3" done={snap.posts.length > 0} text="SAM 3.1 memorial classification" />
        <Step n="4" done={snap.messaged} text="WhatsApp tree to emergency contacts" />
        <Step n="5" done={snap.may_release} text="Release the last-wishes vault" />
      </ol>
      {snap.error && <p className="text-sm text-gold">{snap.error}</p>}
      <Actions />
    </section>
  );
}

function Gauge({ pct, tone }: { pct: number; tone: string }) {
  const r = 68;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative mx-auto grid size-40 place-items-center">
      <svg viewBox="0 0 180 180" className="absolute inset-0 size-full -rotate-90">
        <circle cx="90" cy="90" r={r} fill="none" className="stroke-track" strokeWidth="8" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          className="stroke-gold"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="text-center">
        <p className="font-display text-5xl leading-none tabular-nums">{pct}</p>
        <p className="mt-1 text-xs tracking-widest text-muted uppercase">{tone}</p>
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-3 py-2.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function Step({ n, done, text }: { n: string; done: boolean; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      <span
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs ${
          done ? "bg-gold text-paper" : "border border-line text-muted"
        }`}
      >
        {n}
      </span>
      <span className={done ? "text-ink" : "text-muted"}>{text}</span>
    </li>
  );
}

function Actions() {
  const s = useApp();
  const snap = s.snap;
  if (!snap) return null;
  const primary = "h-12 w-full rounded-full bg-ink text-paper disabled:opacity-40";
  const secondary = "h-12 w-full rounded-full border border-line disabled:opacity-40";
  if (s.busy) {
    return (
      <button type="button" disabled className={primary}>
        Working…
      </button>
    );
  }
  if (snap.confirmation === "passed") {
    return (
      <button type="button" onClick={() => s.setTab("wishes")} className={primary}>
        Open last wishes
      </button>
    );
  }
  if (snap.confirmation === "well") {
    return (
      <button type="button" onClick={() => void s.reset()} className={primary}>
        Reset the watch
      </button>
    );
  }
  if (snap.days < 2) {
    return (
      <button type="button" onClick={() => void s.advance()} className={primary}>
        Advance one quiet day
      </button>
    );
  }
  if (!snap.scanned) {
    return (
      <div className="grid gap-2">
        <button type="button" onClick={() => void s.scan()} className={primary}>
          Scan news and social
        </button>
        <button
          type="button"
          onClick={() => void s.advance()}
          disabled={snap.days >= 8}
          className={secondary}
        >
          Advance one quiet day
        </button>
      </div>
    );
  }
  if (!snap.tree_open) {
    return (
      <div className="grid gap-2">
        <button type="button" onClick={() => void s.worked()} className={primary}>
          Run the worked case
        </button>
        <button
          type="button"
          onClick={() => void s.advance()}
          disabled={snap.days >= 14}
          className={secondary}
        >
          Advance one quiet day
        </button>
      </div>
    );
  }
  if (canMessage(snap)) {
    return (
      <button type="button" onClick={() => void s.message()} className={primary}>
        Message the circle on WhatsApp
      </button>
    );
  }
  return (
    <button type="button" onClick={() => s.setTab("circle")} className={primary}>
      Open the circle
    </button>
  );
}

function Watch() {
  const snap = useApp((s) => s.snap);
  if (!snap) return null;
  const source = snap.posts[0]?.source === "sam-3.1" ? "SAM 3.1" : snap.posts.length ? "SAM mock" : "Waiting";
  return (
    <section className="rise space-y-4">
      <h1 className="font-display text-3xl">Signals</h1>
      <p className="text-sm leading-relaxed text-muted">
        The companion listens to the phone, Meta apps, and the one-dollar heartbeat. Social posts from
        family are read only after the watch rises.
      </p>
      <Signal
        icon={Smartphone}
        title="This phone"
        detail={snap.chips.device ? "Unlocked 4 hours ago" : `No unlock for ${snap.days} day${snap.days === 1 ? "" : "s"}`}
      />
      <Signal
        icon={Radio}
        title="Facebook, Instagram, WhatsApp"
        detail={snap.chips.meta ? "Recent session on Instagram" : "No Meta session in the window"}
      />
      <Signal
        icon={ShieldCheck}
        title="Heartbeat fee"
        detail={snap.chips.heartbeat ? "$1 cleared this week" : "Recurring $1 did not clear"}
      />
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl">From the circle</h2>
          <span className="text-xs tracking-widest text-muted uppercase">{source}</span>
        </div>
        {snap.posts.map((post) => (
          <MemorialPost key={post.author} post={post} />
        ))}
        {!snap.posts.length && (
          <p className="text-sm text-muted">Scan from Pulse to classify memorial objects in these posts.</p>
        )}
      </div>
    </section>
  );
}

function Signal({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Smartphone;
  title: string;
  detail: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-card border border-line bg-card p-4">
      <span className="grid size-11 place-items-center rounded-full bg-paper text-gold">
        <Icon className="size-5" strokeWidth={1.6} />
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
    </article>
  );
}

function MemorialPost({ post }: { post: Post }) {
  const shown = [...post.boxes].sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 2);
  const extra = post.boxes.length - shown.length;
  return (
    <article className="overflow-hidden rounded-card border border-line bg-card">
      <div className="relative">
        <img src={post.image} alt="" className="aspect-[4/5] w-full object-cover" />
        {shown.map((box: Box) => (
          <span
            key={`${box.label}-${box.x}-${box.y}`}
            className="absolute border border-gold bg-ink/20"
            style={boxStyle(box)}
          >
            <span className="absolute top-1 left-1 bg-ink px-1.5 py-0.5 text-xs tracking-wide text-paper uppercase">
              {box.label}
            </span>
          </span>
        ))}
        {extra > 0 && (
          <span className="absolute right-2 bottom-2 bg-ink px-1.5 py-0.5 text-xs text-gold">+{extra}</span>
        )}
      </div>
      <div className="px-4 py-3">
        <p className="text-sm">
          <span className="font-medium">{post.author}</span>
          <span className="text-muted">
            {" "}
            · {post.object} · {post.source}
          </span>
        </p>
        <p className="mt-1 text-sm text-muted">{post.caption}</p>
      </div>
    </article>
  );
}

function Circle() {
  const s = useApp();
  const snap = s.snap;
  if (!snap) return null;
  return (
    <section className="rise space-y-4">
      <h1 className="font-display text-3xl">Emergency circle</h1>
      <p className="text-sm leading-relaxed text-muted">
        WhatsApp first. Voice notes are transcribed. The tree stops at the first clear answer.
      </p>
      <article className="overflow-hidden rounded-card border border-line bg-card">
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <span className="grid size-10 place-items-center rounded-full bg-paper font-display text-gold">
            A
          </span>
          <div>
            <p className="font-medium">Ana Martínez</p>
            <p className="text-xs text-muted">WhatsApp · primary contact</p>
          </div>
        </header>
        <div className="space-y-3 bg-paper px-4 py-4">
          {!snap.tree_open && (
            <p className="text-sm text-gold">
              Tree closed. Posterior {snap.posterior_label} (bar 20%). Run the worked case to place the
              call.
            </p>
          )}
          {snap.tree_open && !snap.thread.length && (
            <p className="text-sm text-muted">The message stays unsent until you open the tree.</p>
          )}
          {snap.thread.map((line, i) =>
            snap.voice && line.side === "in" && line.from === snap.voice.who ? (
              <VoiceBubble key={`voice-${i}`} voice={snap.voice} />
            ) : (
              <Bubble key={`${line.from}-${i}`} side={line.side === "in" ? "in" : "out"}>
                {line.text}
              </Bubble>
            ),
          )}
        </div>
      </article>
      {canMessage(snap) && (
        <button
          type="button"
          onClick={() => void s.message()}
          disabled={s.busy}
          className="h-12 w-full rounded-full bg-ink text-paper disabled:opacity-40"
        >
          Send WhatsApp to Ana
        </button>
      )}
      {canAnswer(snap) && (
        <div className="grid gap-2">
          {canVoiceAnswer(snap) && (
            <div className="mb-2 grid gap-2 rounded-card border border-line bg-card p-3">
              <button
                type="button"
                onClick={() => void s.voiceAnswer("ana-passed")}
                disabled={s.busy}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-paper disabled:opacity-40"
              >
                <Mic className="size-4" strokeWidth={1.8} />
                Ana sent a voice note
              </button>
              <button
                type="button"
                onClick={() => void s.voiceAnswer("ana-unsure")}
                disabled={s.busy}
                className="h-11 rounded-full border border-line text-sm text-muted disabled:opacity-40"
              >
                Try the unsure voice note
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => void s.answer("well")}
            className="h-12 rounded-full border border-line"
          >
            Ana: she is well
          </button>
          <button
            type="button"
            onClick={() => void s.answer("unsure")}
            className="h-12 rounded-full border border-line"
          >
            Ana: not sure
          </button>
          <button
            type="button"
            onClick={() => void s.answer("passed")}
            className="h-12 rounded-full bg-ink text-paper"
          >
            Ana: she has passed
          </button>
        </div>
      )}
      {snap.confirmation === "passed" && (
        <p className="text-sm text-gold">
          {snap.narrative || "Confirmation recorded. The vault may release scoped access."}
        </p>
      )}
      {snap.error && <p className="text-sm text-gold">{snap.error}</p>}
      <ul className="space-y-2 text-sm text-muted">
        <li>1 · Ana Martínez — WhatsApp</li>
        <li>2 · Daniel Ruiz — WhatsApp, then voice</li>
        <li>3 · Family lawyer — voice only</li>
      </ul>
    </section>
  );
}

function VoiceBubble({ voice }: { voice: VoiceAnswer }) {
  return (
    <div className="max-w-xs rounded-2xl bg-card px-3 py-3 text-ink">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Mic className="size-4 text-gold" strokeWidth={1.8} />
        {voice.who} sent a voice note
      </p>
      <audio className="mt-2 h-11 w-full" controls preload="metadata" src={voice.clip_url}>
        Your browser does not support audio playback.
      </audio>
      <p className="mt-2 text-sm leading-relaxed">“{voice.transcript}”</p>
      <span className="mt-2 inline-flex rounded-full border border-line px-2 py-1 text-xs text-gold">
        {voiceBadge(voice)}
      </span>
    </div>
  );
}

function Bubble({ side, children }: { side: "in" | "out"; children: string }) {
  return (
    <p
      className={`max-w-xs rounded-2xl px-3 py-2 text-sm leading-relaxed ${
        side === "out" ? "ml-auto bg-ink text-paper" : "bg-card text-ink"
      }`}
    >
      {children}
    </p>
  );
}

function Vault() {
  const snap = useApp((s) => s.snap);
  if (!snap) return null;
  return (
    <section className="rise space-y-4">
      <h1 className="font-display text-3xl">Vault</h1>
      <p className="text-sm leading-relaxed text-muted">
        Google Password Manager stays the living source. Ereditas only classifies beneficiaries and releases
        scoped links after confirmation. WhatsApp never stores the keys.
      </p>
      <div className="rounded-card border border-line bg-card">
        {snap.grants.map((row, i) => {
          const badge = grantBadge(row, snap.may_release);
          const open = row.released;
          return (
            <div
              key={row.id}
              className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">{row.asset}</p>
                <p className="text-sm text-muted">
                  {row.heir} · {row.role}
                  {row.high_value ? " · high-value" : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  open ? "bg-ink text-paper" : "border border-line text-muted"
                }`}
              >
                {badge}
              </span>
            </div>
          );
        })}
      </div>
      {snap.packet ? (
        <article className="rounded-card border border-gold bg-card px-4 py-3 text-sm">
          <p className="text-xs tracking-widest text-gold uppercase">Scoped package</p>
          <p className="mt-2 leading-relaxed">{snap.packet.whatsapp_body}</p>
          <ul className="mt-3 space-y-2 text-muted">
            {snap.packet.items.map((item) => (
              <li key={item.grant_id}>
                {item.asset}
                <br />
                <code className="text-xs text-ink">{item.link}</code>
              </li>
            ))}
          </ul>
        </article>
      ) : (
        <p className="text-sm text-muted">Nothing leaves the vault while the watch is open.</p>
      )}
    </section>
  );
}

function Wishes() {
  const snap = useApp((s) => s.snap);
  const reset = useApp((s) => s.reset);
  if (!snap) return null;
  return (
    <section className="rise space-y-4">
      <h1 className="font-display text-3xl">Last wishes</h1>
      <p className="text-sm leading-relaxed text-muted">
        Written while you were here. They run only after the circle confirms.
      </p>
      <ul className="space-y-2">
        {snap.wishes.map((wish, i) => (
          <li key={wish.id} className="flex items-center gap-3 rounded-card border border-line bg-card px-4 py-3">
            <span
              className={`grid size-6 place-items-center rounded-full text-xs ${
                wish.done ? "bg-gold text-paper" : "border border-line text-muted"
              }`}
            >
              {wish.done ? "✓" : i + 1}
            </span>
            <span className={wish.done ? "text-ink" : "text-muted"}>{wish.label}</span>
          </li>
        ))}
      </ul>
      {snap.may_release ? (
        <button
          type="button"
          onClick={() => void reset()}
          className="h-12 w-full rounded-full border border-line"
        >
          Replay the demo
        </button>
      ) : (
        <p className="text-sm text-muted">Locked. Confirm through the circle to release this list.</p>
      )}
    </section>
  );
}
