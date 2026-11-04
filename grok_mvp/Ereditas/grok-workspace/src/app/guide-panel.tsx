import { useState } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, RotateCcw } from "lucide-react";
import { backReplayPlan, guideStep, passedView, type GuideId, type ReplayAction } from "./guide.ts";
import { useApp } from "./store.ts";

export function GuidePanel() {
  const app = useApp();
  const [open, setOpen] = useState(false);
  const snap = app.snap;
  if (!snap) return null;
  const step = passedView(guideStep(snap), app.tab, snap);

  const runReplay = async (id: GuideId) => {
    const plan = backReplayPlan(id);
    for (const action of plan.actions) await runAction(action, app);
    app.setTab(plan.tab);
    setOpen(true);
  };

  const startOver = async () => {
    await app.reset();
    app.setTab("pulse");
    setOpen(false);
  };

  const continueDemo = async () => {
    if (step.id === "1") {
      app.setTab("pulse");
      await app.advance();
    } else if (step.id === "2") {
      await app.scan();
      app.setTab("watch");
    } else if (step.id === "3") {
      await app.worked();
      app.setTab("pulse");
    } else if (step.id === "4") {
      await app.message();
      app.setTab("circle");
    } else if (step.id === "6a") {
      app.setTab("vault");
    } else if (step.id === "7a") {
      app.setTab("wishes");
    }
  };

  const continueLabel =
    step.id === "1"
      ? `Continue: one quiet day (${snap.days + 1}/2)`
      : step.id === "2"
        ? "Continue: check the world"
        : step.id === "3"
          ? "Continue: run the worked case"
          : step.id === "4"
            ? "Continue: ask Ana"
            : step.id === "6a"
              ? "Continue: open the vault"
              : step.id === "7a"
                ? "Continue: read last wishes"
                : "Continue";

  const ended = ["8a", "6b", "6c"].includes(step.id);
  const choices = step.id === "5";

  return (
    <aside className={`guide-shell ${open ? "guide-open" : ""}`} aria-label="Guided demo">
      <button
        type="button"
        className="guide-mobile-summary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>Guided demo · Step {step.number}/8</span>
        <span className="guide-summary-action">
          {choices || ended ? "Open" : "Continue"}
          {open ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
        </span>
      </button>
      <div className="guide-card">
        <header className="guide-heading">
          <div>
            <p className="guide-kicker">Step {step.number} of 8 · {step.branch}</p>
            <h2>{step.title}</h2>
          </div>
          <button type="button" className="guide-close" onClick={() => setOpen(false)} aria-label="Collapse guide">
            <ChevronDown aria-hidden="true" />
          </button>
        </header>

        <section className="guide-section">
          <h3>What happens</h3>
          <p>{step.happens}</p>
        </section>
        <section className="guide-section">
          <h3>Where Meta comes in</h3>
          <div className="meta-chips">
            {step.meta.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>
        <section className="guide-outcome">
          <h3>Outcome</h3>
          <p>{step.outcome}</p>
        </section>

        {app.busy ? (
          <div className="guide-working" role="status">
            <LoaderCircle className="guide-spinner" aria-hidden="true" />
            <div>
              <strong>{app.voiceStage || "Working… Meta models are running"}</strong>
              {app.voiceStage && <p>Playing Ana's note → Muse Voice Transcribe → Muse Spark</p>}
            </div>
          </div>
        ) : choices ? (
          <div className="guide-choices">
            <button type="button" className="guide-primary" onClick={() => void app.voiceAnswer("ana-passed")}>Ana: Elena has died</button>
            <button type="button" className="guide-secondary" onClick={() => void app.voiceAnswer("ana-unsure")}>Ana isn't sure</button>
            <button type="button" className="guide-secondary" onClick={() => void app.answer("well")}>Ana: Elena is alive</button>
          </div>
        ) : ended ? (
          <button type="button" className="guide-primary" onClick={() => void runReplay(step.id)}>Try another answer</button>
        ) : (
          <button type="button" className="guide-primary" onClick={() => void continueDemo()}>{continueLabel}</button>
        )}

        <footer className="guide-footer">
          <button type="button" disabled={step.id === "1" || app.busy} onClick={() => void runReplay(step.id)}>Back</button>
          <button type="button" disabled={app.busy} onClick={() => void startOver()}>
            <RotateCcw aria-hidden="true" /> Start over
          </button>
        </footer>
      </div>
    </aside>
  );
}

type AppActions = ReturnType<typeof useApp.getState>;

async function runAction(action: ReplayAction, app: AppActions) {
  if (action === "reset") await app.reset();
  else if (action === "advance") await app.advance();
  else if (action === "scan") await app.scan();
  else if (action === "worked") await app.worked();
  else await app.message();
}
