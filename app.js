const KEY = "life-organiser-v4";
const TRACKER_KEY = "life-organiser-trackers-v4";

const workCats = [
  "PMOS",
  "MHRA Alert",
  "CQC Safety Alert",
  "Practice Audit",
  "Diabetes Management",
  "Medication Query",
  "Follow-up Review",
  "Care Home Query",
  "Medication Review",
  "A&G"
];

const personalCats = [
  "Salah",
  "Hydration",
  "Cooking",
  "Reciting Quran",
  "Memorising Surahs",
  "Appointments",
  "Life Admin",
  "Bills to Pay",
  "Exercise",
  "Steps",
  "Reading with Haaris",
  "Learning with Haaris",
  "Nursery Drop Off",
  "Cleaning"
];

let items = JSON.parse(localStorage.getItem(KEY) || "null") || seedItems();
let trackers = JSON.parse(localStorage.getItem(TRACKER_KEY) || "null") || {};

const $ = s => document.querySelector(s);

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(items));
  localStorage.setItem(TRACKER_KEY, JSON.stringify(trackers));
}

function seedItems() {
  return [
    {
      id: crypto.randomUUID(),
      area: "Work",
      category: "Medication Query",
      title: "Triage medication queries",
      date: "",
      priority: "High",
      status: "Not started",
      notes: "Add queries without patient-identifiable information.",
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString()
    }
  ];
}

function esc(text) {
  return String(text).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

function fmt(date) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function dueSoon(item) {
  if (!item.date || item.done) return false;
  const now = new Date();
  const due = new Date(item.date);
  return due - now < 1000 * 60 * 60 * 24 * 7 && due >= now;
}

function todayDone(item) {
  return item.doneAt && item.doneAt.slice(0, 10) === todayKey();
}

function setOptions(element, list, includeAll = true) {
  element.innerHTML = (includeAll ? ["All", ...list] : list)
    .map(item => `<option>${item}</option>`)
    .join("");
}

setOptions($("#workFilter"), workCats);
setOptions($("#personalFilter"), personalCats);

function updateCats() {
  setOptions(
    $("#category"),
    $("#area").value === "Work" ? workCats : personalCats,
    false
  );
}

$("#area").addEventListener("change", updateCats);
updateCats();

document.querySelectorAll(".tabs button").forEach(button => {
  button.onclick = () => show(button.dataset.view);
});

function show(view) {
  document.querySelectorAll(".tabs button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle("active", section.id === view);
  });

  render();
}

$("#itemForm").onsubmit = event => {
  event.preventDefault();

  const status = $("#status").value;

  items.unshift({
    id: crypto.randomUUID(),
    area: $("#area").value,
    category: $("#category").value,
    title: $("#title").value.trim(),
    date: $("#date").value,
    priority: $("#priority").value,
    status,
    notes: $("#notes").value.trim(),
    done: status === "Complete",
    doneAt: status === "Complete" ? new Date().toISOString() : null,
    createdAt: new Date().toISOString()
  });

  save();
  event.target.reset();
  updateCats();
  show("home");
};

function trackerDone(name) {
  return trackers[todayKey() + "-" + name] === true;
}

function toggleTracker(name) {
  trackers[todayKey() + "-" + name] = !trackerDone(name);
  save();
  render();
}

window.toggleTracker = toggleTracker;

function renderTrackers() {
  const salah = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  $("#salahBox").innerHTML = salah.map(name => `
    <div class="tracker ${trackerDone(name) ? "done" : ""}">
      <strong>${name}</strong>
      <button onclick="toggleTracker('${name}')">
        ${trackerDone(name) ? "Done" : "Tick"}
      </button>
    </div>
  `).join("");

  const habits = [
    "Hydration",
    "Exercise",
    "Steps",
    "Cooking",
    "Reciting Quran",
    "Memorising Surahs",
    "Reading with Haaris",
    "Learning with Haaris",
    "Cleaning"
  ];

  $("#habitBox").innerHTML = habits.map(name => `
    <div class="tracker ${trackerDone(name) ? "done" : ""}">
      <strong>${name}</strong>
      <button onclick="toggleTracker('${name}')">
        ${trackerDone(name) ? "Done" : "Tick"}
      </button>
    </div>
  `).join("");

  $("#salahScore").textContent = `${salah.filter(trackerDone).length}/5`;
}

function itemCard(item) {
  const li = document.createElement("li");
  li.className = `item ${item.done ? "done" : ""}`;

  li.innerHTML = `
    <div class="row">
      <div>
        <div class="title">${esc(item.title)}</div>
        <div class="meta">
          ${esc(item.area)} • ${esc(item.category)} • ${fmt(item.date)}
        </div>
      </div>
      <span class="badge ${item.priority === "High" ? "high" : ""}">
        ${esc(item.priority === "High" ? "High" : item.status)}
      </span>
    </div>
    ${item.notes ? `<div>${esc(item.notes)}</div>` : ""}
    <div class="actions">
      <button class="donebtn">${item.done ? "Mark active" : "Done"}</button>
      <button class="delete">Delete</button>
    </div>
  `;

  li.querySelector(".donebtn").onclick = () => {
    items = items.map(existing =>
      existing.id === item.id
        ? {
            ...existing,
            done: !existing.done,
            status: !existing.done ? "Complete" : "Not started",
            doneAt: !existing.done ? new Date().toISOString() : null
          }
        : existing
    );
    save();
    render();
  };

  li.querySelector(".delete").onclick = () => {
    items = items.filter(existing => existing.id !== item.id);
    save();
    render();
  };

  return li;
}

function fillList(element, list) {
  element.innerHTML = "";

  if (!list.length) {
    element.innerHTML = `<li class="item">Nothing here yet.</li>`;
    return;
  }

  list
    .sort((a, b) =>
      (b.priority === "High") - (a.priority === "High") ||
      (a.date ? new Date(a.date) : Infinity) -
      (b.date ? new Date(b.date) : Infinity)
    )
    .forEach(item => element.appendChild(itemCard(item)));
}

function overview() {
  $("#workOverview").innerHTML = workCats.map(category => `
    <span class="chip">
      ${category}: ${items.filter(item =>
        item.area === "Work" &&
        item.category === category &&
        !item.done
      ).length}
    </span>
  `).join("");
}

function renderCalendar() {
  const calendar = $("#calendarList");
  calendar.innerHTML = "";

  const datedItems = items
    .filter(item => item.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!datedItems.length) {
    calendar.innerHTML = `
      <li class="item">
        No calendar items yet. Add a date/time to an item and it will show here.
      </li>
    `;
    return;
  }

  datedItems.forEach(item => calendar.appendChild(itemCard(item)));
}

function render() {
  renderTrackers();

  $("#activeCount").textContent = items.filter(item => !item.done).length;
  $("#dueSoonCount").textContent = items.filter(dueSoon).length;
  $("#doneTodayCount").textContent = items.filter(todayDone).length;

  fillList(
    $("#focusList"),
    items.filter(item => !item.done && (item.priority === "High" || dueSoon(item))).slice(0, 10)
  );

  overview();

  const workFilter = $("#workFilter").value;
  fillList(
    $("#workList"),
    items.filter(item =>
      item.area === "Work" &&
      (workFilter === "All" || item.category === workFilter)
    )
  );

  const personalFilter = $("#personalFilter").value;
  fillList(
    $("#personalList"),
    items.filter(item =>
      item.area === "Personal" &&
      (personalFilter === "All" || item.category === personalFilter)
    )
  );

  renderCalendar();
}

$("#workFilter").addEventListener("change", render);
$("#personalFilter").addEventListener("change", render);

$("#enableNotifications").onclick = async () => {
  if (!("Notification" in window)) {
    alert("Notifications are not supported in this browser.");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    new Notification("Life Organiser reminders enabled", {
      body: "Reminders are enabled for this device."
    });
  }
};

let deferredPrompt;

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  $("#installBtn").classList.remove("hidden");
});

$("#installBtn").onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("#installBtn").classList.add("hidden");
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

render();
