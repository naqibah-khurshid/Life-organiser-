const STORAGE_KEY = "life-organiser-items-v1";

const form = document.querySelector("#itemForm");
const titleInput = document.querySelector("#title");
const categoryInput = document.querySelector("#category");
const dateInput = document.querySelector("#date");
const notesInput = document.querySelector("#notes");
const list = document.querySelector("#itemList");
const filter = document.querySelector("#filter");
const summary = document.querySelector("#summary");
const installBtn = document.querySelector("#installBtn");

let deferredPrompt;
let items = loadItems();

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [
    {
      id: crypto.randomUUID(),
      title: "Plan tomorrow",
      category: "Routine",
      date: "",
      notes: "Review tasks before bed.",
      done: false,
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      title: "Drink water",
      category: "Habit",
      date: "",
      notes: "Track daily.",
      done: false,
      createdAt: new Date().toISOString()
    }
  ];
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatDate(value) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderSummary() {
  const total = items.length;
  const done = items.filter(item => item.done).length;
  const remaining = total - done;
  const habits = items.filter(item => item.category === "Habit").length;
  const dates = items.filter(item => item.category === "Important Date").length;

  summary.innerHTML = `
    <span class="pill">${total} total</span>
    <span class="pill">${remaining} active</span>
    <span class="pill">${done} done</span>
    <span class="pill">${habits} habits</span>
    <span class="pill">${dates} dates</span>
  `;
}

function renderItems() {
  const selected = filter.value;

  const visibleItems = items
    .filter(item => {
      if (selected === "All") return true;
      if (selected === "Done") return item.done;
      return item.category === selected;
    })
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });

  list.innerHTML = "";

  if (visibleItems.length === 0) {
    list.innerHTML = `<li class="item">Nothing here yet.</li>`;
    return;
  }

  for (const item of visibleItems) {
    const li = document.createElement("li");
    li.className = `item ${item.done ? "done" : ""}`;

    li.innerHTML = `
      <div class="item-top">
        <div>
          <div class="item-title">${escapeHtml(item.title)}</div>
          <div class="item-meta">${escapeHtml(item.category)} • ${formatDate(item.date)}</div>
        </div>
      </div>
      ${item.notes ? `<div>${escapeHtml(item.notes)}</div>` : ""}
      <div class="item-actions">
        <button class="complete">${item.done ? "Mark active" : "Mark done"}</button>
        <button class="delete">Delete</button>
      </div>
    `;

    li.querySelector(".complete").addEventListener("click", () => {
      items = items.map(existing =>
        existing.id === item.id ? { ...existing, done: !existing.done } : existing
      );
      saveItems();
      render();
    });

    li.querySelector(".delete").addEventListener("click", () => {
      items = items.filter(existing => existing.id !== item.id);
      saveItems();
      render();
    });

    list.appendChild(li);
  }
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}

function render() {
  renderSummary();
  renderItems();
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const newItem = {
    id: crypto.randomUUID(),
    title: titleInput.value.trim(),
    category: categoryInput.value,
    date: dateInput.value,
    notes: notesInput.value.trim(),
    done: false,
    createdAt: new Date().toISOString()
  };

  items = [newItem, ...items];
  saveItems();
  form.reset();
  render();
});

filter.addEventListener("change", render);

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

render();
