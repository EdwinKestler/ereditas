#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(import.meta.dirname, "out");
const WORK = resolve(OUT, ".work");
const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
const APP = "https://app.ereditas.com/";
const SITE = "https://ereditas.com/";
mkdirSync(WORK, { recursive: true });

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) throw new Error(`${command} exited ${result.status}`);
};
const probeDuration = (path) => Number(spawnSync("ffprobe", [
  "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path,
], { encoding: "utf8" }).stdout.trim());

const PORT = 9800 + Math.floor(Math.random() * 500);
const PROFILE = `/tmp/ereditas-video-chrome-${PORT}`;
const chrome = spawn("google-chrome", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--autoplay-policy=no-user-gesture-required", "--remote-allow-origins=*",
  "--window-size=1920,1080", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${PROFILE}`, "about:blank",
], { stdio: "ignore" });

let targets;
for (let attempt = 0; attempt < 80; attempt += 1) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
    if (targets.some((target) => target.type === "page")) break;
  } catch {}
  await sleep(150);
}
if (!targets) throw new Error("Chrome DevTools endpoint did not start");

const target = targets.find((item) => item.type === "page");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((done) => ws.addEventListener("open", done, { once: true }));

let nextId = 0;
const pending = new Map();
let activeRecorder = null;
const browserErrors = [];
const networkEvents = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve: done, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else done(message.result);
  }
  if (message.method === "Page.screencastFrame") {
    const { sessionId, data, metadata } = message.params;
    ws.send(JSON.stringify({
      id: ++nextId, method: "Page.screencastFrameAck", params: { sessionId },
    }));
    activeRecorder?.frame(data, metadata.timestamp);
  }
  if (message.method === "Runtime.exceptionThrown") {
    browserErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    browserErrors.push(message.params.args.map((arg) => arg.value ?? arg.description).join(" "));
  }
  if (message.method === "Network.responseReceived" && /\/api\//.test(message.params.response.url)) {
    networkEvents.push(`${message.params.response.status} ${message.params.response.url}`);
  }
  if (message.method === "Network.loadingFailed") {
    networkEvents.push(`FAILED ${message.params.errorText}`);
  }
});

const send = (method, params = {}) => new Promise((done, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve: done, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const response = await send("Runtime.evaluate", {
    expression, awaitPromise: true, returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result?.value;
};
const bodyHas = (text) => evaluate(`document.body?.innerText.includes(${JSON.stringify(text)})`);
const waitFor = async (test, timeoutMs, label) => {
  const began = Date.now();
  while (Date.now() - began < timeoutMs) {
    if (await test()) return (Date.now() - began) / 1000;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${label}`);
};
const waitReady = async (needle = "Ereditas", timeoutMs = 45000) => waitFor(
  () => evaluate(`document.readyState === "complete" && document.body?.innerText.includes(${JSON.stringify(needle)})`),
  timeoutMs, `${needle} page`,
);
const navigate = async (url, needle = "Ereditas") => {
  await send("Page.navigate", { url });
  await waitReady(needle);
  await sleep(1200);
};
const clickMatching = async (source) => {
  const result = await evaluate(`(() => {
    const pattern = new RegExp(${JSON.stringify(source)}, "i");
    const buttons = [...document.querySelectorAll("button")]
      .filter((button) => button.offsetParent !== null && !button.disabled && pattern.test(button.innerText.trim()));
    if (!buttons.length) return null;
    buttons[buttons.length - 1].click();
    return buttons[buttons.length - 1].innerText.trim();
  })()`);
  if (!result) throw new Error(`No enabled visible button matched ${source}`);
  return result;
};
const waitStep = (number, timeoutMs = 65000) => waitFor(
  () => evaluate(`new RegExp(${JSON.stringify(`step ${number} of 8`)}, "i").test(document.body?.innerText)`),
  timeoutMs,
  `guide step ${number}`,
);
const smoothTo = async (selector, durationMs = 2000) => evaluate(`new Promise((done) => {
  const element = document.querySelector(${JSON.stringify(selector)});
  if (!element) throw new Error("Missing scroll target: " + ${JSON.stringify(selector)});
  const from = window.scrollY;
  const rect = element.getBoundingClientRect();
  const centered = from + rect.top - Math.max(32, (innerHeight - Math.min(rect.height, innerHeight)) / 2);
  const to = Math.max(0, Math.min(centered, document.documentElement.scrollHeight - innerHeight));
  const began = performance.now();
  const ease = (value) => value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
  const tick = (now) => {
    const progress = Math.min(1, (now - began) / ${durationMs});
    window.scrollTo(0, from + (to - from) * ease(progress));
    if (progress < 1) requestAnimationFrame(tick); else done(true);
  };
  requestAnimationFrame(tick);
})`);

await send("Page.enable");
await send("Runtime.enable");
await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false,
});

class Recorder {
  constructor(name) {
    this.name = name;
    this.dir = resolve(WORK, `${name}-frames`);
    mkdirSync(this.dir, { recursive: true });
    this.frames = [];
  }
  async start() {
    this.startedAt = performance.now();
    activeRecorder = this;
    await send("Page.startScreencast", {
      format: "jpeg", quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1,
    });
    await waitFor(() => Promise.resolve(this.frames.length > 0), 10000, `${this.name} first frame`);
  }
  frame(data, timestamp) {
    const index = this.frames.length;
    const path = resolve(this.dir, `${String(index).padStart(6, "0")}.jpg`);
    writeFileSync(path, Buffer.from(data, "base64"));
    this.frames.push({ path, timestamp });
  }
  elapsed() { return (performance.now() - this.startedAt) / 1000; }
  async stop() {
    const elapsed = this.elapsed();
    await send("Page.stopScreencast");
    activeRecorder = null;
    if (!this.frames.length) throw new Error(`${this.name} captured no frames`);
    const firstTimestamp = this.frames[0].timestamp;
    const lastOffset = Math.max(0, this.frames.at(-1).timestamp - firstTimestamp);
    const realEnd = Math.max(elapsed, lastOffset + 1 / 30);
    const concatPath = resolve(WORK, `${this.name}-frames.txt`);
    const lines = [];
    for (let index = 0; index < this.frames.length; index += 1) {
      const current = this.frames[index];
      const next = this.frames[index + 1];
      const frameDuration = next
        ? Math.max(1 / 300, next.timestamp - current.timestamp)
        : Math.max(1 / 30, realEnd - lastOffset);
      lines.push(`file '${current.path.replaceAll("'", "'\\''")}'`);
      lines.push(`duration ${frameDuration.toFixed(6)}`);
    }
    lines.push(`file '${this.frames.at(-1).path.replaceAll("'", "'\\''")}'`);
    writeFileSync(concatPath, `${lines.join("\n")}\n`);
    return { concatPath, elapsed: realEnd, frameCount: this.frames.length };
  }
}

const textFilter = (text, start, end, slug) => {
  const textPath = resolve(WORK, `${slug}.txt`);
  writeFileSync(textPath, `${text}\n`);
  return `drawtext=fontfile=${FONT}:textfile=${textPath}:fontsize=32:fontcolor=white:`
    + `x=60:y=h-th-60:box=1:boxcolor=black@0.70:boxborderw=18:`
    + `enable='between(t\\,${start.toFixed(3)}\\,${end.toFixed(3)})'`;
};
const encodeScene = (number, recording, overlays = []) => {
  const output = resolve(OUT, `scene-s${number}.mp4`);
  const filters = ["fps=30", ...overlays.map((item, index) => textFilter(
    item.text, item.start, item.end, `s${number}-label-${index}`,
  ))];
  run("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", recording.concatPath,
    "-vf", filters.join(","), "-an", "-c:v", "libx264", "-preset", "veryfast",
    "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-movflags", "+faststart", output,
  ]);
  return output;
};

const encodeScene5 = (recording, clickAt, passedAt) => {
  const raw = resolve(WORK, "scene-s5-raw.mp4");
  run("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0", "-i", recording.concatPath,
    "-vf", "fps=30", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
    "-pix_fmt", "yuv420p", "-r", "30", raw,
  ]);
  const rawDuration = probeDuration(raw);
  const firstEnd = Math.min(rawDuration, clickAt + 3);
  const secondStart = Math.max(firstEnd, passedAt - 1);
  const editedPassedAt = firstEnd + (passedAt - secondStart);
  const editedDuration = firstEnd + (rawDuration - secondStart);
  const waitLabel = textFilter(
    "Muse Voice Transcribe → Muse Spark 1.3 · live · wait shortened",
    clickAt, editedPassedAt, "s5-wait",
  );
  const passedLabel = textFilter(
    "Muse Voice Transcribe + Muse Spark 1.3 · live",
    editedPassedAt, editedDuration, "s5-passed",
  );
  const videoFilter = [
    `[0:v]trim=start=0:end=${firstEnd.toFixed(6)},setpts=PTS-STARTPTS[v0]`,
    `[0:v]trim=start=${secondStart.toFixed(6)},setpts=PTS-STARTPTS[v1]`,
    `[v0][v1]concat=n=2:v=1:a=0,${waitLabel},${passedLabel},fps=30[v]`,
    `[1:a]adelay=${Math.round((clickAt + 0.3) * 1000)}:all=1,apad,atrim=duration=${editedDuration.toFixed(6)}[a]`,
  ].join(";");
  const output = resolve(OUT, "scene-s5.mp4");
  run("ffmpeg", [
    "-y", "-i", raw, "-i", resolve(ROOT, "apps/companion/static/voice/ana-passed.wav"),
    "-filter_complex", videoFilter, "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", output,
  ]);
  return output;
};

const captured = [];
try {
  console.log("S1: hero and founder story");
  await navigate(SITE, "Grief shouldn't");
  await evaluate("window.scrollTo(0, 0)");
  const s1 = new Recorder("s1");
  await s1.start();
  await sleep(4000);
  await smoothTo("#story", 2200);
  await sleep(8000);
  const r1 = await s1.stop();
  captured.push({ number: 1, recording: r1, output: encodeScene(1, r1) });

  console.log("S2: problem and principle");
  const s2 = new Recorder("s2");
  await s2.start();
  await smoothTo("#why", 1800);
  await sleep(6000);
  await smoothTo("#principle", 1800);
  await sleep(6000);
  const r2 = await s2.stop();
  captured.push({ number: 2, recording: r2, output: encodeScene(2, r2) });

  console.log("S3: fresh app through live SAM result");
  await navigate(APP, "Start fresh");
  // Establish the fresh per-visitor session before asking React to hydrate.
  // This also makes a cold Fly instance visible here instead of as a blank phone.
  const bootstrapReset = await evaluate(`fetch("/api/reset", { method: "POST" }).then(async (response) => ({
    ok: response.ok, status: response.status, body: (await response.text()).slice(0, 80),
  }))`);
  if (!bootstrapReset.ok) throw new Error(`Bootstrap reset failed: HTTP ${bootstrapReset.status}`);
  await send("Page.reload");
  await waitReady("Start fresh");
  try {
    await waitStep(1, 45000);
  } catch (error) {
    console.error("APP BODY:", await evaluate("document.body.innerText.slice(0, 1200)"));
    console.error("BROWSER ERRORS:", browserErrors.slice(-20));
    console.error("NETWORK:", networkEvents.slice(-30));
    throw error;
  }
  await clickMatching("^Start (fresh|over)$");
  await waitStep(1);
  await sleep(1200);
  const s3 = new Recorder("s3");
  await s3.start();
  await sleep(4000);
  await clickMatching("^Continue");
  await sleep(2000);
  await clickMatching("^Continue");
  await waitStep(2);
  await sleep(2000);
  await clickMatching("^Continue");
  await waitStep(3);
  const samAt = s3.elapsed();
  await sleep(8000);
  const r3 = await s3.stop();
  captured.push({
    number: 3, recording: r3,
    output: encodeScene(3, r3, [{
      text: "SAM 3.1 · live on Meta Model API · memorial objects in circle posts",
      start: samAt, end: r3.elapsed,
    }]),
  });

  console.log("S4: worked case and Ana choices");
  const s4 = new Recorder("s4");
  await s4.start();
  await clickMatching("^Continue");
  await waitStep(4);
  await sleep(5000);
  await clickMatching("^Continue");
  await waitStep(5);
  const choicesAt = s4.elapsed();
  await sleep(5000);
  const r4 = await s4.stop();
  captured.push({
    number: 4, recording: r4,
    output: encodeScene(4, r4, [{
      text: "WhatsApp thread simulated in the demo",
      start: choicesAt, end: r4.elapsed,
    }]),
  });

  console.log("S5: live voice answer, shortened wait, PASSED");
  const s5 = new Recorder("s5");
  await s5.start();
  const clickAt = s5.elapsed();
  await clickMatching("Elena has died");
  await waitFor(() => bodyHas("PASSED"), 90000, "PASSED voice interpretation");
  const passedAt = s5.elapsed();
  await sleep(6000);
  const r5 = await s5.stop();
  captured.push({
    number: 5, recording: r5, output: encodeScene5(r5, clickAt, passedAt),
    liveWaitSeconds: passedAt - clickAt,
  });

  console.log("S6: vault, wishes, system map, closing");
  const s6 = new Recorder("s6");
  await s6.start();
  await clickMatching("^Continue");
  await waitStep(7);
  const vaultAt = s6.elapsed();
  await sleep(6000);
  const vaultEnd = s6.elapsed();
  await clickMatching("^Continue");
  await waitStep(8);
  const letterAt = s6.elapsed();
  await sleep(7000);
  const letterEnd = s6.elapsed();
  await navigate(`${SITE}#meta`, "Meta's models");
  await smoothTo(".smap", 1800);
  await sleep(8000);
  await smoothTo(".closing", 2300);
  await sleep(4000);
  const r6 = await s6.stop();
  captured.push({
    number: 6, recording: r6,
    output: encodeScene(6, r6, [
      { text: "Scoped release · 30-minute links · no passwords", start: vaultAt, end: vaultEnd },
      { text: "Heir letter · Muse Spark 1.3 · live", start: letterAt, end: letterEnd },
    ]),
  });

  console.log("Resetting the live demo with the same cookie jar");
  await navigate(APP, "Start fresh");
  const reset = await evaluate(`fetch("/api/reset", { method: "POST" }).then(async (response) => ({
    ok: response.ok, status: response.status, body: (await response.text()).slice(0, 120),
  }))`);
  if (!reset.ok) throw new Error(`Final reset failed: HTTP ${reset.status}`);

  const scenes = captured.map((item) => ({
    scene: `s${item.number}`,
    file: `video/out/scene-s${item.number}.mp4`,
    duration: Number(probeDuration(item.output).toFixed(3)),
    captured_frames: item.recording.frameCount,
    ...(item.liveWaitSeconds ? { live_meta_wait: Number(item.liveWaitSeconds.toFixed(3)) } : {}),
  }));
  writeFileSync(resolve(OUT, "scenes.json"), `${JSON.stringify({
    generated_at: new Date().toISOString(), viewport: "1920x1080", fps: 30,
    reset_status: reset.status, scenes,
  }, null, 2)}\n`);

  const stills = [];
  for (const item of scenes) {
    const source = resolve(ROOT, item.file);
    const still = resolve(WORK, `${item.scene}-contact.png`);
    run("ffmpeg", [
      "-y", "-ss", Math.max(0, item.duration / 2).toFixed(3), "-i", source,
      "-frames:v", "1", "-vf", "scale=640:360", still,
    ]);
    stills.push(still);
  }
  run("ffmpeg", [
    "-y", ...stills.flatMap((still) => ["-i", still]),
    "-filter_complex",
    "[0:v][1:v][2:v][3:v][4:v][5:v]xstack=inputs=6:layout=0_0|640_0|1280_0|0_360|640_360|1280_360[v]",
    "-map", "[v]", "-frames:v", "1", resolve(OUT, "contact-sheet.png"),
  ]);
  console.log(JSON.stringify({ reset, scenes, browserErrors: browserErrors.slice(0, 10) }, null, 2));
} finally {
  try { ws.close(); } catch {}
  chrome.kill();
}

