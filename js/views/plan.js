// Menyja e javës: 7 ditë × 3 vakte
import { CATEGORIES } from "../data.js";
import { state, update, allRecipes, getRecipe } from "../store.js";
import { $, esc, fmtMinutes, toast } from "../utils.js";
import { DAYS, MEALS, setMeal, addRecipeToShopping } from "../actions.js";

let root;

// Dita e sotme (0 = e hënë)
const today = () => (new Date().getDay() + 6) % 7;

function options(selected) {
  const groups = Object.entries(CATEGORIES)
    .filter(([k]) => k !== "all")
    .map(([k, label]) => {
      const list = allRecipes().filter((r) => r.category === k);
      return list.length
        ? `<optgroup label="${label}">${list
            .map((r) => `<option value="${r.id}" ${r.id === selected ? "selected" : ""}>${esc(r.emoji)} ${esc(r.title)}</option>`)
            .join("")}</optgroup>`
        : "";
    });
  return `<option value="">— bosh —</option>${groups.join("")}`;
}

function renderWeek() {
  const planned = Object.values(state.plan).map(getRecipe).filter(Boolean);
  const minutes = planned.reduce((sum, r) => sum + r.minutes, 0);
  $("#stats", root).innerHTML = `
    <div class="stat surface"><strong>${planned.length}</strong><small class="muted">vakte të planifikuara</small></div>
    <div class="stat surface"><strong>${new Set(planned.map((r) => r.id)).size}</strong><small class="muted">receta të ndryshme</small></div>
    <div class="stat surface"><strong>${fmtMinutes(minutes)}</strong><small class="muted">kohë gatimi gjithsej</small></div>`;

  $("#week", root).innerHTML = DAYS.map(
    (day, d) => `
      <section class="day surface ${d === today() ? "today" : ""}">
        <h3>${day} ${d === today() ? '<span class="pill">Sot</span>' : ""}</h3>
        ${Object.entries(MEALS)
          .map(([meal, label]) => {
            const slot = `${d}-${meal}`;
            const r = getRecipe(state.plan[slot]);
            return `
              <div class="slot ${r ? "filled" : ""}">
                <small>${label}</small>
                <select data-slot="${slot}" aria-label="${day} ${label}">${options(r?.id)}</select>
                ${r ? `<a href="#/r/${r.id}" class="slot-link">Hap recetën →</a>` : ""}
              </div>`;
          })
          .join("")}
      </section>`
  ).join("");
}

// Mbush vaktet bosh me receta të rastësishme nga kategoria e duhur
function fillRandom() {
  const pick = (cats) => {
    const pool = allRecipes().filter((r) => cats.includes(r.category));
    return pool[Math.floor(Math.random() * pool.length)]?.id;
  };
  let filled = 0;
  update((s) => {
    DAYS.forEach((_, d) => {
      for (const meal of Object.keys(MEALS)) {
        const slot = `${d}-${meal}`;
        if (s.plan[slot]) continue;
        const id = meal === "mengjes" ? pick(["mengjes", "pite"]) : pick(["gjelle", "pite"]);
        if (id) {
          s.plan[slot] = id;
          filled++;
        }
      }
    });
  });
  toast(filled ? `🎲 U mbushën ${filled} vakte` : "Java është plot!");
}

export default {
  render(el) {
    root = el;
    el.innerHTML = `
      <div class="container page">
        <header class="page-head">
          <div>
            <h1>📅 Menyja e javës</h1>
            <p class="muted">Zgjidh çfarë do të gatuash çdo ditë – pastaj krijo listën e blerjeve me një klik.</p>
          </div>
          <div class="tools">
            <button class="btn" data-act="shop">🛒 Krijo listën e blerjeve</button>
            <button class="btn btn-ghost" data-act="random">🎲 Mbush bosh</button>
            <button class="btn btn-ghost danger" data-act="clear">🗑 Pastro javën</button>
          </div>
        </header>
        <section id="stats" class="stats"></section>
        <div id="week" class="week"></div>
      </div>`;

    el.addEventListener("change", (e) => {
      if (e.target.dataset.slot) setMeal(e.target.dataset.slot, e.target.value);
    });

    el.addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.act;
      if (act === "random") fillRandom();
      if (act === "clear" && Object.keys(state.plan).length && confirm("Ta pastroj gjithë menynë e javës?")) {
        update((s) => (s.plan = {}));
      }
      if (act === "shop") {
        const ids = Object.values(state.plan).filter(getRecipe);
        if (!ids.length) return toast("Menyja është bosh");
        // Çdo vakt shtohet me porcionet bazë të recetës; përbërësit e njëjtë mblidhen
        const n = ids.reduce((sum, id) => sum + addRecipeToShopping(getRecipe(id), undefined, { quiet: true }), 0);
        toast(`🛒 ${n} përbërës nga ${ids.length} vakte u shtuan në listë`);
        location.hash = "#/shop";
      }
    });

    this.update();
  },

  update() {
    renderWeek();
  },
};
