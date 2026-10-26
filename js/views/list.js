import { CATEGORIES, DIFFICULTY } from "../data.js";
import { state, allRecipes } from "../store.js";
import { $, esc, fmtMinutes, debounce } from "../utils.js";
import { isFav, toggleFav } from "../actions.js";

// Filtrat mbeten kur kthehesh nga një recetë
const ui = { query: "", category: "all", maxTime: 0, sort: "default" };
let root;

function visible() {
  const q = ui.query.toLowerCase();
  const list = allRecipes().filter((r) => {
    if (ui.category === "fav" && !isFav(r.id)) return false;
    if (ui.category === "mine" && !r.custom) return false;
    if (CATEGORIES[ui.category] && ui.category !== "all" && r.category !== ui.category) return false;
    if (ui.maxTime && r.minutes > ui.maxTime) return false;
    if (!q) return true;
    // Kërko edhe sipas përbërësve: "spinaq", "arra"…
    return [r.title, r.description, ...r.ingredients.map((i) => i.name)].join(" ").toLowerCase().includes(q);
  });
  const sorters = {
    time: (a, b) => a.minutes - b.minutes,
    easy: (a, b) => a.difficulty - b.difficulty,
    cooked: (a, b) => (state.cooked[b.id] || 0) - (state.cooked[a.id] || 0),
    name: (a, b) => a.title.localeCompare(b.title, "sq"),
  };
  return sorters[ui.sort] ? [...list].sort(sorters[ui.sort]) : list;
}

function card(r) {
  const fav = isFav(r.id);
  const cooked = state.cooked[r.id] || 0;
  return `
    <article class="card">
      <a class="card-img" href="#/r/${r.id}" style="--c1:${r.colors[0]};--c2:${r.colors[1]}" aria-label="${esc(r.title)}">
        <span class="card-emoji">${esc(r.emoji)}</span>
        ${r.custom ? `<span class="pill pill-mine">✍️ E imja</span>` : ""}
        ${cooked ? `<span class="pill pill-cooked">👨‍🍳 ${cooked}×</span>` : ""}
      </a>
      <button class="fav" data-fav="${r.id}" aria-pressed="${fav}" title="Të preferuarat">${fav ? "❤️" : "🤍"}</button>
      <div class="card-body">
        <span class="tag">${CATEGORIES[r.category] || ""}</span>
        <h3><a href="#/r/${r.id}">${esc(r.title)}</a></h3>
        <p>${esc(r.description)}</p>
        <div class="meta">
          <span>⏱ ${fmtMinutes(r.minutes)}</span>
          <span>🍽 ${r.servings}</span>
          <span>${"●".repeat(r.difficulty)}${"○".repeat(3 - r.difficulty)} ${DIFFICULTY[r.difficulty]}</span>
        </div>
      </div>
    </article>`;
}

function renderChips() {
  const chips = { ...CATEGORIES, fav: "❤️ Të preferuarat", mine: "✍️ Të miat" };
  $("#chips", root).innerHTML = Object.entries(chips)
    .map(([k, label]) => `<button class="chip ${ui.category === k ? "active" : ""}" data-cat="${k}" aria-pressed="${ui.category === k}">${label}</button>`)
    .join("");
}

function renderGrid() {
  const list = visible();
  $("#count", root).textContent = `(${list.length})`;
  $("#grid", root).innerHTML = list.length
    ? list.map(card).join("")
    : `<div class="empty">Asnjë recetë nuk u gjet 🤷<br><a href="#/new" class="btn">✍️ Shto recetën tënde</a></div>`;
}

function surprise() {
  const pool = visible().length ? visible() : allRecipes();
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const box = $("#surprise", root);
  box.classList.remove("spin");
  void box.offsetWidth; // rinis animacionin
  box.classList.add("spin");
  setTimeout(() => (location.hash = `#/r/${pick.id}`), 650);
}

export default {
  render(el) {
    root = el;
    el.innerHTML = `
      <section class="hero">
        <div class="container hero-inner">
          <div>
            <h1>Shijet e shtëpisë kosovare</h1>
            <p>Flija e gjyshes, pite, tavë e trileçe – receta tradicionale hap pas hapi, me listë blerjesh dhe menynë e javës.</p>
            <div class="hero-cta">
              <button class="btn btn-gold" data-act="surprise">🎲 Çfarë të gatuaj sot?</button>
              <a class="btn btn-glass" href="#/new">✍️ Shto recetë</a>
            </div>
          </div>
          <div id="surprise" class="surprise" aria-hidden="true">🍲</div>
        </div>
      </section>
      <div class="container">
        <section class="toolbar surface">
          <input id="search" type="search" placeholder="Kërko recetë ose përbërës (p.sh. spinaq, arra)…" value="${esc(ui.query)}" aria-label="Kërko" />
          <select id="maxTime" aria-label="Koha">
            ${[[0, "⏱ Çdo kohë"], [30, "Deri 30 min"], [60, "Deri 1 orë"], [120, "Deri 2 orë"]]
              .map(([v, l]) => `<option value="${v}" ${ui.maxTime === v ? "selected" : ""}>${l}</option>`)
              .join("")}
          </select>
          <select id="sort" aria-label="Rendit">
            ${[["default", "Rendit: të rekomanduara"], ["time", "Më të shpejtat"], ["easy", "Më të lehtat"], ["cooked", "Më të gatuarat"], ["name", "Emri A–Z"]]
              .map(([v, l]) => `<option value="${v}" ${ui.sort === v ? "selected" : ""}>${l}</option>`)
              .join("")}
          </select>
          <div id="chips" class="chips"></div>
        </section>
        <h2 class="section-title">Recetat <span id="count" class="muted"></span></h2>
        <div id="grid" class="grid"></div>
      </div>`;

    $("#search", el).addEventListener(
      "input",
      debounce((e) => {
        ui.query = e.target.value.trim();
        renderGrid();
      })
    );
    $("#maxTime", el).addEventListener("change", (e) => {
      ui.maxTime = Number(e.target.value);
      renderGrid();
    });
    $("#sort", el).addEventListener("change", (e) => {
      ui.sort = e.target.value;
      renderGrid();
    });
    el.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.cat) {
        ui.category = btn.dataset.cat;
        renderChips();
        renderGrid();
      } else if (btn.dataset.fav) toggleFav(btn.dataset.fav);
      else if (btn.dataset.act === "surprise") surprise();
    });

    this.update();
  },

  update() {
    renderChips();
    renderGrid();
  },
};
