/*
 * Fitness Training Manager
 *
 * This script provides the core logic for managing clients, programs,
 * exercises, progress records, calendar events, theme and language settings,
 * as well as backing up and restoring local data. All data is stored
 * locally in the browser using localStorage, so it works completely offline.
 */

// Application state
let state = {
  clients: [],
  programs: [],
  exercises: [],
  progress: [],
  events: [],
  settings: {
    theme: 'light',
    language: 'en'
  }
};

// Translation dictionary for English and Persian (Farsi)
const translations = {
  en: {
    title: 'Fitness Training Manager',
    clients: 'Clients',
    programs: 'Programs',
    exercises: 'Exercises',
    progress: 'Progress',
    calendar: 'Calendar',
    settings: 'Settings',
    addClient: 'Add Client',
    addProgram: 'Add Program',
    addExercise: 'Add Exercise',
    addSession: 'Add Session',
    recordProgress: 'Record Progress',
    theme: 'Theme',
    language: 'Language',
    data: 'Data',
    backup: 'Backup Data',
    restore: 'Restore Data',
    selectClient: 'Select a client',
    programName: 'Program Name',
    exercisesList: 'Exercises (comma separated)',
    exerciseName: 'Exercise Name',
    targetMuscle: 'Target Muscle Group',
    date: 'Date',
    weight: 'Weight (kg)',
    note: 'Note',
    client: 'Client',
    age: 'Age',
    weightField: 'Weight (kg)',
    name: 'Name',
    export: 'Export'
  },
  fa: {
    title: 'مدیر تمرین تناسب اندام',
    clients: 'مراجعین',
    programs: 'برنامه‌ها',
    exercises: 'تمرین‌ها',
    progress: 'پیشرفت',
    calendar: 'تقویم',
    settings: 'تنظیمات',
    addClient: 'افزودن مراجعه‌کننده',
    addProgram: 'افزودن برنامه',
    addExercise: 'افزودن تمرین',
    addSession: 'افزودن جلسه',
    recordProgress: 'ثبت پیشرفت',
    theme: 'پوسته',
    language: 'زبان',
    data: 'داده‌ها',
    backup: 'پشتیبان‌گیری',
    restore: 'بازیابی داده',
    selectClient: 'انتخاب مراجعه‌کننده',
    programName: 'نام برنامه',
    exercisesList: 'تمرین‌ها (با ویرگول جدا کنید)',
    exerciseName: 'نام تمرین',
    targetMuscle: 'گروه عضلات هدف',
    date: 'تاریخ',
    weight: 'وزن (کیلوگرم)',
    note: 'یادداشت',
    client: 'مراجعه‌کننده',
    age: 'سن',
    weightField: 'وزن (کیلوگرم)',
    name: 'نام',
    export: 'صدور'
  }
};

// Helper to load saved state from localStorage
function loadState() {
  try {
    const stored = localStorage.getItem('ftm-state');
    if (stored) {
      state = JSON.parse(stored);
    }
  } catch (err) {
    console.error('Failed to load state:', err);
  }
  // Apply theme and language from settings
  applyTheme(state.settings.theme);
  applyLanguage(state.settings.language);
}

// Save current state to localStorage
function saveState() {
  try {
    localStorage.setItem('ftm-state', JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state:', err);
  }
}

// Navigation between sections
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.target;
      showSection(target);
    });
  });
  // Activate first section by default
  navButtons[0].classList.add('active');
  showSection(navButtons[0].dataset.target);
}

function showSection(sectionId) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active');
  }
  // When switching to progress or calendar, refresh selects
  if (sectionId === 'progress') {
    updateClientSelect('progress-client-select');
    renderProgressRecords();
  } else if (sectionId === 'calendar') {
    updateClientSelect('calendar-client');
    renderEvents();
  }
}

// Theme handling
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

function setupTheme() {
  const select = document.getElementById('theme-select');
  select.value = state.settings.theme;
  select.addEventListener('change', () => {
    state.settings.theme = select.value;
    applyTheme(select.value);
    saveState();
  });
}

// Language handling
function applyLanguage(lang) {
  state.settings.language = lang;
  document.getElementById('language-select').value = lang;
  const dict = translations[lang] || translations.en;
  // Update nav buttons
  const navMap = ['clients', 'programs', 'exercises', 'progress', 'calendar', 'settings'];
  navMap.forEach(id => {
    const btn = document.querySelector(`.nav-btn[data-target="${id}"]`);
    if (btn) btn.textContent = dict[id];
  });
  // Update headings and labels
  document.getElementById('app-title').textContent = dict.title;
  document.querySelector('#clients h2').textContent = dict.clients;
  document.querySelector('#programs h2').textContent = dict.programs;
  document.querySelector('#exercises h2').textContent = dict.exercises;
  document.querySelector('#progress h2').textContent = dict.progress;
  document.querySelector('#calendar h2').textContent = dict.calendar;
  document.querySelector('#settings h2').textContent = dict.settings;
  // Update form labels (by id)
  const labelMap = {
    'client-name': dict.name,
    'client-age': dict.age,
    'client-weight': dict.weightField,
    'program-name': dict.programName,
    'program-exercises': dict.exercisesList,
    'exercise-name': dict.exerciseName,
    'exercise-muscle': dict.targetMuscle,
    'progress-date': dict.date,
    'progress-weight': dict.weight,
    'calendar-date': dict.date,
    'calendar-note': dict.note
  };
  for (const fieldId in labelMap) {
    const lbl = document.querySelector(`label[for="${fieldId}"]`);
    if (lbl) lbl.textContent = labelMap[fieldId];
  }
  // Buttons
  const btnMap = {
    'client-form': dict.addClient,
    'program-form': dict.addProgram,
    'exercise-form': dict.addExercise,
    'progress-form': dict.recordProgress,
    'calendar-form': dict.addSession,
    'backup-btn': dict.backup,
    'restore-btn': dict.restore
  };
  for (const formId in btnMap) {
    const form = document.getElementById(formId);
    if (form) {
      const btn = form.querySelector('button[type="submit"], button#' + formId);
      // find first button inside form or with id
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = btnMap[formId];
    }
  }
  // Settings headings and groups
  const settingGroups = document.querySelectorAll('#settings h3');
  if (settingGroups.length >= 3) {
    settingGroups[0].textContent = dict.theme;
    settingGroups[1].textContent = dict.language;
    settingGroups[2].textContent = dict.data;
  }
  // Placeholder text for selects
  const progressSelect = document.getElementById('progress-client-select');
  if (progressSelect) {
    const firstOption = progressSelect.querySelector('option');
    if (firstOption) firstOption.textContent = dict.selectClient;
  }
  const calendarClientSelect = document.getElementById('calendar-client');
  if (calendarClientSelect) {
    const firstOption = calendarClientSelect.querySelector('option');
    if (firstOption) firstOption.textContent = dict.selectClient;
  }
  // Set direction (rtl for Persian)
  document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
}

function setupLanguage() {
  const select = document.getElementById('language-select');
  select.value = state.settings.language;
  select.addEventListener('change', () => {
    applyLanguage(select.value);
    saveState();
  });
}

// Update selects for clients (in progress and calendar forms)
function updateClientSelect(selectId) {
  const select = document.getElementById(selectId);
  // Clear options
  select.innerHTML = '';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = translations[state.settings.language].selectClient;
  select.appendChild(defaultOpt);
  state.clients.forEach((client, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = client.name;
    select.appendChild(opt);
  });
}

// Render lists
function renderClients() {
  const container = document.getElementById('clients-list');
  container.innerHTML = '';
  state.clients.forEach((client, idx) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `<span>${client.name} - ${client.age || ''} - ${client.weight || ''}kg</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => {
      state.clients.splice(idx, 1);
      // remove associated progress and events referencing this client
      state.progress = state.progress.filter(p => p.clientIndex !== idx);
      state.events = state.events.filter(e => e.clientIndex !== idx);
      saveState();
      renderClients();
      updateClientSelect('progress-client-select');
      updateClientSelect('calendar-client');
      renderProgressRecords();
      renderEvents();
    });
    div.appendChild(delBtn);
    container.appendChild(div);
  });
}

function renderPrograms() {
  const container = document.getElementById('programs-list');
  container.innerHTML = '';
  state.programs.forEach((program, idx) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `<span>${program.name}: ${program.exercises.join(', ')}</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => {
      state.programs.splice(idx, 1);
      saveState();
      renderPrograms();
    });
    div.appendChild(delBtn);
    container.appendChild(div);
  });
}

function renderExercises() {
  const container = document.getElementById('exercises-list');
  container.innerHTML = '';
  state.exercises.forEach((exercise, idx) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `<span>${exercise.name} (${exercise.muscle || ''})</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => {
      state.exercises.splice(idx, 1);
      saveState();
      renderExercises();
    });
    div.appendChild(delBtn);
    container.appendChild(div);
  });
}

function renderProgressRecords() {
  const container = document.getElementById('progress-records');
  container.innerHTML = '';
  const clientIndex = parseInt(document.getElementById('progress-client-select').value);
  if (isNaN(clientIndex)) return;
  const records = state.progress.filter(r => r.clientIndex === clientIndex);
  if (records.length === 0) {
    container.textContent = 'No records yet';
    return;
  }
  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  const header = document.createElement('tr');
  ['Date', 'Weight'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    th.style.borderBottom = '1px solid var(--border-color)';
    header.appendChild(th);
  });
  table.appendChild(header);
  records.forEach((rec, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${rec.date}</td><td>${rec.weight || ''}</td>`;
    table.appendChild(tr);
  });
  container.appendChild(table);
}

function renderEvents() {
  const container = document.getElementById('calendar-events');
  container.innerHTML = '';
  if (state.events.length === 0) {
    container.textContent = 'No events scheduled';
    return;
  }
  state.events.forEach((event, idx) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    const clientName = state.clients[event.clientIndex]?.name || '';
    div.innerHTML = `<span>${event.date}: ${clientName} - ${event.note || ''}</span>`;
    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.title = 'Delete';
    delBtn.addEventListener('click', () => {
      state.events.splice(idx, 1);
      saveState();
      renderEvents();
    });
    div.appendChild(delBtn);
    container.appendChild(div);
  });
}

// Form handlers
function setupForms() {
  // Client form
  const clientForm = document.getElementById('client-form');
  clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('client-name').value.trim();
    const age = document.getElementById('client-age').value;
    const weight = document.getElementById('client-weight').value;
    if (!name) return;
    state.clients.push({ name, age, weight });
    saveState();
    clientForm.reset();
    renderClients();
    updateClientSelect('progress-client-select');
    updateClientSelect('calendar-client');
  });
  // Program form
  const programForm = document.getElementById('program-form');
  programForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('program-name').value.trim();
    const exercises = document.getElementById('program-exercises').value.split(',').map(s => s.trim()).filter(Boolean);
    if (!name) return;
    state.programs.push({ name, exercises });
    saveState();
    programForm.reset();
    renderPrograms();
  });
  // Exercise form
  const exerciseForm = document.getElementById('exercise-form');
  exerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('exercise-name').value.trim();
    const muscle = document.getElementById('exercise-muscle').value.trim();
    if (!name) return;
    state.exercises.push({ name, muscle });
    saveState();
    exerciseForm.reset();
    renderExercises();
  });
  // Progress form
  const progressForm = document.getElementById('progress-form');
  progressForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientIndex = parseInt(document.getElementById('progress-client-select').value);
    if (isNaN(clientIndex)) return;
    const date = document.getElementById('progress-date').value;
    const weight = document.getElementById('progress-weight').value;
    if (!date) return;
    state.progress.push({ clientIndex, date, weight });
    saveState();
    progressForm.reset();
    renderProgressRecords();
  });
  // Calendar form
  const calendarForm = document.getElementById('calendar-form');
  calendarForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const clientIndex = parseInt(document.getElementById('calendar-client').value);
    if (isNaN(clientIndex)) return;
    const date = document.getElementById('calendar-date').value;
    const note = document.getElementById('calendar-note').value.trim();
    if (!date) return;
    state.events.push({ clientIndex, date, note });
    saveState();
    calendarForm.reset();
    renderEvents();
  });
  // Backup and restore
  document.getElementById('backup-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fitness-training-manager-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('restore-btn').addEventListener('click', () => {
    const fileInput = document.getElementById('restore-file');
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        state = data;
        applyTheme(state.settings.theme);
        applyLanguage(state.settings.language);
        saveState();
        renderAll();
      } catch (err) {
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);
  });
}

function renderAll() {
  renderClients();
  renderPrograms();
  renderExercises();
  updateClientSelect('progress-client-select');
  updateClientSelect('calendar-client');
  renderProgressRecords();
  renderEvents();
  // set selects values to default
  document.getElementById('theme-select').value = state.settings.theme;
  document.getElementById('language-select').value = state.settings.language;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupNavigation();
  setupForms();
  setupTheme();
  setupLanguage();
  renderAll();
});
