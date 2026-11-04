const THEMES = [
  { id: "midnight", label: "Midnight Trust", img: "/static/themes/midnight.jpg" },
  { id: "heritage", label: "Heritage Calm", img: "/static/themes/heritage.jpg" },
  { id: "forest", label: "Forest Legacy", img: "/static/themes/forest.jpg" },
  { id: "minimal", label: "Pure Minimal", img: "/static/themes/minimal.jpg" },
  { id: "stone", label: "Soft Stone", img: "/static/themes/stone.jpg" },
];

const CIRC = 2 * Math.PI * 52;
let filmTimer = null;

async function api(path, method = "GET", body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function toast(msg) {
  const el = document.getElementById("toast");
  if (!msg) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.textContent = msg;
}

function setTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("on", t.dataset.tab === name));
  document.querySelectorAll(".panel").forEach((p) => p.classList.toggle("on", p.id === name));
}

function renderThemes(active) {
  const grid = document.getElementById("themeGrid");
  grid.innerHTML = "";
  THEMES.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-card" + (t.id === active ? " on" : "");
    btn.innerHTML = `<img src="${t.img}" alt="${t.label}" /><span>${t.label}</span>`;
    btn.addEventListener("click", async () => {
      const state = await api("/api/theme", "POST", { theme: t.id });
      paint(state);
    });
    grid.appendChild(btn);
  });
}

function paint(s) {
  document.documentElement.dataset.theme = s.theme || "midnight";
  renderThemes(s.theme);
  document.getElementById("ring").textContent = s.ring;
  document.getElementById("band").textContent = s.band;
  document.getElementById("days").textContent = s.days;
  document.getElementById("post").textContent = s.posterior_label;
  document.getElementById("tree").textContent = s.tree_open ? "open" : "closed";
  document.getElementById("indexNote").textContent = s.index_note;
  const offset = CIRC * (1 - Math.min(s.watch_index, 1));
  document.getElementById("arc").style.strokeDashoffset = String(offset);
  ["device", "meta", "heartbeat"].forEach((k) => {
    document.getElementById("chip-" + k).classList.toggle("off", !s.chips[k]);
  });

  const posts = document.getElementById("posts");
  posts.innerHTML = "";
  (s.posts || []).forEach((p) => {
    const all = p.boxes || [];
    const shown = [...all].sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 1);
    const extra = all.length - shown.length;
    const boxes = shown
      .map(
        (b) =>
          `<span class="box" style="left:${b.x * 100}%;top:${b.y * 100}%;width:${b.w * 100}%;height:${b.h * 100}%">${b.label}</span>`
      )
      .join("");
    const more = extra > 0 ? `<span class="more">+${extra}</span>` : "";
    posts.insertAdjacentHTML(
      "beforeend",
      `<article class="post">
        <div class="frame"><img src="${p.image}" alt="${p.object}" />${boxes}${more}</div>
        <div><h3>${p.author} · ${p.object}</h3><p>${p.caption} · ${p.source}</p></div>
      </article>`
    );
  });

  const msgs = document.getElementById("msgs");
  msgs.innerHTML = "";
  if (!s.tree_open) {
    msgs.innerHTML = `<p class="bubble">Tree closed. Posterior ${s.posterior_label} (bar 20%). Run the worked case to place the call.</p>`;
  } else if (!(s.thread || []).length) {
    msgs.innerHTML = `<p class="bubble">Ana — we have not heard from Elena. Is she well, are you unsure, or has she passed?</p>`;
  }
  (s.thread || []).forEach((m) => {
    msgs.insertAdjacentHTML("beforeend", `<p class="bubble"><strong>${m.from}:</strong> ${m.text}</p>`);
  });

  const grants = document.getElementById("grants");
  grants.innerHTML = "";
  (s.grants || []).forEach((g) => {
    grants.insertAdjacentHTML(
      "beforeend",
      `<li class="${g.released ? "released" : "held"}">
        <div class="tag">${g.action} · ${g.heir}${g.high_value ? " · high-value" : ""} · ${g.released ? "released" : "held"}</div>
        <strong>${g.asset}</strong>
      </li>`
    );
  });
  const packet = document.getElementById("packet");
  if (s.packet) {
    packet.classList.remove("hidden");
    const links = s.packet.items
      .map((i) => `<li>${i.asset}<br><code>${i.link}</code></li>`)
      .join("");
    packet.innerHTML = `<div class="tag">Scoped package</div><p>${s.packet.whatsapp_body}</p><ul>${links}</ul>`;
  } else {
    packet.classList.add("hidden");
    packet.innerHTML = "";
  }

  const wishes = document.getElementById("wishesList");
  wishes.innerHTML = "";
  (s.wishes || []).forEach((w) => {
    wishes.insertAdjacentHTML("beforeend", `<li>${w.done ? "✓" : "○"} ${w.label}</li>`);
  });
  document.getElementById("narrative").textContent = s.narrative || "";
  if (s.error) toast(s.error);
  else toast("");
}

async function refresh() {
  paint(await api("/api/state"));
}

async function act(name) {
  if (name === "advance") paint(await api("/api/advance", "POST", { days: 1 }));
  if (name === "scan") paint(await api("/api/scan", "POST"));
  if (name === "worked") {
    setTab("circle");
    paint(await api("/api/worked-case", "POST"));
  }
  if (name === "reset") {
    if (filmTimer) clearTimeout(filmTimer);
    paint(await api("/api/reset", "POST"));
  }
  if (name === "film") playFilm();
}

async function playFilm() {
  toast("Film: quiet days → scan → confirmation → scoped release");
  await api("/api/reset", "POST");
  await api("/api/worked-case", "POST");
  setTab("pulse");
  await refresh();
  filmTimer = setTimeout(async () => {
    setTab("circle");
    await refresh();
    filmTimer = setTimeout(async () => {
      paint(await api("/api/answer", "POST", { who: "Ana", answer: "passed" }));
      setTab("vault");
    }, 1600);
  }, 1400);
}

document.querySelectorAll("[data-act]").forEach((btn) => {
  btn.addEventListener("click", () => act(btn.dataset.act));
});
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => setTab(btn.dataset.tab));
});
document.querySelectorAll("[data-answer]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const state = await api("/api/answer", "POST", { who: "Ana", answer: btn.dataset.answer });
    paint(state);
    if (state.may_release) setTab("vault");
  });
});

api("/api/health").then((h) => {
  const el = document.getElementById("metaFlag");
  el.textContent = h.meta_configured
    ? `Model API ready · ${h.muse_model} + ${h.sam_model}`
    : "Model API key missing — SAM/Muse use mock boxes and canned copy";
});

refresh();
