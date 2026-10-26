export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

const FRACTIONS = [
  [0.25, "¼"],
  [0.33, "⅓"],
  [0.5, "½"],
  [0.67, "⅔"],
  [0.75, "¾"],
];

// 1.5 → "1½", 0.25 → "¼", 1250 g → "1.25 kg"
export function fmtQty(qty, unit = "") {
  if (qty == null) return "";
  if (unit === "g" && qty >= 1000) return fmtQty(qty / 1000, "kg");
  if (unit === "ml" && qty >= 1000) return fmtQty(qty / 1000, "l");
  if (["g", "ml"].includes(unit)) return `${qty >= 50 ? Math.round(qty / 5) * 5 : Math.max(1, Math.round(qty))} ${unit}`;
  const whole = Math.floor(qty);
  const rest = qty - whole;
  const frac = FRACTIONS.find(([v]) => Math.abs(rest - v) < 0.05);
  let text;
  if (rest < 0.05) text = String(whole);
  else if (rest > 0.95) text = String(whole + 1);
  else if (frac) text = (whole || "") + frac[1];
  else text = String(Math.round(qty * 10) / 10);
  return unit ? `${text} ${unit}` : text;
}

export function fmtMinutes(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m} min`;
  return m ? `${h} orë ${m} min` : `${h} orë`;
}

export function fmtClock(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function debounce(fn, ms = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function toast(message) {
  let box = $("#toasts");
  if (!box) {
    box = Object.assign(document.createElement("div"), { id: "toasts" });
    box.setAttribute("role", "status");
    document.body.append(box);
  }
  const el = Object.assign(document.createElement("div"), { className: "toast", textContent: message });
  box.append(el);
  setTimeout(() => el.classList.add("out"), 2400);
  setTimeout(() => el.remove(), 2800);
}

export function download(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Lexon një rresht si "500 g miell" ose "1/2 lugë çaji kripë" ose "kripë"
const UNITS = ["lugë çaji", "lugë", "kg", "g", "ml", "l", "gotë", "copë", "thelpinj", "pako"];
export function parseIngredient(line) {
  const text = line.trim();
  const m = text.match(/^(\d+\/\d+|\d+(?:[.,]\d+)?|½|¼|¾)\s*(.*)$/);
  if (!m) return { qty: null, unit: "", name: text };
  const raw = m[1];
  const qty = { "½": 0.5, "¼": 0.25, "¾": 0.75 }[raw] ?? (raw.includes("/") ? raw.split("/")[0] / raw.split("/")[1] : Number(raw.replace(",", ".")));
  let rest = m[2].trim();
  const unit = UNITS.find((u) => rest.toLowerCase().startsWith(u + " ") || rest.toLowerCase() === u) || "";
  if (unit) rest = rest.slice(unit.length).trim();
  return { qty, unit, name: rest || text };
}

export const ingredientLine = (i) => [i.qty != null ? fmtQty(i.qty, i.unit) : "", i.name].filter(Boolean).join(" ");

// Kohëmatësi: tingull i shkurtër me Web Audio (pa skedarë audio)
export function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.35, 0.7].forEach((at) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.3);
    });
    navigator.vibrate?.([200, 100, 200]);
  } catch {}
}
