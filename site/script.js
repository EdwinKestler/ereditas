const stages = {
  watch: {
    number: "Stage 01", tag: "Silence watch", title: "The companion listens quietly.",
    body: "Phone unlocks, Meta sessions, and a one-dollar heartbeat form an early-warning watch. The starting index is calm and the vault is sealed.",
    signals: ["Phone present", "Meta active", "Heartbeat clear"], authority: "None — sealed", value: "11", unit: "watch index", caption: "Steady", progress: 11,
  },
  evidence: {
    number: "Stage 02", tag: "SAM 3.1 + Bayes update", title: "Evidence raises a question—not permission.",
    body: "The companion checks news and the registered circle. SAM 3.1 recognizes memorial objects, while likelihood ratios update the evidence score. After two quiet days, the 20% threshold remains closed.",
    signals: ["2 quiet days", "3 memorial objects", "Evidence score 6.95%"], authority: "None — under 20% threshold", value: "7", unit: "evidence score %", caption: "Below threshold", progress: 7,
  },
  confirm: {
    number: "Stage 03", tag: "Human confirmation", title: "The circle carries the consequence.",
    body: "The worked case crosses the 20% threshold and can ask your people. The system can now ask Ana—but the vault is still sealed until her answer is explicit.",
    signals: ["10 silent days", "Obituary signal", "Ready to ask"], authority: "Pending human answer", value: "96", unit: "evidence score %", caption: "Ask the circle", progress: 96,
  },
  release: {
    number: "Stage 04", tag: "Scoped release", title: "Passed releases only what was promised.",
    body: "Ana’s human confirmation unlocks ordinary, owner-classified items. Drive and Facebook receive short-lived access. The high-value wallet and bank remain held for a second confirmer.",
    signals: ["Ana: passed", "2 grants released", "High-value held"], authority: "Human-confirmed access", value: "2", unit: "grants released", caption: "Only what you chose", progress: 58,
  },
};

const panel = document.querySelector(".stage-panel");
const tabs = [...document.querySelectorAll(".stage-tab")];

function setStage(name) {
  const stage = stages[name];
  if (!stage || !panel) return;

  tabs.forEach((tab) => {
    const selected = tab.dataset.stage === name;
    tab.classList.toggle("is-active", selected);
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", `tab-${name}`);

  panel.querySelector("[data-stage-number]").textContent = stage.number;
  panel.querySelector("[data-stage-tag]").textContent = stage.tag;
  panel.querySelector("[data-stage-title]").textContent = stage.title;
  panel.querySelector("[data-stage-body]").textContent = stage.body;
  panel.querySelector("[data-stage-authority]").innerHTML = `<i></i>${stage.authority}`;
  panel.querySelector("[data-stage-value]").textContent = stage.value;
  panel.querySelector("[data-stage-unit]").textContent = stage.unit;
  panel.querySelector("[data-stage-caption]").textContent = stage.caption;
  panel.querySelector(".stage-meter").style.setProperty("--stage-progress", stage.progress);
  panel.querySelector("[data-stage-signals]").innerHTML = stage.signals.map((signal) => `<span>${signal}</span>`).join("");
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => setStage(tab.dataset.stage));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    tabs[next].focus();
    setStage(tabs[next].dataset.stage);
  });
});

const header = document.querySelector("[data-header]");
const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");
if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
}

const tiltCard = document.querySelector("[data-tilt]");
if (tiltCard && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
  tiltCard.addEventListener("pointermove", (event) => {
    const rect = tiltCard.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    tiltCard.style.transform = `perspective(900px) rotateX(${y * -3}deg) rotateY(${x * 4}deg)`;
  });
  tiltCard.addEventListener("pointerleave", () => { tiltCard.style.transform = "perspective(900px) rotateX(0) rotateY(0)"; });
}
