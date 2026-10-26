// Shto ose ndrysho një recetë personale
import { CATEGORIES, DIFFICULTY } from "../data.js";
import { state, update, uid, getRecipe, sanitizeRecipe } from "../store.js";
import { $, esc, parseIngredient, ingredientLine, toast } from "../utils.js";

const PALETTES = [
  ["#c2410c", "#7c2d12"],
  ["#15803d", "#14532d"],
  ["#1d4ed8", "#1e3a8a"],
  ["#b91c1c", "#7f1d1d"],
  ["#7c3aed", "#3b0764"],
  ["#ca8a04", "#713f12"],
];

// Hapat: një për rresht; "[15]" në fund = kohëmatës 15 min
const stepToLine = (s) => s.text + (s.minutes ? ` [${s.minutes}]` : "");
function parseStep(line) {
  const m = line.match(/^(.*?)\s*\[(\d+)\]\s*$/);
  return m ? { text: m[1].trim(), minutes: Number(m[2]) } : { text: line.trim(), minutes: 0 };
}

const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);

export default {
  render(el, [id]) {
    const existing = id ? getRecipe(id) : null;
    if (id && !existing?.custom) return location.replace("#/");
    const r = existing || { title: "", emoji: "🍲", category: "gjelle", minutes: 60, servings: 4, difficulty: 1, description: "", ingredients: [], steps: [], colors: PALETTES[0] };

    el.innerHTML = `
      <div class="container page narrow">
        <header class="page-head">
          <div>
            <a href="${existing ? `#/r/${existing.id}` : "#/"}" class="back-dark">← Kthehu</a>
            <h1>${existing ? "✏️ Ndrysho recetën" : "✍️ Receta ime e re"}</h1>
            <p class="muted">Receta jote ruhet vetëm në këtë pajisje (localStorage).</p>
          </div>
        </header>
        <form id="form" class="surface pad form">
          <div class="row">
            <label class="grow">Emri i recetës
              <input name="title" required maxlength="60" value="${esc(r.title)}" placeholder="p.sh. Tavë kosi e nënës" />
            </label>
            <label class="emoji-field">Ikona
              <input name="emoji" maxlength="4" value="${esc(r.emoji)}" />
            </label>
          </div>
          <label>Përshkrim i shkurtër
            <input name="description" maxlength="200" value="${esc(r.description)}" placeholder="Pse të pëlqen kjo recetë?" />
          </label>
          <div class="row">
            <label>Kategoria
              <select name="category">${Object.entries(CATEGORIES)
                .filter(([k]) => k !== "all")
                .map(([k, l]) => `<option value="${k}" ${r.category === k ? "selected" : ""}>${l}</option>`)
                .join("")}</select>
            </label>
            <label>Koha (min)
              <input name="minutes" type="number" min="1" max="2000" required value="${r.minutes}" />
            </label>
            <label>Porcione
              <input name="servings" type="number" min="1" max="50" required value="${r.servings}" />
            </label>
            <label>Vështirësia
              <select name="difficulty">${Object.entries(DIFFICULTY)
                .map(([k, l]) => `<option value="${k}" ${String(r.difficulty) === k ? "selected" : ""}>${l}</option>`)
                .join("")}</select>
            </label>
          </div>
          <label>Përbërësit <small class="muted">– një për rresht, p.sh. „500 g miell”, „2 copë vezë”, „kripë”</small>
            <textarea name="ingredients" rows="7" required>${esc(r.ingredients.map(ingredientLine).join("\n"))}</textarea>
          </label>
          <label>Hapat <small class="muted">– një për rresht; shto „[15]” në fund për kohëmatës 15 min</small>
            <textarea name="steps" rows="7" required>${esc(r.steps.map(stepToLine).join("\n"))}</textarea>
          </label>
          <div class="form-actions">
            <button class="btn" type="submit">💾 Ruaj recetën</button>
            ${existing ? `<button class="btn btn-ghost danger" type="button" data-act="delete">🗑 Fshi</button>` : ""}
          </div>
        </form>
      </div>`;

    $("#form", el).addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const ingredients = lines(f.get("ingredients")).map(parseIngredient);
      const steps = lines(f.get("steps")).map(parseStep);
      if (!ingredients.length || !steps.length) return toast("Shto të paktën një përbërës dhe një hap");

      const saved = sanitizeRecipe({
        id: existing?.id || "u-" + uid(),
        custom: true,
        title: f.get("title").trim(),
        emoji: f.get("emoji").trim() || "🍲",
        description: f.get("description").trim(),
        category: f.get("category"),
        minutes: Number(f.get("minutes")),
        servings: Number(f.get("servings")),
        difficulty: Number(f.get("difficulty")),
        colors: existing?.colors || PALETTES[state.custom.length % PALETTES.length],
        ingredients,
        steps,
      });
      if (!saved) return toast("Kontrollo fushat e recetës");
      update((s) => {
        const i = s.custom.findIndex((x) => x.id === saved.id);
        i === -1 ? s.custom.push(saved) : (s.custom[i] = saved);
      });
      toast("💾 Receta u ruajt");
      location.hash = `#/r/${saved.id}`;
    });

    el.addEventListener("click", (e) => {
      if (e.target.closest("button")?.dataset.act !== "delete") return;
      if (!confirm("Ta fshij këtë recetë përgjithmonë?")) return;
      update((s) => {
        s.custom = s.custom.filter((x) => x.id !== existing.id);
        s.favorites = s.favorites.filter((x) => x !== existing.id);
        for (const slot of Object.keys(s.plan)) if (s.plan[slot] === existing.id) delete s.plan[slot];
      });
      toast("Receta u fshi");
      location.hash = "#/";
    });
  },
};
