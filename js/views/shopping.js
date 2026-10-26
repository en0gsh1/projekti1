// Lista e blerjeve: shto me dorë, shëno të blerat, kopjo si tekst
import { state, update } from "../store.js";
import { $, esc, parseIngredient, ingredientLine, toast } from "../utils.js";
import { addToShopping } from "../actions.js";

let root;

function itemHtml(item) {
  return `
    <li class="item ${item.done ? "done" : ""}">
      <label class="check">
        <input type="checkbox" data-toggle="${item.id}" ${item.done ? "checked" : ""} />
        <span>${esc(ingredientLine(item))}</span>
      </label>
      ${item.from.length ? `<small class="muted from">${esc(item.from.join(", "))}</small>` : ""}
      <button class="link-btn" data-del="${item.id}" aria-label="Fshi">✕</button>
    </li>`;
}

function renderList() {
  const todo = state.shopping.filter((x) => !x.done);
  const done = state.shopping.filter((x) => x.done);
  const total = state.shopping.length;
  $("#progress", root).innerHTML = total
    ? `<div class="progress"><span style="width:${(done.length / total) * 100}%"></span></div>
       <small class="muted">${done.length} nga ${total} të blera</small>`
    : "";
  $("#todo", root).innerHTML = todo.length
    ? todo.map(itemHtml).join("")
    : `<li class="empty">${total ? "🎉 I bleve të gjitha!" : "Lista është bosh. Shto përbërës nga një recetë ose shkruaj më lart."}</li>`;
  $("#doneWrap", root).hidden = !done.length;
  $("#done", root).innerHTML = done.map(itemHtml).join("");
  $("#doneCount", root).textContent = done.length;
}

function asText() {
  const todo = state.shopping.filter((x) => !x.done);
  return "🛒 Lista e blerjeve\n" + todo.map((x) => "• " + ingredientLine(x)).join("\n");
}

export default {
  render(el) {
    root = el;
    el.innerHTML = `
      <div class="container page narrow">
        <header class="page-head">
          <div>
            <h1>🛒 Lista e blerjeve</h1>
            <p class="muted">Përbërësit e njëjtë mblidhen automatikisht (p.sh. 2 receta me qepë → një rresht).</p>
          </div>
        </header>
        <form id="addForm" class="add-form surface">
          <input id="newItem" placeholder="p.sh. 2 kg patate, 500 ml qumësht, bukë…" aria-label="Shto artikull" autocomplete="off" />
          <button class="btn" type="submit">+ Shto</button>
        </form>
        <div id="progress" class="list-progress"></div>
        <section class="surface pad">
          <ul id="todo" class="items"></ul>
          <details id="doneWrap" class="done-wrap">
            <summary>✅ Të blera (<span id="doneCount"></span>)</summary>
            <ul id="done" class="items"></ul>
          </details>
        </section>
        <div class="tools">
          <button class="btn btn-ghost" data-act="copy">📋 Kopjo si tekst</button>
          <button class="btn btn-ghost" data-act="clear-done">🧹 Fshi të blerat</button>
          <button class="btn btn-ghost danger" data-act="clear-all">🗑 Fshi të gjitha</button>
        </div>
      </div>`;

    $("#addForm", el).addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#newItem", el);
      // Mund të shtosh disa njëherësh me presje: "bukë, 1 kg sheqer"
      const items = input.value.split(",").map((s) => s.trim()).filter(Boolean).map(parseIngredient);
      if (!items.length) return;
      addToShopping(items);
      input.value = "";
      input.focus();
    });

    el.addEventListener("change", (e) => {
      const id = e.target.dataset.toggle;
      if (id) update((s) => (s.shopping.find((x) => x.id === id).done = e.target.checked));
    });

    el.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      if (btn.dataset.del) update((s) => (s.shopping = s.shopping.filter((x) => x.id !== btn.dataset.del)));
      const act = btn.dataset.act;
      if (act === "clear-done") update((s) => (s.shopping = s.shopping.filter((x) => !x.done)));
      if (act === "clear-all" && state.shopping.length && confirm("Ta fshij gjithë listën?")) update((s) => (s.shopping = []));
      if (act === "copy") {
        try {
          await navigator.clipboard.writeText(asText());
          toast("📋 Lista u kopjua – ngjite në Viber ose WhatsApp");
        } catch {
          prompt("Kopjo listën:", asText());
        }
      }
    });

    this.update();
  },

  update() {
    renderList();
  },
};
