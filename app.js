// Calorie Counter - localStorage per date, downloadable CSV

const els = {
  date: document.getElementById("date"),
  totalIntake: document.getElementById("totalIntake"),
  totalBurn: document.getElementById("totalBurn"),
  netCalories: document.getElementById("netCalories"),
  downloadBtn: document.getElementById("downloadBtn"),
  clearDayBtn: document.getElementById("clearDayBtn"),

  mealForm: document.getElementById("mealForm"),
  mealName: document.getElementById("mealName"),
  mealCalories: document.getElementById("mealCalories"),
  mealList: document.getElementById("mealList"),
  mealCount: document.getElementById("mealCount"),

  workoutForm: document.getElementById("workoutForm"),
  workoutName: document.getElementById("workoutName"),
  workoutCalories: document.getElementById("workoutCalories"),
  workoutList: document.getElementById("workoutList"),
  workoutCount: document.getElementById("workoutCount"),
};

function todayISO() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d - tzOffset).toISOString().slice(0, 10);
}

function storageKey(dateStr) {
  return `calorie_counter:${dateStr}`;
}

function loadDay(dateStr) {
  const raw = localStorage.getItem(storageKey(dateStr));
  if (!raw) return { meals: [], workouts: [] };
  try {
    const parsed = JSON.parse(raw);
    return {
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      workouts: Array.isArray(parsed.workouts) ? parsed.workouts : [],
    };
  } catch {
    return { meals: [], workouts: [] };
  }
}

function saveDay(dateStr, data) {
  localStorage.setItem(storageKey(dateStr), JSON.stringify(data));
}

function sumCalories(items) {
  return items.reduce((acc, it) => acc + (Number(it.calories) || 0), 0);
}

function fmtNum(n) {
  const x = Number(n) || 0;
  return String(Math.round(x));
}

function render() {
  const dateStr = els.date.value;
  const data = loadDay(dateStr);

  // totals
  const intake = sumCalories(data.meals);
  const burn = sumCalories(data.workouts);
  const net = intake - burn;

  els.totalIntake.textContent = fmtNum(intake);
  els.totalBurn.textContent = fmtNum(burn);
  els.netCalories.textContent = fmtNum(net);

  // lists
  els.mealList.innerHTML = "";
  els.workoutList.innerHTML = "";

  data.meals.forEach((m) => {
    els.mealList.appendChild(renderItem("meal", m));
  });
  data.workouts.forEach((w) => {
    els.workoutList.appendChild(renderItem("workout", w));
  });

  els.mealCount.textContent = `${data.meals.length} item${data.meals.length === 1 ? "" : "s"}`;
  els.workoutCount.textContent = `${data.workouts.length} item${data.workouts.length === 1 ? "" : "s"}`;
}

function renderItem(type, item) {
  const li = document.createElement("li");
  li.className = "item";

  const left = document.createElement("div");
  left.className = "meta";

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = item.name;

  const cal = document.createElement("div");
  cal.className = "cal";
  cal.textContent =
    type === "meal"
      ? `${fmtNum(item.calories)} kcal`
      : `${fmtNum(item.calories)} kcal burned`;

  left.appendChild(name);
  left.appendChild(cal);

  const right = document.createElement("div");
  right.className = "right";

  const del = document.createElement("button");
  del.className = "iconBtn danger";
  del.type = "button";
  del.textContent = "Delete";
  del.addEventListener("click", () => {
    const dateStr = els.date.value;
    const data = loadDay(dateStr);
    if (type === "meal") data.meals = data.meals.filter((x) => x.id !== item.id);
    else data.workouts = data.workouts.filter((x) => x.id !== item.id);
    saveDay(dateStr, data);
    render();
  });

  right.appendChild(del);

  li.appendChild(left);
  li.appendChild(right);
  return li;
}

function uid() {
  // simple unique id
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function escapeCSV(value) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCSV() {
  const dateStr = els.date.value;
  const data = loadDay(dateStr);

  const rows = [];
  rows.push(["date", "type", "name", "calories"].map(escapeCSV).join(","));

  data.meals.forEach((m) => {
    rows.push([dateStr, "meal", m.name, fmtNum(m.calories)].map(escapeCSV).join(","));
  });

  data.workouts.forEach((w) => {
    rows.push([dateStr, "workout", w.name, fmtNum(w.calories)].map(escapeCSV).join(","));
  });

  // totals row
  const intake = sumCalories(data.meals);
  const burn = sumCalories(data.workouts);
  const net = intake - burn;
  rows.push([dateStr, "total", "intake", fmtNum(intake)].map(escapeCSV).join(","));
  rows.push([dateStr, "total", "burn", fmtNum(burn)].map(escapeCSV).join(","));
  rows.push([dateStr, "total", "net", fmtNum(net)].map(escapeCSV).join(","));

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `calorie-log_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function clearDay() {
  const dateStr = els.date.value;
  localStorage.removeItem(storageKey(dateStr));
  render();
}

// init
els.date.value = todayISO();
render();

els.date.addEventListener("change", render);

els.mealForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = els.mealName.value.trim();
  const calories = Number(els.mealCalories.value);
  if (!name || !Number.isFinite(calories) || calories < 0) return;

  const dateStr = els.date.value;
  const data = loadDay(dateStr);
  data.meals.push({ id: uid(), name, calories });

  saveDay(dateStr, data);
  els.mealName.value = "";
  els.mealCalories.value = "";
  render();
});

els.workoutForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = els.workoutName.value.trim();
  const calories = Number(els.workoutCalories.value);
  if (!name || !Number.isFinite(calories) || calories < 0) return;

  const dateStr = els.date.value;
  const data = loadDay(dateStr);
  data.workouts.push({ id: uid(), name, calories });

  saveDay(dateStr, data);
  els.workoutName.value = "";
  els.workoutCalories.value = "";
  render();
});

els.downloadBtn.addEventListener("click", downloadCSV);
els.clearDayBtn.addEventListener("click", clearDay);
