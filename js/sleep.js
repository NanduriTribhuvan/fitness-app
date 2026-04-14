// ============================================================
// sleep.js — Sleep tracking
// ============================================================

const Sleep = (() => {

  // ── Create Log Entry ──────────────────────────────────────
  function createEntry(bedtime, wakeTime, quality, notes) {
    const bed = new Date(bedtime);
    const wake = new Date(wakeTime);
    let durationMs = wake - bed;
    if (durationMs < 0) durationMs += 24 * 3600000; // next day
    const durationHrs = +(durationMs / 3600000).toFixed(2);

    return {
      id: 'sl_' + Date.now(),
      bedtime,
      wakeTime,
      durationHrs,
      quality: quality || 3,
      notes: notes || '',
      date: wake.toISOString().slice(0, 10), // record under wake date
    };
  }

  // ── Duration ─────────────────────────────────────────────
  function formatDuration(hrs) {
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return `${h}h ${m}m`;
  }

  // ── Sleep Score (0-100) ───────────────────────────────────
  function calcScore(entry) {
    const { durationHrs, quality } = entry;
    // Duration score: 8hrs = 100, every hr off = -12.5
    const durationScore = Math.max(0, 100 - Math.abs(durationHrs - 8) * 12.5);
    // Quality score: 1-5 stars → 0-100
    const qualityScore = (quality / 5) * 100;
    return Math.round((durationScore * 0.6) + (qualityScore * 0.4));
  }

  // ── Score Label ──────────────────────────────────────────
  function scoreLabel(score) {
    if (score >= 85) return { label: 'Excellent', color: '#00FF88' };
    if (score >= 70) return { label: 'Good', color: '#7BFF58' };
    if (score >= 55) return { label: 'Fair', color: '#FFB300' };
    if (score >= 40) return { label: 'Poor', color: '#FF6B35' };
    return { label: 'Very Poor', color: '#FF0033' };
  }

  // ── Weekly Stats ─────────────────────────────────────────
  function getWeeklyStats(sleepLogs) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const entry = sleepLogs.filter(s => s.date === key).slice(-1)[0];
      days.push({
        key,
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        entry: entry || null,
        durationHrs: entry ? entry.durationHrs : 0,
        score: entry ? calcScore(entry) : 0,
      });
    }
    return days;
  }

  // ── Average Sleep ─────────────────────────────────────────
  function getAverageStats(sleepLogs) {
    const recent = sleepLogs.slice(-7);
    if (!recent.length) return { avgDuration: 0, avgScore: 0, avgQuality: 0 };
    const avgDuration = +(recent.reduce((s, e) => s + e.durationHrs, 0) / recent.length).toFixed(1);
    const avgScore = Math.round(recent.reduce((s, e) => s + calcScore(e), 0) / recent.length);
    const avgQuality = +(recent.reduce((s, e) => s + e.quality, 0) / recent.length).toFixed(1);
    return { avgDuration, avgScore, avgQuality };
  }

  // ── Recommendations ───────────────────────────────────────
  function getRecommendations(entry, age) {
    const recs = [];
    if (!entry) {
      recs.push({ icon: '📝', text: 'Log your sleep to get personalized recommendations.' });
      return recs;
    }

    const { durationHrs, quality } = entry;
    const score = calcScore(entry);

    // Duration
    const idealMin = age <= 17 ? 8 : 7;
    const idealMax = age <= 17 ? 10 : 9;
    if (durationHrs < idealMin) {
      recs.push({ icon: '⏰', text: `You slept ${formatDuration(durationHrs)}. Aim for ${idealMin}–${idealMax} hrs. Try sleeping 30 mins earlier.` });
    } else if (durationHrs > idealMax + 1) {
      recs.push({ icon: '☀️', text: `Oversleeping (${formatDuration(durationHrs)}) can cause grogginess. Aim for ${idealMin}–${idealMax} hrs.` });
    } else {
      recs.push({ icon: '✅', text: `Good sleep duration! ${formatDuration(durationHrs)} is within the optimal range.` });
    }

    // Quality
    if (quality <= 2) {
      recs.push({ icon: '🌙', text: 'Poor sleep quality? Avoid screens 1hr before bed, keep room cool (16–20°C) and dark.' });
    } else if (quality === 3) {
      recs.push({ icon: '💤', text: 'Average sleep quality. Try a consistent bedtime, no caffeine after 3pm, and a wind-down routine.' });
    }

    // Score
    if (score < 60) {
      recs.push({ icon: '🧘', text: 'Try relaxation techniques: deep breathing, progressive muscle relaxation, or light stretching before bed.' });
    }

    return recs;
  }

  // ── Consistency ──────────────────────────────────────────
  function getBedtimeConsistency(sleepLogs) {
    const recent = sleepLogs.slice(-7);
    if (recent.length < 3) return null;
    const bedHours = recent.map(e => {
      const d = new Date(e.bedtime);
      return d.getHours() + d.getMinutes() / 60;
    });
    const avg = bedHours.reduce((s, h) => s + h, 0) / bedHours.length;
    const variance = bedHours.reduce((s, h) => s + Math.abs(h - avg), 0) / bedHours.length;
    const consistent = variance < 0.75;
    return {
      avgBedtime: avg,
      variance: +variance.toFixed(2),
      consistent,
      label: consistent ? 'Consistent schedule 👍' : `Varies ~${Math.round(variance * 60)} mins — try to keep a fixed bedtime`,
    };
  }

  return {
    createEntry, formatDuration, calcScore, scoreLabel,
    getWeeklyStats, getAverageStats, getRecommendations, getBedtimeConsistency,
  };
})();
