#!/usr/bin/env node

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
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
  console.log("S2 (re-record): problem, why now, principle");
  await navigate(SITE, "Grief shouldn't");
  await evaluate(`(() => { const e = document.querySelector("#story"); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 80); return true; })()`);
  await sleep(1500);
  const s2 = new Recorder("s2");
  await s2.start();
  await smoothTo("#why", 1800);
  await sleep(5000);
  await smoothTo("#why-now", 2200);
  await sleep(4500);
  await smoothTo(".econ-grid", 1800);
  await sleep(5500);
  await smoothTo(".econ-shift", 1800);
  await sleep(4500);
  await smoothTo("#principle", 1800);
  await sleep(4500);
  const r2 = await s2.stop();
  const output = encodeScene(2, r2);
  const duration = Number(probeDuration(output).toFixed(3));
  const scenesPath = resolve(OUT, "scenes.json");
  const meta = JSON.parse(readFileSync(scenesPath, "utf8"));
  meta.scenes = meta.scenes.map((s) => s.scene === "s2" ? { ...s, duration, captured_frames: r2.frameCount } : s);
  meta.s2_rerecorded_at = new Date().toISOString();
  writeFileSync(scenesPath, `${JSON.stringify(meta, null, 2)}\n`);
  console.log(JSON.stringify({ s2: duration, frames: r2.frameCount, browserErrors: browserErrors.slice(0, 5) }));
} finally {
  try { ws.close(); } catch {}
  chrome.kill();
}
