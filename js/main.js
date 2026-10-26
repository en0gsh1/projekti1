import { state, update, subscribe, sanitizeRecipe } from "./store.js";
import { $, $$, esc, fmtClock, beep, toast, download } from "./utils.js";
import { shoppingLeft, stopTimer, addMinute } from "./actions.js";
import list from "./views/list.js";
import recipe from "./views/recipe.js";
import cook from "./views/cook.js";
import plan from "./views/plan.js";
import shopping from "./views/shopping.js";
import editor from "./views/editor.js";

// Router me hash
const routes = [
  [/^#\/?$/, list, "list"],
  [/^#\/r\/([\w-]+)$/, recipe, "list"],
  [/^#\/cook\/([\w-]+)$/, cook, "cook"],
  [/^#\/plan$/, plan, "plan"],
  [/^#\/shop$/, shopping, "shop"],
  [/^#\/new$/, editor, "list"],
  [/^#\/edit\/([\w-]+)$/, editor, "list"],
];

let current = null;

function mount(view, params) {
  current?.destroy?.();
  current = view;
  const root = document.createElement("div");
  root.className = "view";
  $("#app").replaceChildren(root);
  document.title = "Kuzhina Kosovare";
  view.render(root, params);
}

function route() {
  const hash = location.hash || "#/";
  for (const [re, view, nav] of routes) {
    const match = hash.match(re);
    if (!match) continue;
    mount(view, match.slice(1));
    $$("#nav a").forEach((a) => a.classList.toggle("active", a.dataset.nav === nav));
    document.body.classList.toggle("cooking", nav === "cook");
    window.scrollTo(0, 0);
    return;
  }
  location.replace("#/");
}

function renderShell() {
  document.documentElement.dataset.theme = state.theme;
  $("#themeToggle").textContent = state.theme === "dark" ? "☀️" : "🌙";
  const left = shoppingLeft();
  const planned = Object.keys(state.plan).length;
  $("#shopBadge").textContent = left || "";
  $("#planBadge").textContent = planned || "";
}

// ---------- Kohëmatësit: shiriti lundrues ----------
function renderTimers() {
  const dock = $("#timers");
  const now = Date.now();
  dock.hidden = !state.timers.length;
  dock.innerHTML = state.timers
    .map((t) => {
      const left = t.end - now;
      return `
        <div class="timer ${left <= 0 ? "ringing" : ""}">
          <span class="timer-time">${left <= 0 ? "⏰ Gati!" : fmtClock(left)}</span>
          <span class="timer-label">${esc(t.label)}</span>
          <button data-plus="${t.id}" title="+1 minutë">+1</button>
          <button data-stop="${t.id}" title="Ndalo">✕</button>
        </div>`;
    })
    .join("");
}

function tick() {
  const now = Date.now();
  const due = state.timers.filter((t) => t.end <= now && !t.rang);
  if (due.length) {
    update((s) => s.timers.forEach((t) => t.end <= now && (t.rang = true)), { silent: true });
    due.forEach((t) => toast(`⏰ Koha mbaroi: ${t.label}`));
    beep();
  }
  if (state.timers.length) renderTimers();
}

$("#timers").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (btn?.dataset.stop) stopTimer(btn.dataset.stop);
  if (btn?.dataset.plus) {
    addMinute(btn.dataset.plus);
    update((s) => (s.timers.find((t) => t.id === btn.dataset.plus).rang = false), { silent: true });
  }
});

// ---------- Kopje rezervë (eksport / import) ----------
$("#exportBtn").addEventListener("click", () => {
  const { favorites, cooked, notes, custom, shopping, plan } = state;
  const data = { app: "kuzhina-kosovare", version: 1, exportedAt: new Date().toISOString(), favorites, cooked, notes, custom, shopping, plan };
  download(`kuzhina-kopje-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
});

$("#importFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== "kuzhina-kosovare") throw new Error("format");
    if (!confirm("Kopja do t'i zëvendësojë të dhënat e tanishme. Vazhdo?")) return;
    const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
    update((s) => {
      s.custom = (Array.isArray(data.custom) ? data.custom : []).map(sanitizeRecipe).filter(Boolean);
      s.favorites = Array.isArray(data.favorites) ? data.favorites.filter((x) => typeof x === "string") : [];
      s.cooked = isObj(data.cooked) ? data.cooked : {};
      s.notes = isObj(data.notes) ? data.notes : {};
      s.plan = isObj(data.plan) ? data.plan : {};
      s.shopping = (Array.isArray(data.shopping) ? data.shopping : [])
        .filter((x) => x && typeof x.name === "string")
        .map((x) => ({
          id: String(x.id || Math.random()),
          name: x.name.slice(0, 80),
          qty: Number.isFinite(x.qty) ? x.qty : null,
          unit: String(x.unit || "").slice(0, 20),
          done: !!x.done,
          from: Array.isArray(x.from) ? x.from.map(String) : [],
        }));
    });
    toast("✅ Kopja u rikthye");
  } catch {
    toast("⚠️ Skedari nuk është kopje e vlefshme");
  }
});

// ---------- Nisja ----------
subscribe(() => {
  renderShell();
  renderTimers();
  current?.update?.();
});

$("#themeToggle").addEventListener("click", () => update((s) => (s.theme = s.theme === "dark" ? "light" : "dark")));
document.addEventListener("keydown", (e) => current?.onKey?.(e));
window.addEventListener("hashchange", route);
window.addEventListener("storage", (e) => e.key?.startsWith("kuzhina:") && location.reload());

renderShell();
renderTimers();
route();
setInterval(tick, 1000);
