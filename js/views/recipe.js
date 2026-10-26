import { CATEGORIES, DIFFICULTY } from "../data.js";
import { state, update, getRecipe } from "../store.js";
import { $, esc, fmtQty, fmtMinutes, toast } from "../utils.js";
import { isFav, toggleFav, markCooked, addRecipeToShopping, startTimer, setMeal, DAYS, MEALS } from "../actions.js";

let root, recipe, servings;
const checked = new Set(); // përbërësit që i ke gati (vetëm për këtë vizitë)

function renderIngredients() {
  const factor = servings / recipe.servings;
  $("#servings", root).textContent = servings;
  $("#ingredients", root).innerHTML = recipe.ingredients
    .map((ing, i) => {
      const qty = ing.qty == null ? "" : fmtQty(ing.qty * factor, ing.unit);
      return `
        <li>
          <label class="check ${checked.has(i) ? "done" : ""}">
            <input type="checkbox" data-ing="${i}" ${checked.has(i) ? "checked" : ""} />
            <span><strong>${qty}</strong> ${esc(ing.name)}${ing.qty == null ? ' <small class="muted">(sipas shijes)</small>' : ""}</span>
          </label>
        </li>`;
    })
    .join("");
}

function renderActions() {
  const fav = isFav(recipe.id);
  const cooked = state.cooked[recipe.id] || 0;
  $("#actions", root).innerHTML = `
    <a class="btn btn-gold" href="#/cook/${recipe.id}">👨‍🍳 Fillo gatimin</a>
    <button class="btn btn-glass" data-act="fav">${fav ? "❤️ E preferuar" : "🤍 Të preferuarat"}</button>
    <button class="btn btn-glass" data-act="cooked">✅ E gatova${cooked ? ` (${cooked}×)` : ""}</button>
    ${recipe.custom ? `<a class="btn btn-glass" href="#/edit/${recipe.id}">✏️ Ndrysho</a>` : ""}`;
}

export default {
  render(el, [id]) {
    root = el;
    recipe = getRecipe(id);
    if (!recipe) return location.replace("#/");
    servings = recipe.servings;
    checked.clear();
    const r = recipe;

    el.innerHTML = `
      <section class="recipe-hero" style="--c1:${r.colors[0]};--c2:${r.colors[1]}">
        <div class="container">
          <a href="#/" class="back">← Të gjitha recetat</a>
          <div class="recipe-title">
            <span class="recipe-emoji">${esc(r.emoji)}</span>
            <div>
              <span class="tag tag-light">${CATEGORIES[r.category] || ""}</span>
              <h1>${esc(r.title)}</h1>
              <p>${esc(r.description)}</p>
            </div>
          </div>
          <div class="facts">
            <span>⏱ ${fmtMinutes(r.minutes)}</span>
            <span>📶 ${DIFFICULTY[r.difficulty]}</span>
            <span>🧂 ${r.ingredients.length} përbërës</span>
            <span>📝 ${r.steps.length} hapa</span>
          </div>
          <div id="actions" class="actions"></div>
        </div>
      </section>

      <div class="container recipe-grid">
        <aside class="surface pad ingredients-box">
          <div class="box-head">
            <h2>🧂 Përbërësit</h2>
            <div class="stepper" aria-label="Porcionet">
              <button data-act="less" aria-label="Më pak porcione">−</button>
              <span><strong id="servings"></strong> porcione</span>
              <button data-act="more" aria-label="Më shumë porcione">+</button>
            </div>
          </div>
          <ul id="ingredients" class="ingredients"></ul>
          <button class="btn btn-block" data-act="shop">🛒 Shto në listën e blerjeve</button>
          <details class="add-week">
            <summary>📅 Shto në menynë e javës</summary>
            <div class="add-week-row">
              <select id="weekDay">${DAYS.map((d, i) => `<option value="${i}">${d}</option>`).join("")}</select>
              <select id="weekMeal">${Object.entries(MEALS).map(([k, l]) => `<option value="${k}" ${k === "dreke" ? "selected" : ""}>${l}</option>`).join("")}</select>
              <button class="btn" data-act="week">Shto</button>
            </div>
          </details>
        </aside>

        <div class="recipe-main">
          <section class="surface pad">
            <h2>📝 Përgatitja</h2>
            <ol class="steps">
              ${r.steps
                .map(
                  (s, i) => `
                <li>
                  <span class="step-num">${i + 1}</span>
                  <div>
                    <p>${esc(s.text)}</p>
                    ${s.minutes ? `<button class="timer-btn" data-timer="${i}">⏱ Nis kohëmatësin ${s.minutes} min</button>` : ""}
                  </div>
                </li>`
                )
                .join("")}
            </ol>
          </section>
          <section class="surface pad">
            <h2>✍️ Shënimet e mia</h2>
            <textarea id="notes" rows="3" placeholder="p.sh. Herën tjetër më pak kripë, ose shto pak djathë…">${esc(state.notes[r.id] || "")}</textarea>
            <small class="muted">Ruhet automatikisht.</small>
          </section>
        </div>
      </div>`;

    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "less" && servings > 1) servings--;
      else if (act === "more" && servings < 50) servings++;
      else if (act === "fav") return toggleFav(r.id);
      else if (act === "cooked") return markCooked(r.id);
      else if (act === "shop") return addRecipeToShopping(r, servings);
      else if (act === "week") {
        const day = $("#weekDay", el).value;
        const meal = $("#weekMeal", el).value;
        setMeal(`${day}-${meal}`, r.id);
        return toast(`📅 U shtua: ${DAYS[day]}, ${MEALS[meal].slice(3)}`);
      } else if (btn.dataset.timer) {
        const step = r.steps[btn.dataset.timer];
        return startTimer(`${r.title} · hapi ${Number(btn.dataset.timer) + 1}`, step.minutes);
      }
      renderIngredients();
    });

    el.addEventListener("change", (e) => {
      const i = e.target.dataset.ing;
      if (i == null) return;
      e.target.checked ? checked.add(Number(i)) : checked.delete(Number(i));
      e.target.closest(".check").classList.toggle("done", e.target.checked);
    });

    $("#notes", el).addEventListener("input", (e) =>
      update((s) => (s.notes[r.id] = e.target.value), { silent: true })
    );

    document.title = `${r.title} · Kuzhina Kosovare`;
    renderIngredients();
    renderActions();
  },

  update() {
    renderActions();
  },
};
