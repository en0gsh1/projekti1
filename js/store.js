// "Databaza" e vogël mbi localStorage + state reaktiv
import { RECIPES } from "./data.js";

const PREFIX = "kuzhina:";
const KEYS = ["theme", "favorites", "cooked", "notes", "custom", "shopping", "plan", "timers"];

export const storage = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* localStorage i bllokuar ose plot – aplikacioni vazhdon */
    }
  },
};

export const uid = () => Math.random().toString(36).slice(2, 9);

// Pastron një recetë personale që vjen nga localStorage ose nga një kopje e importuar
const clampInt = (v, min, max, fallback) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const isColor = (c) => typeof c === "string" && /^#[0-9a-f]{3,8}$/i.test(c);
const str = (v, max) => String(v ?? "").slice(0, max);

export function sanitizeRecipe(r) {
  if (!r || typeof r !== "object" || !/^u-[a-z0-9]{1,20}$/.test(r.id)) return null;
  const ingredients = arr(r.ingredients)
    .slice(0, 60)
    .map((i) => ({
      qty: i?.qty == null || !Number.isFinite(Number(i.qty)) ? null : Math.max(0, Number(i.qty)),
      unit: str(i?.unit, 20),
      name: str(i?.name, 80),
    }))
    .filter((i) => i.name);
  const steps = arr(r.steps)
    .slice(0, 40)
    .map((s) => ({ text: str(s?.text, 600), minutes: clampInt(s?.minutes, 0, 600, 0) }))
    .filter((s) => s.text);
  if (!ingredients.length || !steps.length) return null;
  return {
    id: r.id,
    custom: true,
    title: str(r.title, 60) || "Pa emër",
    emoji: str(r.emoji, 4) || "🍲",
    description: str(r.description, 200),
    category: ["gjelle", "pite", "meze", "mengjes", "embelsira"].includes(r.category) ? r.category : "gjelle",
    minutes: clampInt(r.minutes, 1, 2000, 60),
    servings: clampInt(r.servings, 1, 50, 4),
    difficulty: clampInt(r.difficulty, 1, 3, 1),
    colors: arr(r.colors).length === 2 && r.colors.every(isColor) ? r.colors : ["#c2410c", "#7c2d12"],
    ingredients,
    steps,
  };
}

const prefersDark = typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const arr = (v) => (Array.isArray(v) ? v : []);

export const state = {
  theme: storage.get("theme", prefersDark ? "dark" : "light"),
  favorites: arr(storage.get("favorites", [])), // [recipeId]
  cooked: obj(storage.get("cooked", {})), // { recipeId: herë të gatuara }
  notes: obj(storage.get("notes", {})), // { recipeId: "shënim" }
  custom: arr(storage.get("custom", [])).map(sanitizeRecipe).filter(Boolean), // recetat e mia
  shopping: arr(storage.get("shopping", [])), // [{ id, name, qty, unit, done, from: [] }]
  plan: obj(storage.get("plan", {})), // { "0-dreke": recipeId, ... }
  timers: arr(storage.get("timers", [])), // [{ id, label, end }]
};

export function persist() {
  KEYS.forEach((key) => storage.set(key, state[key]));
}

const listeners = new Set();
export const subscribe = (fn) => listeners.add(fn);

export function update(fn, { silent = false } = {}) {
  fn(state);
  persist();
  if (!silent) listeners.forEach((l) => l());
}

export const allRecipes = () => [...RECIPES, ...state.custom];
export const getRecipe = (id) => allRecipes().find((r) => r.id === id);
