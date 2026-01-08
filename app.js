/* Contest Prep Tracker - Offline PWA (localStorage)
   Full UI: training + cardio + steps + water + sleep + notes
*/
const KEY_ENTRIES = "cpt.entries.v3";
const KEY_SETTINGS = "cpt.settings.v3";

const $ = (id) => document.getElementById(id);

function todayISO(){
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off*60*1000);
  return local.toISOString().slice(0,10);
}

function loadEntries(){ try { return JSON.parse(localStorage.getItem(KEY_ENTRIES)) || {}; } catch { return {}; } }
function saveEntries(obj){ localStorage.setItem(KEY_ENTRIES, JSON.stringify(obj)); }

function loadSettings(){ try { return JSON.parse(localStorage.getItem(KEY_SETTINGS)) || {}; } catch { return {}; } }
function saveSettings(obj){ localStorage.setItem(KEY_SETTINGS, JSON.stringify(obj)); }

function daysBetween(aISO, bISO){
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.floor((b - a) / 86400000);
}

function weekForDate(iso){
  const s = loadSettings();
  const start = s.startDate || "2026-01-12";
  const diff = daysBetween(start, iso);
  if(diff < 0) return null;
  const wk = Math.floor(diff / 7) + 1;
  if(wk > 12) return null;
  return wk;
}

function focusForDate(iso){
  const s = loadSettings();
  const start = s.startDate || "2026-01-12";
  const diff = daysBetween(start, iso);
  const idx = ((diff % 7) + 7) % 7;
  const pattern = [
    "Legs + Shoulders (Heavy)",
    "Chest + Back",
    "Rest / Recovery",
    "Legs + Shoulders (Volume)",
    "Arms + Delts",
    "Cardio / Posing",
    "Rest / Recovery"
  ];
  return pattern[idx];
}

function setStatus(msg){
  $("status").textContent = msg;
  setTimeout(()=> $("status").textContent = "", 2200);
}

function setWeekPill(iso){
  const wk = weekForDate(iso);
  $("weekPill").textContent = wk ? `Week ${wk} / 12` : "Week —";
}

function getForm(){
  return {
    date: $("date").value,
    planned: $("planned").value,
    trainingDone: $("trainingDone").value,
    cardio: $("cardio").value,
    steps: $("steps").value,
    water: $("water").value,
    sleep: $("sleep").value,
    weight: $("weight").value,
    energy: $("energy").value,
    notes: $("notes").value.trim()
  };
}

function setForm(e){
  $("date").value = e.date || todayISO();
  setWeekPill($("date").value);
  $("planned").value = e.planned || focusForDate($("date").value);
  $("trainingDone").value = e.trainingDone || "";
  $("cardio").value = e.cardio ?? "";
  $("steps").value = e.steps ?? "";
  $("water").value = e.water ?? "";
  $("sleep").value = e.sleep ?? "";
  $("weight").value = e.weight ?? "";
  $("energy").value = e.energy ?? "";
  $("notes").value = e.notes ?? "";
}

let currentFilter = "12";

function renderTable(filter="12"){
  currentFilter = filter;
  const entries = loadEntries();
  const q = $("search").value.trim().toLowerCase();
  const keys = Object.keys(entries).sort((a,b)=> b.localeCompare(a));
  const tbody = $("tbody");
  tbody.innerHTML = "";

  const s = loadSettings();
  const start = s.startDate || "2026-01-12";
  const end12 = new Date(start + "T00:00:00");
  end12.setDate(end12.getDate() + 12*7 - 1);
  const end12ISO = new Date(end12.getTime() - end12.getTimezoneOffset()*60000).toISOString().slice(0,10);

  const now = new Date();
  const weekStart = new Date(now);
  const day = weekStart.getDay() || 7;
  weekStart.setDate(weekStart.getDate() - day + 1);
  weekStart.setHours(0,0,0,0);
  const weekStartISO = new Date(weekStart.getTime() - weekStart.getTimezoneOffset()*60000).toISOString().slice(0,10);

  const rows = keys
    .filter(k => {
      if(filter==="week") return k >= weekStartISO;
      if(filter==="12") return (k >= start && k <= end12ISO);
      return true;
    })
    .map(k => ({...entries[k], date:k}))
    .filter(e => {
      if(!q) return true;
      return (e.notes||"").toLowerCase().includes(q) || (e.planned||"").toLowerCase().includes(q);
    });

  for(const e of rows){
    const tr = document.createElement("tr");
    const pill = (val) => {
      if(val==="Y") return '<span class="pill y">Y</span>';
      if(val==="N") return '<span class="pill n">N</span>';
      return '<span class="pill">—</span>';
    };
    const wk = weekForDate(e.date);
    tr.innerHTML = `
      <td>${e.date}</td>
      <td>${wk ?? ""}</td>
      <td>${e.planned || ""}</td>
      <td>${pill(e.trainingDone||"")}</td>
      <td>${e.cardio || ""}</td>
      <td>${e.steps || ""}</td>
      <td>${e.water || ""}</td>
      <td>${e.sleep || ""}</td>
      <td>${e.weight || ""}</td>
      <td>${e.energy || ""}</td>
      <td class="smalltxt">${(e.notes||"").replaceAll("<","&lt;")}</td>
      <td><button class="linkbtn" data-edit="${e.date}">Edit</button></td>
    `;
    tbody.appendChild(tr);
  }

  tbody.querySelectorAll("button[data-edit]").forEach(btn=>{
    btn.addEventListener("click", () => {
      const iso = btn.getAttribute("data-edit");
      const entries = loadEntries();
      setForm({date: iso, ...entries[iso]});
      window.scrollTo({top:0, behavior:"smooth"});
    });
  });
}

function applyAutoSuggest(){
  const s = loadSettings();
  if((s.autoSuggest || "on") === "off") return;
  const iso = $("date").value || todayISO();
  $("planned").value = focusForDate(iso);
}

function saveCurrent(){
  const e = getForm();
  if(!e.date){ setStatus("Pick a date."); return; }
  const entries = loadEntries();
  entries[e.date] = {
    planned: e.planned,
    trainingDone: e.trainingDone,
    cardio: e.cardio,
    steps: e.steps,
    water: e.water,
    sleep: e.sleep,
    weight: e.weight,
    energy: e.energy,
    notes: e.notes
  };
  saveEntries(entries);
  setStatus("Saved.");
  renderTable(currentFilter);
}

function clearDay(){
  const iso = $("date").value;
  if(!iso) return;
  const entries = loadEntries();
  delete entries[iso];
  saveEntries(entries);
  setForm({date: iso, planned: focusForDate(iso)});
  setStatus("Cleared.");
  renderTable(currentFilter);
}

// CSV helpers
function splitCSVLine(line){
  const res = [];
  let cur = "", inQ = false;
  for(let i=0;i<line.length;i++){ 
    const ch = line[i];
    if(inQ){
      if(ch === '"'){
        if(line[i+1] === '"'){ cur += '"'; i++; }
        else inQ = false;
      } else cur += ch;
    } else {
      if(ch === '"') inQ = true;
      else if(ch === ','){ res.push(cur); cur=""; }
      else cur += ch;
    }
  }
  res.push(cur);
  return res;
}

function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  if(lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]);
  const out = [];
  for(let i=1;i<lines.length;i++){ 
    const values = splitCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => obj[h] = values[idx] ?? "");
    out.push(obj);
  }
  return out;
}

function toCSV(rows){
  const cols = ["date","planned","trainingDone","cardio","steps","water","sleep","weight","energy","notes"];
  const esc = (v) => {
    v = (v ?? "").toString();
    if(v.includes('"') || v.includes(",") || v.includes("\n")) return '"' + v.replaceAll('"','""') + '"';
    return v;
  };
  const lines = [cols.join(",")];
  for(const r of rows) lines.push(cols.map(c => esc(r[c])).join(","));
  return lines.join("\n");
}

function download(filename, text){
  const blob = new Blob([text], {type:"text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function exportCSV(){
  const entries = loadEntries();
  const rows = Object.keys(entries).sort().map(date => ({date, ...entries[date]}));
  download("contest-prep-tracker.csv", toCSV(rows));
}

function importCSV(file){
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCSV(reader.result);
    const entries = loadEntries();
    for(const r of rows){
      if(!r.date) continue;
      entries[r.date] = {
        planned: r.planned || focusForDate(r.date),
        trainingDone: r.trainingDone || "",
        cardio: r.cardio || "",
        steps: r.steps || "",
        water: r.water || "",
        sleep: r.sleep || "",
        weight: r.weight || "",
        energy: r.energy || "",
        notes: r.notes || ""
      };
    }
    saveEntries(entries);
    setStatus("Imported.");
    renderTable(currentFilter);
  };
  reader.readAsText(file);
}

// Settings dialog
function openSettings(){
  const s = loadSettings();
  $("startDate").value = s.startDate || "2026-01-12";
  $("autoSuggest").value = s.autoSuggest || "on";
  $("settingsDialog").showModal();
}

function saveSettingsClick(){
  const s = {
    startDate: $("startDate").value || "2026-01-12",
    autoSuggest: $("autoSuggest").value || "on"
  };
  saveSettings(s);
  applyAutoSuggest();
  setWeekPill($("date").value);
  setStatus("Settings saved.");
  renderTable(currentFilter);
}

function resetAll(){
  if(!confirm("This wipes all saved data on this phone. Continue?")) return;
  localStorage.removeItem(KEY_ENTRIES);
  setStatus("All data cleared.");
  setForm({date: todayISO(), planned: focusForDate(todayISO())});
  renderTable(currentFilter);
}

function init(){
  const s = loadSettings();
  if(!s.startDate) saveSettings({startDate:"2026-01-12", autoSuggest:"on"});

  $("date").value = todayISO();
  setWeekPill($("date").value);
  applyAutoSuggest();

  const entries = loadEntries();
  const t = $("date").value;
  if(entries[t]) setForm({date:t, ...entries[t]});

  $("btnSave").addEventListener("click", saveCurrent);
  $("btnClear").addEventListener("click", clearDay);
  $("btnExport").addEventListener("click", exportCSV);
  $("fileImport").addEventListener("change", (e)=>{
    if(e.target.files && e.target.files[0]) importCSV(e.target.files[0]);
    e.target.value = "";
  });
  $("search").addEventListener("input", ()=>renderTable(currentFilter));
  $("btnThisWeek").addEventListener("click", ()=>renderTable("week"));
  $("btnThis12").addEventListener("click", ()=>renderTable("12"));
  $("btnAll").addEventListener("click", ()=>renderTable("all"));
  $("btnSettings").addEventListener("click", openSettings);
  $("btnSaveSettings").addEventListener("click", saveSettingsClick);
  $("btnResetAll").addEventListener("click", resetAll);

  $("date").addEventListener("change", ()=>{
    const iso = $("date").value;
    setWeekPill(iso);
    const entries = loadEntries();
    if(entries[iso]) setForm({date:iso, ...entries[iso]});
    else {
      const planned = ((loadSettings().autoSuggest||"on")==="on") ? focusForDate(iso) : $("planned").value;
      setForm({date:iso, planned});
    }
  });

  renderTable("12");
}

document.addEventListener("DOMContentLoaded", init);
