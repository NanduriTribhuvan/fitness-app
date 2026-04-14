// ============================================================
// storage.js — LocalStorage persistence layer
// ============================================================

const Storage = (() => {
  const PREFIX = 'cr_fitness_';

  const keys = {
    PROFILE: PREFIX + 'profile',
    WORKOUTS: PREFIX + 'workouts',
    WATER_LOGS: PREFIX + 'water_logs',
    SLEEP_LOGS: PREFIX + 'sleep_logs',
    SETTINGS: PREFIX + 'settings',
    PRs: PREFIX + 'personal_records',
    STREAKS: PREFIX + 'streaks',
    LAST_REMINDER: PREFIX + 'last_reminder',
  };

  const defaultProfile = {
    username: 'CRAIG ROSS',
    weight: 65,
    weightUnit: 'kg',
    heightCm: 173,
    heightFt: 5,
    heightIn: 8,
    dob: '2007-06-25',
    age: 18,
    email: 'craigross252007@gmail.com',
    gender: 'male',
    activityLevel: 'moderate',
    goal: 'maintain',
    fitnessLevel: 'intermediate',
  };

  const defaultSettings = {
    reminderTime: '08:00',
    waterGoal: 2200,
    sleepGoal: 8,
    theme: 'dark',
    notifications: true,
  };

  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // ── Profile ──────────────────────────────────────────────
  function getProfile() {
    return get(keys.PROFILE) || defaultProfile;
  }
  function saveProfile(data) {
    return set(keys.PROFILE, { ...defaultProfile, ...data });
  }

  // ── Settings ─────────────────────────────────────────────
  function getSettings() {
    return get(keys.SETTINGS) || defaultSettings;
  }
  function saveSettings(data) {
    return set(keys.SETTINGS, { ...defaultSettings, ...data });
  }

  // ── Workouts ─────────────────────────────────────────────
  function getWorkouts() {
    return get(keys.WORKOUTS) || [];
  }
  function saveWorkout(workout) {
    const list = getWorkouts();
    const idx = list.findIndex(w => w.id === workout.id);
    if (idx >= 0) list[idx] = workout;
    else list.push(workout);
    return set(keys.WORKOUTS, list);
  }
  function deleteWorkout(id) {
    const list = getWorkouts().filter(w => w.id !== id);
    return set(keys.WORKOUTS, list);
  }

  // ── Personal Records ─────────────────────────────────────
  function getPRs() {
    return get(keys.PRs) || {};
  }
  function updatePR(exerciseName, weight, reps, date) {
    const prs = getPRs();
    const existing = prs[exerciseName];
    if (!existing || weight > existing.weight || (weight === existing.weight && reps > existing.reps)) {
      prs[exerciseName] = { weight, reps, date };
      set(keys.PRs, prs);
      return true; // new PR!
    }
    return false;
  }

  // ── Water ─────────────────────────────────────────────────
  function getWaterLogs() {
    return get(keys.WATER_LOGS) || {};
  }
  function getTodayWater() {
    const today = todayKey();
    return getWaterLogs()[today] || [];
  }
  function addWaterEntry(ml) {
    const logs = getWaterLogs();
    const today = todayKey();
    if (!logs[today]) logs[today] = [];
    logs[today].push({ ml, time: new Date().toISOString() });
    return set(keys.WATER_LOGS, logs);
  }
  function resetTodayWater() {
    const logs = getWaterLogs();
    logs[todayKey()] = [];
    return set(keys.WATER_LOGS, logs);
  }
  function saveWaterLogs(logs) {
    return set(keys.WATER_LOGS, logs);
  }

  // ── Sleep ─────────────────────────────────────────────────
  function getSleepLogs() {
    return get(keys.SLEEP_LOGS) || [];
  }
  function saveSleepLog(entry) {
    const logs = getSleepLogs();
    const idx = logs.findIndex(s => s.id === entry.id);
    if (idx >= 0) logs[idx] = entry;
    else logs.push(entry);
    return set(keys.SLEEP_LOGS, logs);
  }
  function deleteSleepLog(id) {
    const logs = getSleepLogs().filter(s => s.id !== id);
    return set(keys.SLEEP_LOGS, logs);
  }

  // ── Streaks ───────────────────────────────────────────────
  function getStreaks() {
    return get(keys.STREAKS) || { workout: 0, water: 0, sleep: 0, lastWorkout: null, lastWater: null, lastSleep: null };
  }
  function updateStreak(type) {
    const streaks = getStreaks();
    const today = todayKey();
    const lastKey = 'last' + type.charAt(0).toUpperCase() + type.slice(1);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yKey = dateKey(yesterday);
    if (streaks[lastKey] === today) return streaks;
    if (streaks[lastKey] === yKey) streaks[type]++;
    else streaks[type] = 1;
    streaks[lastKey] = today;
    set(keys.STREAKS, streaks);
    return streaks;
  }

  // ── Reminders ─────────────────────────────────────────────
  function getLastReminder() { return get(keys.LAST_REMINDER); }
  function setLastReminder(val) { return set(keys.LAST_REMINDER, val); }

  // ── Export / Import ───────────────────────────────────────
  function exportAll() {
    return {
      profile: getProfile(),
      settings: getSettings(),
      workouts: getWorkouts(),
      waterLogs: getWaterLogs(),
      sleepLogs: getSleepLogs(),
      prs: getPRs(),
      streaks: getStreaks(),
      exportedAt: new Date().toISOString(),
    };
  }

  // ── Helpers ───────────────────────────────────────────────
  function todayKey() {
    return dateKey(new Date());
  }
  function dateKey(d) {
    return d.toISOString().slice(0, 10);
  }

  return {
    getProfile, saveProfile,
    getSettings, saveSettings,
    getWorkouts, saveWorkout, deleteWorkout,
    getPRs, updatePR,
    getWaterLogs, getTodayWater, addWaterEntry, resetTodayWater, saveWaterLogs,
    getSleepLogs, saveSleepLog, deleteSleepLog,
    getStreaks, updateStreak,
    getLastReminder, setLastReminder,
    exportAll,
    todayKey, dateKey,
  };
})();
