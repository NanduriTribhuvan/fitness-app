// ============================================================
// water.js — Water intake tracking
// ============================================================

const Water = (() => {

  const QUICK_ADD = [250, 500, 750, 1000];

  // ── Daily Total ───────────────────────────────────────────
  function getDailyTotal(entries) {
    return entries.reduce((sum, e) => sum + e.ml, 0);
  }

  // ── Progress ──────────────────────────────────────────────
  function getProgress(totalMl, goalMl) {
    const pct = Math.min(100, Math.round((totalMl / goalMl) * 100));
    return { pct, remaining: Math.max(0, goalMl - totalMl), achieved: totalMl >= goalMl };
  }

  // ── Timeline ──────────────────────────────────────────────
  function getTimeline(entries) {
    return entries.map(e => ({
      ...e,
      label: formatMl(e.ml),
      timeLabel: new Date(e.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }));
  }

  // ── Weekly Stats ──────────────────────────────────────────
  function getWeeklyStats(waterLogs, goalMl) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entries = waterLogs[key] || [];
      const total = getDailyTotal(entries);
      days.push({
        key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        total,
        pct: Math.min(100, Math.round((total / goalMl) * 100)),
        achieved: total >= goalMl,
      });
    }
    return days;
  }

  // ── Hourly Reminder Status ────────────────────────────────
  function getHourlyStatus(entries) {
    const hours = [];
    for (let h = 6; h <= 22; h++) {
      const start = new Date(); start.setHours(h, 0, 0, 0);
      const end = new Date(); end.setHours(h + 1, 0, 0, 0);
      const drank = entries.filter(e => {
        const t = new Date(e.time);
        return t >= start && t < end;
      });
      hours.push({ hour: h, drank: drank.length > 0, total: getDailyTotal(drank) });
    }
    return hours;
  }

  // ── Smart Suggestion ─────────────────────────────────────
  function getWaterSuggestion(totalMl, goalMl) {
    const now = new Date();
    const hour = now.getHours();
    const remaining = goalMl - totalMl;
    if (remaining <= 0) return { emoji: '🏆', text: `Goal achieved! Great hydration today!` };

    const hoursLeft = Math.max(1, 22 - hour);
    const mlPerHour = Math.round(remaining / hoursLeft);

    if (hour < 8) return { emoji: '🌅', text: `Start your day with a glass of water!` };
    if (hour >= 20) return { emoji: '🌙', text: `${formatMl(remaining)} remaining. Try to finish before bed.` };
    return { emoji: '💧', text: `Drink ~${formatMl(mlPerHour)} per hour to hit your goal.` };
  }

  // ── Format ────────────────────────────────────────────────
  function formatMl(ml) {
    if (ml >= 1000) return (ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1) + 'L';
    return ml + 'ml';
  }

  return {
    QUICK_ADD,
    getDailyTotal, getProgress, getTimeline,
    getWeeklyStats, getHourlyStatus, getWaterSuggestion,
    formatMl,
  };
})();
