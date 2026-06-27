const KEY = "life-organiser-v5";
const SETTINGS_KEY = "life-organiser-settings-v5";
const TRACKER_KEY = "life-organiser-trackers-v5";

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

const salahList = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const habitList = [
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

let items = JSON.parse(localStorage.getItem(KEY) || "null") || [];
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null") || {};
let trackers = JSON.parse(localStorage.getItem(TRACKER_KEY) || "null") || {};

let calendarDate = new Date();
let selectedDate = new Date();

const $ = selector => document.querySelector(selector);

function save() {
  localStorage.setItem(KEY, JSON.stringify(items));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  localStorage.setItem(TRACKER_KEY, JSON.stringify(trackers));
}

function todayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function todayKey() {
  return todayStart().toISOString().slice(0, 10);
}

function isoDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function sameDay(a, b) {
  return isoDay(a) === isoDay(b);
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function formatDate(date) {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

function isOverdue(item) {
  return item.date && !item.done && new Date(item.date) < new Date();
}

function isDueToday(item) {
  return item.date && sameDay(item.date, new Date());
}

function isDueThisWeek(item) {
  if (!item.date) return false;
  const start = todayStart();
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const due = new Date(item.date);
  return due >= start && due <= end;
}

function isDueTomorrow(item) {
  if (!item.date) return false;
  const tomorrow = todayStart();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return sameDay(item.date, tomorrow);
}

function isDueThisMonth(item) {
  if (!item.date) return false;
  const due = new Date(item.date);
  const now = new Date();
  return due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear();
}

function priorityRank(priority) {
  return {
    Urgent: 0,
    High: 1,
    Medium: 2,
    Low: 3
  }[priority] ?? 4;
}

function priorityClass(priority) {
  return String(priority || "Medium").toLowerCase();
}

function setOptions(element, list, includeAll = true, allText = "All") {
  if (!element) return;
  element.innerHTML = (includeAll ? [allText, ...list] : list)
    .map(item => `<option>${escapeHtml(item)}</option>`)
    .join("");
}

function setupCategories() {
  const area = $("#area");
  const category = $("#category");
  if (area && category) {
    setOptions(category, area.value === "Work" ? workCats : personalCats, false);
  }
  updateFilterCategories();
}

function updateFilterCategories() {
  const areaFilter = $("#areaFilter");
  const categoryFilter = $("#categoryFilter");
  if (!areaFilter || !categoryFilter) return;

  let categories = [...workCats, ...personalCats];

  if (areaFilter.value === "Work") categories = workCats;
  if (areaFilter.value === "Personal") categories = personalCats;

  const previous = categoryFilter.value;
  setOptions(categoryFilter, categories, true, "All Categories");

  if ([...categoryFilter.options].some(option => option.value === previous)) {
    categoryFilter.value = previous;
  }
}

function show(view) {
  document.querySelectorAll(".tabs button").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  document.querySelectorAll(".view").forEach(section => {
    section.classList.toggle("active", section.id === view);
  });

  render();
}

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
  const salahBox = $("#salahBox");
  const habitBox = $("#habitBox");

  if (!salahBox || !habitBox) return;

  salahBox.innerHTML = salahList.map(name => `
    <div class="tracker ${trackerDone(name) ? "done" : ""}">
      <strong>${escapeHtml(name)}</strong>
      <button onclick="toggleTracker('${escapeHtml(name)}')">
        ${trackerDone(name) ? "✓ Done" : "Tick"}
      </button>
    </div>
  `).join("");

  habitBox.innerHTML = habitList.map(name => `
    <div class="tracker ${trackerDone(name) ? "done" : ""}">
      <strong>${escapeHtml(name)}</strong>
      <button onclick="toggleTracker('${escapeHtml(name)}')">
        ${trackerDone(name) ? "✓ Done" : "Tick"}
      </button>
    </div>
  `).join("");
}

function itemCard(item) {
  const li = document.createElement("li");
  li.className = `item ${item.done ? "done" : ""}`;

  li.innerHTML = `
    <div class="row">
      <div>
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="meta">
          ${escapeHtml(item.area)} • ${escapeHtml(item.category)} • ${formatDate(item.date)}
        </div>
      </div>
      <span class="badge ${priorityClass(item.priority)}">${escapeHtml(item.priority || "Medium")}</span>
    </div>

    <div class="meta">
      Status: ${escapeHtml(item.status || "Not started")} • Reminder: ${escapeHtml(item.reminder || "No reminder")}
    </div>

    ${item.notes ? `<div>${escapeHtml(item.notes)}</div>` : ""}

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
    if (!confirm("Delete this item?")) return;
    items = items.filter(existing => existing.id !== item.id);
    save();
    render();
  };

  return li;
}

function fillList(element, list) {
  if (!element) return;

  element.innerHTML = "";

  if (!list.length) {
    element.innerHTML = `<li class="item">Nothing here yet.</li>`;
    return;
  }

  list
    .sort((a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      (a.date ? new Date(a.date) : Infinity) -
      (b.date ? new Date(b.date) : Infinity)
    )
    .forEach(item => element.appendChild(itemCard(item)));
}

function overview(area, categories) {
  return categories.map(category => `
    <span class="chip">
      ${escapeHtml(category)}: ${
        items.filter(item =>
          item.area === area &&
          item.category === category &&
          !item.done
        ).length
      }
    </span>
  `).join("");
}

function filteredTasks() {
  const searchBox = $("#searchBox");
  const areaFilter = $("#areaFilter");
  const categoryFilter = $("#categoryFilter");
  const priorityFilter = $("#priorityFilter");
  const statusFilter = $("#statusFilter");
  const dateFilter = $("#dateFilter");

  const query = searchBox ? searchBox.value.trim().toLowerCase() : "";
  const area = areaFilter ? areaFilter.value : "All Areas";
  const category = categoryFilter ? categoryFilter.value : "All Categories";
  const priority = priorityFilter ? priorityFilter.value : "All Priorities";
  const status = statusFilter ? statusFilter.value : "Active";
  const date = dateFilter ? dateFilter.value : "Any Date";

  return items.filter(item => {
    const searchable = `${item.title} ${item.notes} ${item.category}`.toLowerCase();

    if (query && !searchable.includes(query)) return false;
    if (area !== "All Areas" && item.area !== area) return false;
    if (category !== "All Categories" && item.category !== category) return false;
    if (priority !== "All Priorities" && item.priority !== priority) return false;

    if (status === "Active" && item.done) return false;
    if (status === "Overdue" && !isOverdue(item)) return false;
    if (
      status !== "Active" &&
      status !== "All Statuses" &&
      status !== "Overdue" &&
      item.status !== status
    ) return false;

    if (date === "Today" && !isDueToday(item)) return false;
    if (date === "Tomorrow" && !isDueTomorrow(item)) return false;
    if (date === "This Week" && !isDueThisWeek(item)) return false;
    if (date === "This Month" && !isDueThisMonth(item)) return false;
    if (date === "Overdue" && !isOverdue(item)) return false;
    if (date === "No Date" && item.date) return false;

    return true;
  });
}

function renderCalendar() {
  const grid = $("#monthGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const month = calendarDate.getMonth();
  const year = calendarDate.getFullYear();

  const monthTitle = $("#monthTitle");
  if (monthTitle) {
    monthTitle.textContent = new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric"
    }).format(calendarDate);
  }

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  let startOffset = first.getDay() - 1;
  if (startOffset < 0) startOffset = 6;

  for (let i = 0; i < startOffset; i++) {
    const empty = document.createElement("button");
    empty.className = "day empty";
    empty.disabled = true;
    grid.appendChild(empty);
  }

  for (let day = 1; day <= last.getDate(); day++) {
    const date = new Date(year, month, day);
    const button = document.createElement("button");
    button.className = "day";

    if (sameDay(date, new Date())) button.classList.add("today");
    if (sameDay(date, selectedDate)) button.classList.add("selected");

    const dayItems = items.filter(item => item.date && sameDay(item.date, date));

    const dots = dayItems.slice(0, 5).map(item =>
      `<span class="dot ${priorityClass(item.priority)}"></span>`
    ).join("");

    button.innerHTML = `
      <div class="day-num">${day}</div>
      <div class="dots">${dots}</div>
    `;

    button.onclick = () => {
      selectedDate = date;
      render();
    };

    grid.appendChild(button);
  }

  const selectedTitle = $("#selectedDayTitle");
  if (selectedTitle) {
    selectedTitle.textContent = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(selectedDate);
  }

  fillList(
    $("#selectedDayList"),
    items.filter(item => item.date && sameDay(item.date, selectedDate))
  );

  const start = todayStart();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  fillList(
    $("#upcomingList"),
    items
      .filter(item =>
        item.date &&
        !item.done &&
        new Date(item.date) >= start &&
        new Date(item.date) <= end
      )
      .slice(0, 10)
  );
}

function render() {
  renderTrackers();

  const active = items.filter(item => !item.done);
  const dueToday = active.filter(isDueToday);
  const dueThisWeek = active.filter(isDueThisWeek);
  const overdue = items.filter(isOverdue);

  if ($("#activeCount")) $("#activeCount").textContent = active.length;
  if ($("#todayCount")) $("#todayCount").textContent = dueToday.length;
  if ($("#weekCount")) $("#weekCount").textContent = dueThisWeek.length;
  if ($("#overdueCount")) $("#overdueCount").textContent = overdue.length;

  fillList(
    $("#focusList"),
    active.filter(item =>
      isOverdue(item) ||
      isDueToday(item) ||
      item.priority === "Urgent" ||
      item.priority === "High"
    ).slice(0, 10)
  );

  if ($("#workOverview")) $("#workOverview").innerHTML = overview("Work", workCats);
  if ($("#personalOverview")) $("#personalOverview").innerHTML = overview("Personal", personalCats);

  fillList($("#taskList"), filteredTasks());

  renderCalendar();
}

function reminderTime(item) {
  if (!item.date || !item.reminder || item.reminder === "No reminder") return null;

  const date = new Date(item.date);

  if (item.reminder === "15 minutes before") date.setMinutes(date.getMinutes() - 15);
  if (item.reminder === "1 hour before") date.setHours(date.getHours() - 1);
  if (item.reminder === "1 day before") date.setDate(date.getDate() - 1);

  return date;
}

setInterval(() => {
  if (!settings.notifications || Notification.permission !== "granted") return;

  const now = new Date();
  let changed = false;

  items.forEach(item => {
    const reminder = reminderTime(item);

    if (!reminder || item.done || item.notified) return;

    if (now >= reminder) {
      new Notification(item.title, {
        body: `${item.category} • Due: ${formatDate(item.date)}`
      });

      item.notified = true;
      changed = true;
    }
  });

  if (changed) save();
}, 60000);

document.addEventListener("DOMContentLoaded", () => {
  setupCategories();

  document.querySelectorAll(".tabs button").forEach(button => {
    button.onclick = () => show(button.dataset.view);
  });

  if ($("#area")) $("#area").addEventListener("change", setupCategories);

  if ($("#areaFilter")) {
    $("#areaFilter").addEventListener("change", () => {
      updateFilterCategories();
      render();
    });
  }

  ["searchBox", "categoryFilter", "priorityFilter", "statusFilter", "dateFilter"].forEach(id => {
    const element = $("#" + id);
    if (!element) return;
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });

  if ($("#prevMonth")) {
    $("#prevMonth").onclick = () => {
      calendarDate.setMonth(calendarDate.getMonth() - 1);
      render();
    };
  }

  if ($("#nextMonth")) {
    $("#nextMonth").onclick = () => {
      calendarDate.setMonth(calendarDate.getMonth() + 1);
      render();
    };
  }

  if ($("#itemForm")) {
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
        reminder: $("#reminder").value,
        notes: $("#notes").value.trim(),
        done: status === "Complete",
        doneAt: status === "Complete" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        notified: false
      });

      save();
      event.target.reset();
      setupCategories();
      show("home");
    };
  }

  if ($("#enableNotifications")) {
    $("#enableNotifications").onclick = async () => {
      if (!("Notification" in window)) {
        alert("Notifications are not supported in this browser.");
        return;
      }

      const permission = await Notification.requestPermission();
      settings.notifications = permission === "granted";
      save();

      if (permission === "granted") {
        new Notification("Life Organiser notifications enabled", {
          body: "Reminder notifications are now enabled."
        });
      }
    };
  }

  if ($("#exportBackup")) {
    $("#exportBackup").onclick = () => {
      const backup = {
        version: 5,
        exportedAt: new Date().toISOString(),
        items,
        settings,
        trackers
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `life-organiser-backup-${todayKey()}.json`;
      link.click();

      URL.revokeObjectURL(url);
    };
  }

  if ($("#importBackup")) {
    $("#importBackup").onchange = async event => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (!Array.isArray(backup.items)) throw new Error("Invalid backup");

        if (!confirm("Import backup and replace current data?")) return;

        items = backup.items;
        settings = backup.settings || {};
        trackers = backup.trackers || {};

        save();
        render();
        alert("Backup imported.");
      } catch {
        alert("Could not import this backup file.");
      }
    };
  }

  if ($("#clearCompleted")) {
    $("#clearCompleted").onclick = () => {
      if (!confirm("Clear all completed items?")) return;
      items = items.filter(item => !item.done);
      save();
      render();
    };
  }

  if ($("#resetApp")) {
    $("#resetApp").onclick = () => {
      if (!confirm("Reset the app and delete all data?")) return;
      items = [];
      trackers = {};
      settings = {};
      save();
      render();
    };
  }

  let deferredPrompt;

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    if ($("#installBtn")) $("#installBtn").classList.remove("hidden");
  });

  if ($("#installBtn")) {
    $("#installBtn").onclick = async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      $("#installBtn").classList.add("hidden");
    };
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  render();
});
