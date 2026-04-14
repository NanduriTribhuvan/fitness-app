// ============================================================
// app.js — Main application logic, navigation, state, dashboard
// ============================================================

const App = (() => {

  // ── State ─────────────────────────────────────────────────
  let state = {
    currentPage: 'dashboard',
    profile: null,
    settings: null,
    workouts: [],
    todayWater: [],
    sleepLogs: [],
    prs: {},
    streaks: {},
    activeWorkout: null,
    charts: {},
  };

  // ── HTML Escape Utility ───────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // ── Motivational Quotes ───────────────────────────────────
  const QUOTES = [
    { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
    { text: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Unknown" },
    { text: "Success isn't always about greatness. It's about consistency.", author: "Dwayne Johnson" },
    { text: "Train insane or remain the same.", author: "Jillian Michaels" },
    { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
    { text: "Strive for progress, not perfection.", author: "Unknown" },
    { text: "Champions aren't made in gyms. Champions are made from something deep inside.", author: "Muhammad Ali" },
    { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
    { text: "It never gets easier, you just get better.", author: "Unknown" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "The clock is ticking. Are you becoming the person you want to be?", author: "Greg Plitt" },
    { text: "No matter how slow you go, you are still lapping everyone on the couch.", author: "Unknown" },
  ];

  function getDailyQuote() {
    const day = new Date().getDay();
    return QUOTES[day % QUOTES.length];
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    loadState();
    registerServiceWorker();
    setupNavigation();
    setupFAB();
    renderCurrentPage();
    checkReminder();
    // Auto-refresh every 60s
    setInterval(() => { renderCurrentPage(); }, 60000);
  }

  function loadState() {
    state.profile = Storage.getProfile();
    state.settings = Storage.getSettings();
    state.workouts = Storage.getWorkouts();
    state.todayWater = Storage.getTodayWater();
    state.sleepLogs = Storage.getSleepLogs();
    state.prs = Storage.getPRs();
    state.streaks = Storage.getStreaks();

    // Sync water goal from health calculation
    const report = Health.getFullReport(state.profile);
    if (!state.settings.waterGoal) {
      state.settings.waterGoal = report.waterGoal;
      Storage.saveSettings(state.settings);
    }
  }

  // ── Service Worker ─────────────────────────────────────────
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  // ── Navigation ────────────────────────────────────────────
  function setupNavigation() {
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateTo(btn.dataset.nav);
      });
    });
  }

  function navigateTo(page) {
    state.currentPage = page;

    // Update nav buttons
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.nav === page);
    });

    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.toggle('active', p.id === 'page-' + page);
    });

    renderCurrentPage();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderCurrentPage() {
    switch (state.currentPage) {
      case 'dashboard': renderDashboard(); break;
      case 'workout':   renderWorkoutPage(); break;
      case 'water':     renderWaterPage(); break;
      case 'sleep':     renderSleepPage(); break;
      case 'profile':   renderProfilePage(); break;
    }
  }

  // ── FAB ───────────────────────────────────────────────────
  function setupFAB() {
    const fab = document.getElementById('fab');
    if (!fab) return;
    fab.addEventListener('click', () => {
      const page = state.currentPage;
      if (page === 'workout')   showWorkoutModal();
      else if (page === 'water') quickAddWater(250);
      else if (page === 'sleep') showSleepModal();
      else navigateTo('workout');
    });
  }

  // ── Reminder ──────────────────────────────────────────────
  function checkReminder() {
    const today = Storage.todayKey();
    const last = Storage.getLastReminder();
    const banner = document.getElementById('reminder-banner');
    if (!banner) return;

    const profile = state.profile;
    const completed = state.workouts.filter(w => w.date.slice(0, 10) === today && w.completed).length > 0;

    if (last !== today) {
      banner.classList.add('show');
      const firstName = esc(profile.username.split(' ')[0]);
      const emailHref = `mailto:${esc(profile.email)}?subject=Fitness%20Check-in&body=Hi%20${encodeURIComponent(profile.username)}%2C%20time%20to%20log%20your%20fitness%20data%21`;
      banner.innerHTML = `
        <span class="reminder-icon">🔔</span>
        <div class="reminder-text">
          <strong>Daily Check-in Reminder</strong>
          <span>Log your workout &amp; stats, ${firstName}!</span>
        </div>
        <a href="${emailHref}" class="reminder-cta" target="_blank" rel="noopener">📧 Email</a>
        <button class="reminder-close" onclick="App.dismissReminder()">✕</button>
      `;
    }

    if (completed) {
      Storage.setLastReminder(today);
    }
  }

  function dismissReminder() {
    const banner = document.getElementById('reminder-banner');
    if (banner) banner.classList.remove('show');
    Storage.setLastReminder(Storage.todayKey());
  }

  // ── Dashboard ─────────────────────────────────────────────
  function renderDashboard() {
    // Reload fresh state
    state.workouts = Storage.getWorkouts();
    state.todayWater = Storage.getTodayWater();
    state.sleepLogs = Storage.getSleepLogs();
    state.streaks = Storage.getStreaks();

    const profile = state.profile;
    const report = Health.getFullReport(profile);
    const quote = getDailyQuote();
    const today = Storage.todayKey();

    // Today's stats
    const todayWorkouts = state.workouts.filter(w => w.date.slice(0, 10) === today && w.completed);
    const totalWaterMl = Water.getDailyTotal(state.todayWater);
    const waterProgress = Water.getProgress(totalWaterMl, state.settings.waterGoal || report.waterGoal);
    const lastSleep = state.sleepLogs.slice(-1)[0];
    const sleepScore = lastSleep ? Sleep.calcScore(lastSleep) : 0;

    // Streak info
    const streaks = state.streaks;

    // Weekly workout chart data
    const weekData = Workout.getWeeklyChartData(state.workouts);

    // Render
    const page = document.getElementById('page-dashboard');
    if (!page) return;

    page.innerHTML = `
      <!-- Header -->
      <div class="dash-header">
        <div>
          <p class="dash-greeting">${esc(getGreeting())},</p>
          <h1 class="dash-name">${esc(profile.username)}</h1>
        </div>
        <div class="dash-avatar">${esc(profile.username.charAt(0))}</div>
      </div>

      <!-- Quote Banner -->
      <div class="quote-banner glass-card">
        <span class="quote-icon">💬</span>
        <div>
          <p class="quote-text">&ldquo;${esc(quote.text)}&rdquo;</p>
          <p class="quote-author">— ${esc(quote.author)}</p>
        </div>
      </div>

      <!-- Today's Summary Grid -->
      <h2 class="section-title">Today's Summary</h2>
      <div class="summary-grid">
        <div class="summary-card glass-card" onclick="App.navigateTo('workout')">
          <div class="summary-icon">🏋️</div>
          <div class="summary-value">${todayWorkouts.length}</div>
          <div class="summary-label">Workouts</div>
          ${todayWorkouts.length > 0 ? '<div class="summary-badge done">Done</div>' : '<div class="summary-badge pending">Log it</div>'}
        </div>
        <div class="summary-card glass-card" onclick="App.navigateTo('water')">
          <div class="summary-icon">💧</div>
          <div class="summary-value">${Water.formatMl(totalWaterMl)}</div>
          <div class="summary-label">Hydration</div>
          <div class="summary-progress"><div class="summary-progress-fill" style="width:${waterProgress.pct}%"></div></div>
          <div class="summary-badge ${waterProgress.achieved ? 'done' : 'pending'}">${waterProgress.pct}%</div>
        </div>
        <div class="summary-card glass-card" onclick="App.navigateTo('sleep')">
          <div class="summary-icon">😴</div>
          <div class="summary-value">${lastSleep ? Sleep.formatDuration(lastSleep.durationHrs) : '—'}</div>
          <div class="summary-label">Sleep</div>
          ${lastSleep ? `<div class="summary-badge ${sleepScore >= 70 ? 'done' : 'pending'}">${sleepScore}/100</div>` : '<div class="summary-badge pending">Log it</div>'}
        </div>
        <div class="summary-card glass-card" onclick="App.navigateTo('profile')">
          <div class="summary-icon">🔥</div>
          <div class="summary-value">${report.goalCals}</div>
          <div class="summary-label">Cal Goal</div>
          <div class="summary-badge info">TDEE ${report.tdee}</div>
        </div>
      </div>

      <!-- Streak Counters -->
      <h2 class="section-title">🔥 Streaks</h2>
      <div class="streak-row">
        <div class="streak-item glass-card">
          <div class="streak-num">${streaks.workout || 0}</div>
          <div class="streak-label">Workout Days</div>
          <div class="streak-icon">🏋️</div>
        </div>
        <div class="streak-item glass-card">
          <div class="streak-num">${streaks.water || 0}</div>
          <div class="streak-label">Water Goals</div>
          <div class="streak-icon">💧</div>
        </div>
        <div class="streak-item glass-card">
          <div class="streak-num">${streaks.sleep || 0}</div>
          <div class="streak-label">Sleep Logs</div>
          <div class="streak-icon">😴</div>
        </div>
      </div>

      <!-- Stats Row -->
      <h2 class="section-title">📊 Body Stats</h2>
      <div class="stats-row">
        <div class="stat-chip glass-card">
          <span class="stat-label">BMI</span>
          <span class="stat-value" style="color:${report.bmiCat.color}">${report.bmi}</span>
          <span class="stat-sub">${report.bmiCat.label}</span>
        </div>
        <div class="stat-chip glass-card">
          <span class="stat-label">BMR</span>
          <span class="stat-value">${report.bmr}</span>
          <span class="stat-sub">kcal/day</span>
        </div>
        <div class="stat-chip glass-card">
          <span class="stat-label">TDEE</span>
          <span class="stat-value">${report.tdee}</span>
          <span class="stat-sub">kcal/day</span>
        </div>
        <div class="stat-chip glass-card">
          <span class="stat-label">Age</span>
          <span class="stat-value">${report.age}</span>
          <span class="stat-sub">years old</span>
        </div>
      </div>

      <!-- Weekly Workout Chart -->
      <h2 class="section-title">📅 This Week</h2>
      <div class="glass-card chart-card">
        <canvas id="weeklyWorkoutChart" height="120"></canvas>
      </div>

      <!-- Macros -->
      <h2 class="section-title">🍽️ Daily Macros</h2>
      <div class="macro-grid glass-card">
        <div class="macro-item">
          <div class="macro-circle protein">
            <span class="macro-g">${report.macros.proteinG}g</span>
          </div>
          <div class="macro-label">Protein</div>
        </div>
        <div class="macro-item">
          <div class="macro-circle carbs">
            <span class="macro-g">${report.macros.carbG}g</span>
          </div>
          <div class="macro-label">Carbs</div>
        </div>
        <div class="macro-item">
          <div class="macro-circle fat">
            <span class="macro-g">${report.macros.fatG}g</span>
          </div>
          <div class="macro-label">Fat</div>
        </div>
        <div class="macro-item">
          <div class="macro-circle calories">
            <span class="macro-g">${report.goalCals}</span>
          </div>
          <div class="macro-label">Calories</div>
        </div>
      </div>
    `;

    // Render weekly chart
    renderWeeklyWorkoutChart('weeklyWorkoutChart', weekData);
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function renderWeeklyWorkoutChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;

    if (state.charts[canvasId]) { state.charts[canvasId].destroy(); }

    state.charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          label: 'Workouts',
          data: data.data,
          backgroundColor: data.data.map(v => v > 0 ? 'rgba(255,0,51,0.8)' : 'rgba(255,0,51,0.2)'),
          borderColor: 'rgba(255,0,51,1)',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ccc' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ccc', stepSize: 1 }, min: 0 },
        },
      },
    });
  }

  // ── Workout Page ──────────────────────────────────────────
  function renderWorkoutPage() {
    state.workouts = Storage.getWorkouts();
    const page = document.getElementById('page-workout');
    if (!page) return;

    const workoutDates = Workout.getWorkoutDatesSet(state.workouts);
    const stats = Workout.calcWorkoutStats(state.workouts);
    const weekWorkouts = Workout.getWorkoutsThisWeek(state.workouts);
    const prs = Storage.getPRs();
    const suggestions = Health.getWorkoutSuggestions(state.profile, state.workouts);

    // Calendar (last 35 days)
    const calendarDays = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      calendarDays.push({ key: d.toISOString().slice(0, 10), d, isToday: i === 0 });
    }

    page.innerHTML = `
      <!-- Stats Bar -->
      <div class="workout-stats-bar">
        <div class="ws-stat"><span class="ws-val">${stats.totalWorkouts}</span><span class="ws-lab">Total</span></div>
        <div class="ws-stat"><span class="ws-val">${weekWorkouts.length}</span><span class="ws-lab">This Week</span></div>
        <div class="ws-stat"><span class="ws-val">${stats.totalVolume > 1000 ? (stats.totalVolume/1000).toFixed(1)+'t' : stats.totalVolume+'kg'}</span><span class="ws-lab">Volume</span></div>
        <div class="ws-stat"><span class="ws-val">${stats.favoriteType || '—'}</span><span class="ws-lab">Fav Type</span></div>
      </div>

      <!-- Calendar -->
      <h2 class="section-title">📅 Activity Calendar</h2>
      <div class="calendar-grid glass-card">
        ${calendarDays.map(day => `
          <div class="cal-day ${workoutDates.has(day.key) ? 'worked' : ''} ${day.isToday ? 'today' : ''}">
            <span>${day.d.getDate()}</span>
          </div>
        `).join('')}
      </div>

      <!-- Start Workout Button -->
      <button class="btn-primary btn-full start-workout-btn" onclick="App.showWorkoutModal()">
        <span>⚡</span> Start New Workout
      </button>

      <!-- Recent Workouts -->
      <h2 class="section-title">Recent Workouts</h2>
      <div id="recent-workouts-list">
        ${renderWorkoutList(state.workouts.filter(w => w.completed).slice(-5).reverse())}
      </div>

      <!-- Personal Records -->
      <h2 class="section-title">🏆 Personal Records</h2>
      <div class="pr-list">
        ${Object.keys(prs).length === 0
          ? '<div class="empty-state">No PRs yet. Start logging workouts!</div>'
          : Object.entries(prs).slice(0, 6).map(([ex, pr]) => `
            <div class="pr-item glass-card">
              <div class="pr-exercise">${ex}</div>
              <div class="pr-stats">${pr.weight}kg × ${pr.reps} reps</div>
              <div class="pr-date">${new Date(pr.date).toLocaleDateString()}</div>
            </div>
          `).join('')
        }
      </div>

      <!-- Suggestions -->
      <h2 class="section-title">🧠 Improvement Tips</h2>
      <div class="suggestions-list">
        ${suggestions.map(s => `
          <div class="suggestion-card glass-card priority-${s.priority}">
            <div class="sug-header">
              <span class="sug-icon">${s.icon}</span>
              <span class="sug-title">${s.title}</span>
              <span class="sug-badge ${s.priority}">${s.priority}</span>
            </div>
            <p class="sug-body">${s.body}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderWorkoutList(workouts) {
    if (workouts.length === 0) {
      return '<div class="empty-state">No workouts yet. Hit the + button to start!</div>';
    }
    return workouts.map(w => `
      <div class="workout-item glass-card">
        <div class="wi-header">
          <span class="wi-type-badge ${w.type.toLowerCase()}">${w.type}</span>
          <span class="wi-date">${new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          <button class="wi-delete" onclick="App.deleteWorkout('${w.id}')" aria-label="Delete workout">🗑️</button>
        </div>
        <div class="wi-name">${w.name}</div>
        <div class="wi-meta">
          <span>⏱ ${w.duration ? Math.round(w.duration/60) + ' min' : '—'}</span>
          <span>📍 ${(w.exercises || []).length} exercise${(w.exercises || []).length !== 1 ? 's' : ''}</span>
        </div>
        ${(w.exercises || []).slice(0, 3).map(ex => `
          <div class="wi-exercise">
            <span class="ex-name">${ex.name}</span>
            <span class="ex-sets">${(ex.sets || []).length} sets</span>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  // ── Workout Modal ─────────────────────────────────────────
  function showWorkoutModal(workoutId) {
    let workout = workoutId
      ? state.workouts.find(w => w.id === workoutId)
      : null;

    if (!workout) {
      workout = Workout.createWorkout('Strength', 'My Workout');
    }

    state.activeWorkout = workout;

    const modal = document.getElementById('modal-workout');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>🏋️ ${workoutId ? 'Edit' : 'New'} Workout</h2>
          <button class="modal-close" onclick="App.closeModal('modal-workout')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Workout Name</label>
            <input type="text" id="wk-name" class="form-input" value="${workout.name}" placeholder="e.g. Upper Body Day">
          </div>
          <div class="form-group">
            <label>Type</label>
            <div class="type-pills">
              ${Workout.WORKOUT_TYPES.map(t => `
                <button class="type-pill ${workout.type === t ? 'active' : ''}" onclick="App.setWorkoutType('${t}')">${t}</button>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" id="wk-duration" class="form-input" value="${Math.round((workout.duration || 0)/60)}" placeholder="60" min="0">
          </div>

          <h3 class="sub-title">Exercises</h3>
          <div id="exercise-list">
            ${renderExerciseList(workout.exercises)}
          </div>

          <button class="btn-secondary btn-full" onclick="App.showAddExercisePanel()">+ Add Exercise</button>

          <div id="add-exercise-panel" class="add-exercise-panel hidden">
            <h4>Select Muscle Group</h4>
            <div class="muscle-pills">
              ${[...Workout.MUSCLE_GROUPS, 'cardio', 'hiit', 'flexibility'].map(g => `
                <button class="muscle-pill" onclick="App.showExercisesForGroup('${g}')">${g.charAt(0).toUpperCase() + g.slice(1)}</button>
              `).join('')}
            </div>
            <div id="exercise-picker" class="exercise-picker"></div>
          </div>

          <div class="form-group">
            <label>Notes</label>
            <textarea id="wk-notes" class="form-input" rows="2" placeholder="How did it feel?">${workout.notes || ''}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="App.closeModal('modal-workout')">Cancel</button>
          <button class="btn-primary" onclick="App.saveWorkout()">💾 Save Workout</button>
        </div>
      </div>
    `;

    modal.classList.add('active');
  }

  function renderExerciseList(exercises) {
    if (!exercises || exercises.length === 0) {
      return '<div class="empty-state small">No exercises added yet.</div>';
    }
    return exercises.map((ex, eIdx) => `
      <div class="ex-card glass-card" id="ex-${ex.id}">
        <div class="ex-card-header">
          <span class="ex-card-name">${ex.name}</span>
          <span class="ex-card-group">${ex.muscleGroup}</span>
          <button class="ex-remove" onclick="App.removeExercise('${ex.id}')">✕</button>
        </div>
        <div class="sets-list" id="sets-${ex.id}">
          ${renderSetsList(ex.sets, ex, eIdx)}
        </div>
        <button class="btn-mini" onclick="App.addSet('${ex.id}')">+ Add Set</button>
      </div>
    `).join('');
  }

  function renderSetsList(sets, ex, eIdx) {
    if (!sets || sets.length === 0) return '<div class="empty-state tiny">Add a set</div>';
    return sets.map((s, sIdx) => {
      const isCardio = ex.type === 'cardio';
      return `
        <div class="set-row" id="set-${s.id}">
          <span class="set-num">${sIdx + 1}</span>
          ${isCardio ? `
            <input type="number" class="set-input" placeholder="min" value="${s.duration > 0 ? Math.round(s.duration/60) : ''}"
              onchange="App.updateSetField('${ex.id}','${s.id}','duration', this.value*60)" aria-label="Duration in minutes">
            <span class="set-sep">min</span>
            <input type="number" class="set-input" placeholder="km" value="${s.distance > 0 ? (s.distance/1000).toFixed(1) : ''}"
              onchange="App.updateSetField('${ex.id}','${s.id}','distance', this.value*1000)" aria-label="Distance in km">
            <span class="set-sep">km</span>
          ` : `
            <input type="number" class="set-input" placeholder="kg" value="${s.weight || ''}"
              onchange="App.updateSetField('${ex.id}','${s.id}','weight', this.value)" aria-label="Weight in kg">
            <span class="set-sep">×</span>
            <input type="number" class="set-input" placeholder="reps" value="${s.reps || ''}"
              onchange="App.updateSetField('${ex.id}','${s.id}','reps', this.value)" aria-label="Number of reps">
            <span class="set-sep">reps</span>
          `}
          <button class="set-remove" onclick="App.removeSet('${ex.id}','${s.id}')" aria-label="Remove set">✕</button>
        </div>
      `;
    }).join('');
  }

  function showAddExercisePanel() {
    const panel = document.getElementById('add-exercise-panel');
    if (panel) panel.classList.toggle('hidden');
  }

  function showExercisesForGroup(group) {
    const picker = document.getElementById('exercise-picker');
    if (!picker) return;
    const exercises = Workout.getExercisesByMuscle(group);
    picker.innerHTML = `
      <div class="ex-picker-list">
        ${exercises.map(e => `
          <button class="ex-picker-item" onclick="App.addExercise('${e.name}', '${group}')">
            ${e.name}<span class="ex-equip">${e.equipment}</span>
          </button>
        `).join('')}
        <button class="ex-picker-item custom" onclick="App.addCustomExercise('${group}')">+ Custom Exercise</button>
      </div>
    `;
  }

  function addCustomExercise(group) {
    const name = prompt('Enter exercise name:');
    if (name && name.trim()) addExercise(name.trim(), group);
  }

  function addExercise(name, group) {
    if (!state.activeWorkout) return;
    const ex = Workout.createExercise(name, group);
    ex.sets.push(Workout.createSet(0, 0));
    state.activeWorkout.exercises.push(ex);

    const list = document.getElementById('exercise-list');
    if (list) list.innerHTML = renderExerciseList(state.activeWorkout.exercises);

    document.getElementById('add-exercise-panel')?.classList.add('hidden');
  }

  function removeExercise(exId) {
    if (!state.activeWorkout) return;
    state.activeWorkout.exercises = state.activeWorkout.exercises.filter(e => e.id !== exId);
    const list = document.getElementById('exercise-list');
    if (list) list.innerHTML = renderExerciseList(state.activeWorkout.exercises);
  }

  function addSet(exId) {
    if (!state.activeWorkout) return;
    const ex = state.activeWorkout.exercises.find(e => e.id === exId);
    if (!ex) return;
    const lastSet = ex.sets.slice(-1)[0] || {};
    ex.sets.push(Workout.createSet(lastSet.weight || 0, lastSet.reps || 0));
    const list = document.getElementById('sets-' + exId);
    const eIdx = state.activeWorkout.exercises.indexOf(ex);
    if (list) list.innerHTML = renderSetsList(ex.sets, ex, eIdx);
  }

  function removeSet(exId, setId) {
    if (!state.activeWorkout) return;
    const ex = state.activeWorkout.exercises.find(e => e.id === exId);
    if (!ex) return;
    ex.sets = ex.sets.filter(s => s.id !== setId);
    const list = document.getElementById('sets-' + exId);
    const eIdx = state.activeWorkout.exercises.indexOf(ex);
    if (list) list.innerHTML = renderSetsList(ex.sets, ex, eIdx);
  }

  function updateSetField(exId, setId, field, value) {
    if (!state.activeWorkout) return;
    const ex = state.activeWorkout.exercises.find(e => e.id === exId);
    if (!ex) return;
    const s = ex.sets.find(s => s.id === setId);
    if (s) s[field] = parseFloat(value) || 0;
  }

  function setWorkoutType(type) {
    if (!state.activeWorkout) return;
    state.activeWorkout.type = type;
    document.querySelectorAll('.type-pill').forEach(p => {
      p.classList.toggle('active', p.textContent.trim() === type);
    });
  }

  function saveWorkout() {
    if (!state.activeWorkout) return;
    const nameEl = document.getElementById('wk-name');
    const durationEl = document.getElementById('wk-duration');
    const notesEl = document.getElementById('wk-notes');

    state.activeWorkout.name = nameEl?.value || state.activeWorkout.name;
    state.activeWorkout.duration = (parseFloat(durationEl?.value) || 0) * 60;
    state.activeWorkout.notes = notesEl?.value || '';
    state.activeWorkout.completed = true;

    // Check for PRs
    let newPRs = [];
    state.activeWorkout.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.weight > 0 && s.reps > 0) {
          const isNewPR = Storage.updatePR(ex.name, s.weight, s.reps, state.activeWorkout.date);
          if (isNewPR) newPRs.push(`${ex.name}: ${s.weight}kg × ${s.reps}`);
        }
      });
    });

    Storage.saveWorkout(state.activeWorkout);
    Storage.updateStreak('workout');

    closeModal('modal-workout');
    state.workouts = Storage.getWorkouts();
    renderWorkoutPage();

    if (newPRs.length > 0) {
      showToast(`🏆 New PR${newPRs.length > 1 ? 's' : ''}! ${newPRs[0]}`, 'success');
    } else {
      showToast('💪 Workout saved!', 'success');
    }
  }

  function deleteWorkout(id) {
    if (!confirm('Delete this workout?')) return;
    Storage.deleteWorkout(id);
    state.workouts = Storage.getWorkouts();
    renderWorkoutPage();
    showToast('Workout deleted', 'info');
  }

  // ── Water Page ────────────────────────────────────────────
  function renderWaterPage() {
    state.todayWater = Storage.getTodayWater();
    const page = document.getElementById('page-water');
    if (!page) return;

    const report = Health.getFullReport(state.profile);
    const goalMl = state.settings.waterGoal || report.waterGoal;
    const totalMl = Water.getDailyTotal(state.todayWater);
    const progress = Water.getProgress(totalMl, goalMl);
    const suggestion = Water.getWaterSuggestion(totalMl, goalMl);
    const weekStats = Water.getWeeklyStats(Storage.getWaterLogs(), goalMl);
    const timeline = Water.getTimeline(state.todayWater);

    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference * (1 - progress.pct / 100);

    page.innerHTML = `
      <!-- Progress Ring -->
      <div class="water-hero">
        <div class="water-ring-container">
          <svg class="water-ring" viewBox="0 0 120 120" aria-label="Water intake progress ${progress.pct}%">
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="10"/>
            <circle cx="60" cy="60" r="54" fill="none" stroke="url(#waterGrad)" stroke-width="10"
              stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}"
              stroke-linecap="round" transform="rotate(-90 60 60)"
              style="transition: stroke-dashoffset 0.8s ease"/>
            <defs>
              <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#00BFFF"/>
                <stop offset="100%" style="stop-color:#0080FF"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="water-ring-inner">
            <div class="water-amount">${Water.formatMl(totalMl)}</div>
            <div class="water-pct">${progress.pct}%</div>
            <div class="water-goal">of ${Water.formatMl(goalMl)}</div>
          </div>
        </div>
        <div class="water-suggestion">
          <span>${suggestion.emoji}</span>
          <span>${suggestion.text}</span>
        </div>
        ${progress.remaining > 0 ? `<div class="water-remaining">💧 ${Water.formatMl(progress.remaining)} remaining</div>` : ''}
      </div>

      <!-- Quick Add Buttons -->
      <h2 class="section-title">Quick Add</h2>
      <div class="water-quick-btns">
        ${Water.QUICK_ADD.map(ml => `
          <button class="water-btn glass-card" onclick="App.quickAddWater(${ml})">
            <span class="water-btn-icon">💧</span>
            <span class="water-btn-label">+${Water.formatMl(ml)}</span>
          </button>
        `).join('')}
        <button class="water-btn glass-card custom" onclick="App.showCustomWaterModal()">
          <span class="water-btn-icon">✏️</span>
          <span class="water-btn-label">Custom</span>
        </button>
      </div>

      <!-- Weekly Stats -->
      <h2 class="section-title">📊 7-Day History</h2>
      <div class="water-week-grid glass-card">
        ${weekStats.map(day => `
          <div class="water-day ${day.achieved ? 'achieved' : ''}">
            <div class="water-day-bar-wrap">
              <div class="water-day-bar" style="height:${day.pct}%"></div>
            </div>
            <div class="water-day-label">${day.label}</div>
            <div class="water-day-total">${day.total > 0 ? Water.formatMl(day.total) : '—'}</div>
          </div>
        `).join('')}
      </div>

      <!-- Today's Log -->
      <h2 class="section-title">Today's Log</h2>
      <div class="water-timeline glass-card">
        ${timeline.length === 0
          ? '<div class="empty-state">No entries yet today</div>'
          : timeline.map((e, i) => `
            <div class="water-entry">
              <span class="we-icon">💧</span>
              <span class="we-amount">${e.label}</span>
              <span class="we-time">${e.timeLabel}</span>
              <button class="we-remove" onclick="App.removeWaterEntry(${i})" aria-label="Remove entry">✕</button>
            </div>
          `).join('')
        }
      </div>

      <button class="btn-danger btn-full mt-2" onclick="App.resetWater()">🔄 Reset Today</button>
    `;
  }

  function quickAddWater(ml) {
    Storage.addWaterEntry(ml);
    state.todayWater = Storage.getTodayWater();

    const totalMl = Water.getDailyTotal(state.todayWater);
    const goalMl = state.settings.waterGoal || Health.getFullReport(state.profile).waterGoal;
    const progress = Water.getProgress(totalMl, goalMl);

    if (progress.achieved && state.todayWater.length <= Water.QUICK_ADD.length + 2) {
      Storage.updateStreak('water');
      showToast('🏆 Daily water goal achieved!', 'success');
    } else {
      showToast(`💧 Added ${Water.formatMl(ml)}`, 'info');
    }

    if (state.currentPage === 'water') renderWaterPage();
  }

  function showCustomWaterModal() {
    const amount = prompt('Enter amount in ml:');
    const ml = parseInt(amount);
    if (ml > 0) quickAddWater(ml);
  }

  function removeWaterEntry(index) {
    const logs = Storage.getWaterLogs();
    const today = Storage.todayKey();
    if (logs[today]) {
      logs[today].splice(index, 1);
      Storage.saveWaterLogs(logs);
    }
    state.todayWater = Storage.getTodayWater();
    renderWaterPage();
  }

  function resetWater() {
    if (!confirm('Reset today\'s water intake?')) return;
    Storage.resetTodayWater();
    state.todayWater = Storage.getTodayWater();
    renderWaterPage();
    showToast('Water log reset', 'info');
  }

  // ── Sleep Page ────────────────────────────────────────────
  function renderSleepPage() {
    state.sleepLogs = Storage.getSleepLogs();
    const page = document.getElementById('page-sleep');
    if (!page) return;

    const avgStats = Sleep.getAverageStats(state.sleepLogs);
    const weekStats = Sleep.getWeeklyStats(state.sleepLogs);
    const lastEntry = state.sleepLogs.slice(-1)[0];
    const score = lastEntry ? Sleep.calcScore(lastEntry) : 0;
    const scoreLbl = Sleep.scoreLabel(score);
    const recs = Sleep.getRecommendations(lastEntry, state.profile.age || 18);
    const consistency = Sleep.getBedtimeConsistency(state.sleepLogs);

    page.innerHTML = `
      <!-- Sleep Score -->
      <div class="sleep-hero glass-card">
        <div class="sleep-score-ring">
          <svg viewBox="0 0 120 120" aria-label="Sleep score ${score}">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>
            <circle cx="60" cy="60" r="50" fill="none" stroke="${scoreLbl.color}" stroke-width="10"
              stroke-dasharray="${2 * Math.PI * 50}" stroke-dashoffset="${2 * Math.PI * 50 * (1 - score/100)}"
              stroke-linecap="round" transform="rotate(-90 60 60)"
              style="transition: stroke-dashoffset 0.8s ease"/>
          </svg>
          <div class="sleep-score-inner">
            <div class="sleep-score-num">${score}</div>
            <div class="sleep-score-label" style="color:${scoreLbl.color}">${scoreLbl.label}</div>
          </div>
        </div>
        <div class="sleep-summary">
          <div class="sleep-sum-item">
            <span class="ssl-val">${lastEntry ? Sleep.formatDuration(lastEntry.durationHrs) : '—'}</span>
            <span class="ssl-lab">Last Night</span>
          </div>
          <div class="sleep-sum-item">
            <span class="ssl-val">${Sleep.formatDuration(avgStats.avgDuration)}</span>
            <span class="ssl-lab">7-day Avg</span>
          </div>
          <div class="sleep-sum-item">
            <span class="ssl-val">${avgStats.avgScore}</span>
            <span class="ssl-lab">Avg Score</span>
          </div>
        </div>
      </div>

      <!-- Log Sleep Button -->
      <button class="btn-primary btn-full" onclick="App.showSleepModal()">
        🌙 Log Sleep Session
      </button>

      <!-- Weekly Chart -->
      <h2 class="section-title">📊 Weekly Pattern</h2>
      <div class="glass-card chart-card">
        <canvas id="sleepWeekChart" height="130"></canvas>
      </div>

      <!-- Consistency -->
      ${consistency ? `
        <div class="glass-card consistency-card">
          <span class="cons-icon">${consistency.consistent ? '✅' : '⚠️'}</span>
          <span class="cons-text">${consistency.label}</span>
        </div>
      ` : ''}

      <!-- Recommendations -->
      <h2 class="section-title">💡 Sleep Tips</h2>
      <div class="sleep-recs">
        ${recs.map(r => `
          <div class="sleep-rec glass-card">
            <span class="sr-icon">${r.icon}</span>
            <span class="sr-text">${r.text}</span>
          </div>
        `).join('')}
      </div>

      <!-- History -->
      <h2 class="section-title">Sleep History</h2>
      <div class="sleep-history">
        ${state.sleepLogs.slice(-7).reverse().map(s => `
          <div class="sleep-item glass-card">
            <div class="si-header">
              <span class="si-date">${new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span class="si-score" style="color:${Sleep.scoreLabel(Sleep.calcScore(s)).color}">${Sleep.calcScore(s)}</span>
              <button class="si-delete" onclick="App.deleteSleep('${s.id}')" aria-label="Delete sleep log">🗑️</button>
            </div>
            <div class="si-stats">
              <span>🛏 ${new Date(s.bedtime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>⏰ ${new Date(s.wakeTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>⏱ ${Sleep.formatDuration(s.durationHrs)}</span>
              <span>⭐ ${'★'.repeat(s.quality)}${'☆'.repeat(5-s.quality)}</span>
            </div>
          </div>
        `).join('')}
        ${state.sleepLogs.length === 0 ? '<div class="empty-state">No sleep logs yet.</div>' : ''}
      </div>
    `;

    // Render sleep chart
    renderSleepChart('sleepWeekChart', weekStats);
  }

  function renderSleepChart(canvasId, weekStats) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !window.Chart) return;
    if (state.charts[canvasId]) state.charts[canvasId].destroy();

    state.charts[canvasId] = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: weekStats.map(d => d.label),
        datasets: [
          {
            label: 'Sleep (hrs)',
            data: weekStats.map(d => d.durationHrs),
            backgroundColor: weekStats.map(d => d.durationHrs >= 7 ? 'rgba(100,60,200,0.8)' : 'rgba(255,0,51,0.6)'),
            borderRadius: 6,
          },
          {
            label: 'Goal (8hrs)',
            data: weekStats.map(() => 8),
            type: 'line',
            borderColor: 'rgba(255,255,255,0.3)',
            borderDash: [4,4],
            pointRadius: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#ccc', font: { size: 11 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#ccc' } },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#ccc', callback: v => v + 'h' },
            min: 0, max: 12,
          },
        },
      },
    });
  }

  function showSleepModal() {
    const modal = document.getElementById('modal-sleep');
    if (!modal) return;

    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>🌙 Log Sleep</h2>
          <button class="modal-close" onclick="App.closeModal('modal-sleep')">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Bedtime</label>
            <input type="datetime-local" id="sl-bedtime" class="form-input"
              value="${datetimeLocalValue(yesterday, 22, 30)}" aria-label="Bedtime">
          </div>
          <div class="form-group">
            <label>Wake Time</label>
            <input type="datetime-local" id="sl-wake" class="form-input"
              value="${datetimeLocalValue(now, now.getHours(), now.getMinutes())}" aria-label="Wake time">
          </div>
          <div class="form-group">
            <label>Sleep Quality</label>
            <div class="star-rating" id="star-rating" role="group" aria-label="Sleep quality rating">
              ${[1,2,3,4,5].map(n => `
                <button class="star ${n <= 3 ? 'active' : ''}" data-val="${n}"
                  onclick="App.setStarRating(${n})" aria-label="${n} star${n>1?'s':''}">★</button>
              `).join('')}
            </div>
            <input type="hidden" id="sl-quality" value="3">
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea id="sl-notes" class="form-input" rows="2" placeholder="Any notes about your sleep?"></textarea>
          </div>
          <div id="sl-duration-preview" class="duration-preview"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="App.closeModal('modal-sleep')">Cancel</button>
          <button class="btn-primary" onclick="App.saveSleepEntry()">💾 Save</button>
        </div>
      </div>
    `;

    // Live duration preview
    modal.querySelectorAll('#sl-bedtime, #sl-wake').forEach(el => {
      el.addEventListener('change', updateSleepPreview);
    });
    updateSleepPreview();

    modal.classList.add('active');
  }

  function datetimeLocalValue(d, h, m) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(h).padStart(2, '0');
    const mins = String(m).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${mins}`;
  }

  function updateSleepPreview() {
    const bed = document.getElementById('sl-bedtime')?.value;
    const wake = document.getElementById('sl-wake')?.value;
    const preview = document.getElementById('sl-duration-preview');
    if (!bed || !wake || !preview) return;
    let dur = (new Date(wake) - new Date(bed)) / 3600000;
    if (dur < 0) dur += 24;
    preview.innerHTML = `<span class="dur-icon">⏱</span> Sleep duration: <strong>${Sleep.formatDuration(dur)}</strong>`;
  }

  function setStarRating(val) {
    document.getElementById('sl-quality').value = val;
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= val);
    });
  }

  function saveSleepEntry() {
    const bed = document.getElementById('sl-bedtime')?.value;
    const wake = document.getElementById('sl-wake')?.value;
    const quality = parseInt(document.getElementById('sl-quality')?.value) || 3;
    const notes = document.getElementById('sl-notes')?.value || '';

    if (!bed || !wake) { showToast('Please enter both bedtime and wake time', 'error'); return; }

    const entry = Sleep.createEntry(bed, wake, quality, notes);
    Storage.saveSleepLog(entry);
    Storage.updateStreak('sleep');

    closeModal('modal-sleep');
    state.sleepLogs = Storage.getSleepLogs();
    renderSleepPage();
    showToast(`😴 Sleep logged — ${Sleep.formatDuration(entry.durationHrs)}`, 'success');
  }

  function deleteSleep(id) {
    if (!confirm('Delete this sleep log?')) return;
    Storage.deleteSleepLog(id);
    state.sleepLogs = Storage.getSleepLogs();
    renderSleepPage();
  }

  // ── Profile Page ──────────────────────────────────────────
  function renderProfilePage() {
    const page = document.getElementById('page-profile');
    if (!page) return;
    const profile = state.profile;
    const settings = state.settings;
    const report = Health.getFullReport(profile);

    page.innerHTML = `
      <!-- Avatar / Header -->
      <div class="profile-header glass-card">
        <div class="profile-avatar">${esc(profile.username.charAt(0))}</div>
        <div class="profile-info">
          <h2 class="profile-name">${esc(profile.username)}</h2>
          <p class="profile-email">${esc(profile.email)}</p>
          <div class="profile-badges">
            <span class="badge">Age ${esc(report.age)}</span>
            <span class="badge">${esc(profile.weight)}kg</span>
            <span class="badge">${esc(profile.heightFt)}&apos;${esc(profile.heightIn)}&quot;</span>
          </div>
        </div>
      </div>

      <!-- Edit Profile Form -->
      <h2 class="section-title">✏️ Edit Profile</h2>
      <div class="form-card glass-card">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="p-username" class="form-input" value="${esc(profile.username)}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Weight (kg)</label>
            <input type="number" id="p-weight" class="form-input" value="${esc(profile.weight)}" min="20" max="300">
          </div>
          <div class="form-group">
            <label>Height (cm)</label>
            <input type="number" id="p-heightCm" class="form-input" value="${esc(profile.heightCm)}" min="100" max="250">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Height Ft</label>
            <input type="number" id="p-heightFt" class="form-input" value="${esc(profile.heightFt)}" min="3" max="8">
          </div>
          <div class="form-group">
            <label>Height In</label>
            <input type="number" id="p-heightIn" class="form-input" value="${esc(profile.heightIn)}" min="0" max="11">
          </div>
        </div>
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" id="p-dob" class="form-input" value="${esc(profile.dob)}">
        </div>
        <div class="form-group">
          <label>Email (reminders)</label>
          <input type="email" id="p-email" class="form-input" value="${esc(profile.email)}">
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select id="p-gender" class="form-input">
            <option value="male" ${profile.gender === 'male' ? 'selected' : ''}>Male</option>
            <option value="female" ${profile.gender === 'female' ? 'selected' : ''}>Female</option>
          </select>
        </div>
        <div class="form-group">
          <label>Activity Level</label>
          <select id="p-activity" class="form-input">
            ${Object.entries(Health.ACTIVITY_LABELS).map(([k, v]) => `
              <option value="${esc(k)}" ${profile.activityLevel === k ? 'selected' : ''}>${esc(v)}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Goal</label>
          <select id="p-goal" class="form-input">
            <option value="lose_fat" ${profile.goal === 'lose_fat' ? 'selected' : ''}>Lose Fat</option>
            <option value="maintain" ${profile.goal === 'maintain' ? 'selected' : ''}>Maintain</option>
            <option value="build_muscle" ${profile.goal === 'build_muscle' ? 'selected' : ''}>Build Muscle</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fitness Level</label>
          <select id="p-fitnessLevel" class="form-input">
            <option value="beginner" ${profile.fitnessLevel === 'beginner' ? 'selected' : ''}>Beginner</option>
            <option value="intermediate" ${profile.fitnessLevel === 'intermediate' ? 'selected' : ''}>Intermediate</option>
            <option value="advanced" ${profile.fitnessLevel === 'advanced' ? 'selected' : ''}>Advanced</option>
          </select>
        </div>
        <button class="btn-primary btn-full" onclick="App.saveProfile()">💾 Save Profile</button>
      </div>

      <!-- Health Metrics -->
      <h2 class="section-title">📊 Health Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card glass-card">
          <div class="metric-title">BMI</div>
          <div class="metric-value" style="color:${esc(report.bmiCat.color)}">${esc(report.bmi)}</div>
          <div class="metric-label">${esc(report.bmiCat.label)}</div>
        </div>
        <div class="metric-card glass-card">
          <div class="metric-title">BMR</div>
          <div class="metric-value">${esc(report.bmr)}</div>
          <div class="metric-label">kcal/day at rest</div>
        </div>
        <div class="metric-card glass-card">
          <div class="metric-title">TDEE</div>
          <div class="metric-value">${esc(report.tdee)}</div>
          <div class="metric-label">kcal/day total</div>
        </div>
        <div class="metric-card glass-card">
          <div class="metric-title">Goal Calories</div>
          <div class="metric-value">${esc(report.goalCals)}</div>
          <div class="metric-label">${esc(profile.goal.replace('_', ' '))}</div>
        </div>
      </div>

      <!-- Reminder Settings -->
      <h2 class="section-title">🔔 Reminder Settings</h2>
      <div class="glass-card form-card">
        <div class="form-group">
          <label>Daily Reminder Time</label>
          <input type="time" id="s-reminder" class="form-input" value="${esc(settings.reminderTime)}">
        </div>
        <div class="form-group">
          <label>Daily Water Goal (ml)</label>
          <input type="number" id="s-watergoal" class="form-input" value="${esc(settings.waterGoal)}" min="500" max="5000">
        </div>
        <a href="mailto:${esc(profile.email)}?subject=Fitness%20Check-in%20Reminder&body=Hi%20${encodeURIComponent(profile.username)}%2C%20time%20to%20log%20your%20fitness%20data!"
           class="btn-secondary btn-full" style="text-align:center;display:block;text-decoration:none" rel="noopener">
          📧 Send Test Reminder to ${esc(profile.email)}
        </a>
        <button class="btn-primary btn-full mt-1" onclick="App.saveSettings()">💾 Save Settings</button>
      </div>

      <!-- Data Export -->
      <h2 class="section-title">💾 Data</h2>
      <div class="glass-card form-card">
        <button class="btn-secondary btn-full" onclick="App.exportData()">📥 Export All Data (JSON)</button>
      </div>
    `;
  }

  function saveProfile() {
    const fields = ['username', 'weight', 'heightCm', 'heightFt', 'heightIn', 'dob', 'email', 'gender', 'activityLevel', 'goal', 'fitnessLevel'];
    const updated = { ...state.profile };
    fields.forEach(f => {
      const el = document.getElementById('p-' + f);
      if (el) {
        const v = el.value;
        updated[f] = ['weight', 'heightCm', 'heightFt', 'heightIn'].includes(f) ? parseFloat(v) : v;
      }
    });
    updated.age = Health.calcAge(updated.dob);
    Storage.saveProfile(updated);
    state.profile = updated;
    renderProfilePage();
    showToast('✅ Profile saved!', 'success');
  }

  function saveSettings() {
    const updated = { ...state.settings };
    const rt = document.getElementById('s-reminder');
    const wg = document.getElementById('s-watergoal');
    if (rt) updated.reminderTime = rt.value;
    if (wg) updated.waterGoal = parseInt(wg.value) || state.settings.waterGoal;
    Storage.saveSettings(updated);
    state.settings = updated;
    showToast('✅ Settings saved!', 'success');
  }

  function exportData() {
    const data = Storage.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'craig_ross_fitness_data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Modal Utils ───────────────────────────────────────────
  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
  }

  // ── Toast ─────────────────────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  return {
    init, navigateTo,
    showWorkoutModal, saveWorkout, deleteWorkout,
    setWorkoutType, addExercise, removeExercise, addSet, removeSet,
    updateSetField, showAddExercisePanel, showExercisesForGroup, addCustomExercise,
    quickAddWater, showCustomWaterModal, removeWaterEntry, resetWater,
    showSleepModal, saveSleepEntry, deleteSleep, setStarRating,
    saveProfile, saveSettings, exportData,
    closeModal, showToast, dismissReminder,
  };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
