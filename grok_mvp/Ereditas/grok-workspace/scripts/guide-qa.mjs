import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

const url = "http://127.0.0.1:8080/";
const output = resolve(process.cwd(), "../../../docs/releases/0.2.0/live");
await mkdir(output, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
const report = [];

async function capture(page, name) {
  await page.screenshot({ path: resolve(output, name), fullPage: false });
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (overflow.scrollWidth > overflow.clientWidth) {
    throw new Error(`${name}: horizontal overflow ${overflow.scrollWidth} > ${overflow.clientWidth}`);
  }
  report.push({ name, ...overflow });
}

async function desktop() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.request.post(new URL("/api/reset", url).href);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Elena's companion at rest" }).waitFor();
  await capture(page, "guide-desktop-step1.png");

  await page.getByRole("button", { name: /Continue: one quiet day/ }).click();
  await page.getByRole("button", { name: /Continue: one quiet day/ }).click();
  await page.getByRole("heading", { name: "Two quiet days" }).waitFor();
  await page.getByRole("button", { name: "Continue: check the world" }).click();
  await page.getByRole("heading", { name: "Check the world" }).waitFor({ timeout: 45_000 });
  await capture(page, "guide-desktop-step3.png");

  await page.getByRole("button", { name: "Continue: run the worked case" }).click();
  await page.getByRole("heading", { name: "The worked case" }).waitFor({ timeout: 45_000 });
  await page.getByRole("button", { name: "Continue: ask Ana" }).click();
  await page.getByRole("heading", { name: "Ask Ana on WhatsApp" }).waitFor();
  await capture(page, "guide-desktop-step5.png");

  const audioRequest = page.waitForRequest(
    (request) => request.url().endsWith("/static/voice/ana-passed.wav"),
    { timeout: 5_000 },
  );
  const heldSnapshot = await (await page.request.get(new URL("/api/state", url).href)).json();
  await page.route("**/api/voice-answer", async (route) => {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_500));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(heldSnapshot) });
  });
  await page.getByRole("button", { name: "Ana: Elena has died" }).click();
  await page.getByText("Playing Ana's note", { exact: true }).waitFor();
  await audioRequest;
  await page.waitForTimeout(1_600);
  await page.unroute("**/api/voice-answer");

  await page.request.post(new URL("/api/answer", url).href, {
    data: { who: "Ana", answer: "passed" },
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Ana confirms by voice note" }).waitFor({ timeout: 45_000 });
  await page.getByRole("button", { name: "Continue: open the vault" }).click();
  await page.getByRole("heading", { name: "Only what Elena chose" }).waitFor();
  await capture(page, "guide-desktop-step7a.png");
  if (errors.length) throw new Error(`desktop console errors: ${errors.join(" | ")}`);
  await context.close();
}

async function mobile() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.request.post(new URL("/api/reset", url).href);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Guided demo · Step 1\/8/ }).waitFor();
  await capture(page, "guide-mobile-collapsed.png");
  await page.getByRole("button", { name: /Guided demo · Step 1\/8/ }).click();
  await page.getByRole("heading", { name: "Elena's companion at rest" }).waitFor();
  await capture(page, "guide-mobile-open.png");
  if (errors.length) throw new Error(`mobile console errors: ${errors.join(" | ")}`);
  await context.close();
}

try {
  await desktop();
  await mobile();
  console.log(JSON.stringify({ ok: true, report }, null, 2));
} finally {
  await browser.close();
}
