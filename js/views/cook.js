// Mënyra e gatimit: një hap në ekran, tekst i madh, ekrani nuk fiket
import { getRecipe } from "../store.js";
import { $, esc } from "../utils.js";
import { markCooked, startTimer } from "../actions.js";

let root, recipe, step, wakeLock;

async function keepAwake() {
  try {
    wakeLock = await navigator.wakeLock?.request("screen");
  } catch {
    /* jo çdo shfletues e lejon */
  }
}

function render() {
  const total = recipe.steps.length;
  const s = recipe.steps[step];
  const last = step === total - 1;
  $("#cookBody", root).innerHTML = `
    <div class="cook-progress"><span style="width:${((step + 1) / total) * 100}%"></span></div>
    <p class="cook-count">Hapi ${step + 1} nga ${total}</p>
    <p class="cook-text">${esc(s.text)}</p>
    ${s.minutes ? `<button class="btn btn-gold btn-big" data-act="timer">⏱ Nis kohëmatësin ${s.minutes} min</button>` : ""}
    <div class="cook-nav">
      <button class="btn btn-glass btn-big" data-act="prev" ${step === 0 ? "disabled" : ""}>← Mbrapa</button>
      ${
        last
          ? `<button class="btn btn-gold btn-big" data-act="done">🎉 Përfundova!</button>`
          : `<button class="btn btn-gold btn-big" data-act="next">Tjetri →</button>`
      }
    </div>
    <p class="cook-hint">Këshillë: përdor shigjetat ← → të tastierës</p>`;
}

function go(delta) {
  const next = step + delta;
  if (next < 0 || next >= recipe.steps.length) return;
  step = next;
  render();
}

export default {
  render(el, [id]) {
    root = el;
    recipe = getRecipe(id);
    if (!recipe) return location.replace("#/");
    step = 0;
    el.innerHTML = `
      <section class="cook" style="--c1:${recipe.colors[0]};--c2:${recipe.colors[1]}">
        <header class="cook-head container">
          <a href="#/r/${recipe.id}" class="back">✕ Mbyll</a>
          <strong>${esc(recipe.emoji)} ${esc(recipe.title)}</strong>
        </header>
        <div id="cookBody" class="cook-body container"></div>
      </section>`;

    el.addEventListener("click", (e) => {
      const act = e.target.closest("button")?.dataset.act;
      if (act === "prev") go(-1);
      if (act === "next") go(1);
      if (act === "timer") startTimer(`${recipe.title} · hapi ${step + 1}`, recipe.steps[step].minutes);
      if (act === "done") {
        markCooked(recipe.id);
        location.hash = `#/r/${recipe.id}`;
      }
    });

    document.title = `Duke gatuar: ${recipe.title}`;
    render();
    keepAwake();
  },

  onKey(e) {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  },

  destroy() {
    wakeLock?.release?.().catch(() => {});
    wakeLock = null;
  },
};
