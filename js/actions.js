// Veprimet e përbashkëta: të preferuarat, lista e blerjeve, menyja, kohëmatësit
import { state, update, uid, getRecipe } from "./store.js";
import { toast } from "./utils.js";

export const isFav = (id) => state.favorites.includes(id);

export function toggleFav(id) {
  const adding = !isFav(id);
  update((s) => (s.favorites = adding ? [...s.favorites, id] : s.favorites.filter((x) => x !== id)));
  toast(adding ? "❤️ U shtua te të preferuarat" : "U hoq nga të preferuarat");
}

export function markCooked(id) {
  update((s) => (s.cooked[id] = (s.cooked[id] || 0) + 1));
  toast("👨‍🍳 Bravo! E gatove " + getRecipe(id).title);
}

// ---------- Lista e blerjeve ----------
const keyOf = (name, unit) => `${name.trim().toLowerCase()}|${unit}`;

// Shton përbërës; nëse ekziston i njëjti produkt me të njëjtën njësi, i mbledh sasitë
export function addToShopping(items, source) {
  let added = 0;
  update((s) => {
    for (const { qty, unit, name } of items) {
      const existing = s.shopping.find((x) => !x.done && keyOf(x.name, x.unit) === keyOf(name, unit));
      if (existing) {
        if (qty != null) existing.qty = (existing.qty || 0) + qty;
        if (source && !existing.from.includes(source)) existing.from.push(source);
      } else {
        s.shopping.push({ id: uid(), name: name.trim(), qty, unit, done: false, from: source ? [source] : [] });
      }
      added++;
    }
  });
  return added;
}

export function addRecipeToShopping(recipe, servings = recipe.servings, { quiet = false } = {}) {
  const factor = servings / recipe.servings;
  const n = addToShopping(
    recipe.ingredients.map((i) => ({ ...i, qty: i.qty == null ? null : i.qty * factor })),
    recipe.title
  );
  if (!quiet) toast(`🛒 ${n} përbërës u shtuan në listë`);
  return n;
}

export const shoppingLeft = () => state.shopping.filter((x) => !x.done).length;

// ---------- Menyja javore ----------
export const DAYS = ["E hënë", "E martë", "E mërkurë", "E enjte", "E premte", "E shtunë", "E diel"];
export const MEALS = { mengjes: "🌅 Mëngjes", dreke: "☀️ Drekë", darke: "🌙 Darkë" };

export function setMeal(slot, recipeId) {
  update((s) => {
    if (recipeId) s.plan[slot] = recipeId;
    else delete s.plan[slot];
  });
}

// ---------- Kohëmatësit (ruhen me kohën e mbarimit, kështu mbijetojnë rifreskimin) ----------
export function startTimer(label, minutes) {
  update((s) => s.timers.push({ id: uid(), label, end: Date.now() + minutes * 60_000 }));
  toast(`⏱ Kohëmatësi u nis: ${minutes} min`);
}

export function stopTimer(id) {
  update((s) => (s.timers = s.timers.filter((t) => t.id !== id)));
}

export function addMinute(id) {
  update((s) => {
    const t = s.timers.find((x) => x.id === id);
    if (t) t.end = Math.max(t.end, Date.now()) + 60_000;
  });
}
