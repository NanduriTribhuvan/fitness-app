// ============================================================
// health.js — BMI, BMR, TDEE, macro calculations + suggestions
// ============================================================

const Health = (() => {

  // Activity multipliers (Mifflin-St Jeor)
  const ACTIVITY_MULTIPLIERS = {
    sedentary:   1.2,
    light:       1.375,
    moderate:    1.55,
    active:      1.725,
    very_active: 1.9,
  };

  const ACTIVITY_LABELS = {
    sedentary:   'Sedentary (desk job, no exercise)',
    light:       'Lightly Active (1–3 days/week)',
    moderate:    'Moderately Active (3–5 days/week)',
    active:      'Very Active (6–7 days/week)',
    very_active: 'Extra Active (athlete / physical job)',
  };

  // ── Age ────────────────────────────────────────────────────
  function calcAge(dob) {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  // ── BMI ────────────────────────────────────────────────────
  function calcBMI(weightKg, heightCm) {
    const hm = heightCm / 100;
    return +(weightKg / (hm * hm)).toFixed(1);
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: '#3B9EFF' };
    if (bmi < 25)   return { label: 'Normal Weight', color: '#00FF88' };
    if (bmi < 30)   return { label: 'Overweight', color: '#FFB300' };
    return { label: 'Obese', color: '#FF4444' };
  }

  // ── BMR (Mifflin-St Jeor) ──────────────────────────────────
  function calcBMR(weightKg, heightCm, age, gender) {
    const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    return Math.round(gender === 'male' ? base + 5 : base - 161);
  }

  // ── TDEE ──────────────────────────────────────────────────
  function calcTDEE(bmr, activityLevel) {
    return Math.round(bmr * (ACTIVITY_MULTIPLIERS[activityLevel] || 1.55));
  }

  // ── Goal Calories ─────────────────────────────────────────
  function calcGoalCalories(tdee, goal) {
    const adj = { lose_fat: -500, maintain: 0, build_muscle: +300 };
    return Math.round(tdee + (adj[goal] || 0));
  }

  // ── Macros ────────────────────────────────────────────────
  function calcMacros(calories, goal, weightKg) {
    // Protein: 2.2g/kg for muscle, 2g/kg for maintain, 1.8g/kg for cut
    const proteinPerKg = goal === 'build_muscle' ? 2.2 : goal === 'lose_fat' ? 1.8 : 2.0;
    const proteinG = Math.round(weightKg * proteinPerKg);
    const proteinCal = proteinG * 4;

    // Fat: 25-30% calories
    const fatCal = Math.round(calories * 0.27);
    const fatG = Math.round(fatCal / 9);

    // Carbs: remainder
    const carbCal = calories - proteinCal - fatCal;
    const carbG = Math.round(carbCal / 4);

    return { proteinG, carbG, fatG, proteinCal, carbCal, fatCal };
  }

  // ── Water Goal ────────────────────────────────────────────
  function calcWaterGoalMl(weightKg) {
    return Math.round(weightKg * 33.8); // ~33-35ml per kg
  }

  // ── Complete Report ───────────────────────────────────────
  function getFullReport(profile) {
    const age = calcAge(profile.dob);
    const bmi = calcBMI(profile.weight, profile.heightCm);
    const bmiCat = bmiCategory(bmi);
    const bmr = calcBMR(profile.weight, profile.heightCm, age, profile.gender);
    const tdee = calcTDEE(bmr, profile.activityLevel);
    const goalCals = calcGoalCalories(tdee, profile.goal);
    const macros = calcMacros(goalCals, profile.goal, profile.weight);
    const waterGoal = calcWaterGoalMl(profile.weight);

    return { age, bmi, bmiCat, bmr, tdee, goalCals, macros, waterGoal };
  }

  // ── Workout Suggestions ───────────────────────────────────
  function getWorkoutSuggestions(profile, recentWorkouts) {
    const suggestions = [];
    const age = calcAge(profile.dob);
    const bmi = calcBMI(profile.weight, profile.heightCm);
    const level = profile.fitnessLevel || 'intermediate';
    const goal = profile.goal || 'maintain';

    // Count workouts this week
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = recentWorkouts.filter(w => new Date(w.date) > weekAgo);
    const weekCount = thisWeek.length;

    // Frequency suggestions
    if (weekCount < 3) {
      suggestions.push({
        type: 'frequency',
        icon: '📅',
        title: 'Increase Workout Frequency',
        body: `You've logged ${weekCount} workout${weekCount !== 1 ? 's' : ''} this week. Aim for at least 3–4 sessions for noticeable progress.`,
        priority: 'high',
      });
    } else if (weekCount >= 6) {
      suggestions.push({
        type: 'recovery',
        icon: '😴',
        title: 'Schedule a Rest Day',
        body: `Training ${weekCount} days this week is intense. Your muscles need 48–72 hrs recovery. Consider an active recovery or rest day tomorrow.`,
        priority: 'medium',
      });
    }

    // Progressive overload
    if (weekCount >= 3) {
      suggestions.push({
        type: 'progressive_overload',
        icon: '📈',
        title: 'Apply Progressive Overload',
        body: `Add 2.5–5kg to your compound lifts (squat, deadlift, bench) every 1–2 weeks. For isolation, increase reps from 8→12 before adding weight.`,
        priority: 'high',
      });
    }

    // Goal-based
    if (goal === 'lose_fat') {
      suggestions.push({
        type: 'goal',
        icon: '🔥',
        title: 'Fat Loss Strategy',
        body: `Combine 2–3 strength sessions (preserves muscle) with 2 cardio/HIIT sessions. Keep workouts under 60 mins. Fasted cardio (morning) can boost fat burning.`,
        priority: 'high',
      });
    } else if (goal === 'build_muscle') {
      suggestions.push({
        type: 'goal',
        icon: '💪',
        title: 'Muscle Building Focus',
        body: `Train each muscle group 2× per week. Focus on compound lifts: bench press, squats, deadlifts, rows. Target 6–12 reps @ 70-85% 1RM for hypertrophy.`,
        priority: 'high',
      });
    } else {
      suggestions.push({
        type: 'goal',
        icon: '⚖️',
        title: 'Maintenance Plan',
        body: `Maintain your current fitness with 3–4 varied sessions per week. Mix strength, cardio and flexibility to stay well-rounded.`,
        priority: 'medium',
      });
    }

    // Level-based tips
    const levelTips = {
      beginner: {
        icon: '🌱',
        title: 'Beginner Tip: Master the Basics',
        body: 'Focus on form over weight. Learn bodyweight movements first: push-ups, squats, lunges, planks. Progress to free weights after 4–6 weeks.',
      },
      intermediate: {
        icon: '🎯',
        title: 'Intermediate: Periodize Your Training',
        body: 'Use 4–6 week training blocks. Try linear periodization: Week 1–2 hypertrophy (12 reps), Week 3–4 strength (6 reps), Week 5–6 power (3 reps).',
      },
      advanced: {
        icon: '🏆',
        title: 'Advanced: Optimize Recovery',
        body: 'At your level, recovery IS training. Prioritize 7–9 hrs sleep, post-workout nutrition within 30–45 mins, and deload weeks every 4–6 weeks.',
      },
    };
    if (levelTips[level]) {
      suggestions.push({ type: 'level', priority: 'medium', ...levelTips[level] });
    }

    // BMI-based
    if (bmi < 18.5) {
      suggestions.push({
        type: 'bmi',
        icon: '⚠️',
        title: 'Underweight Alert',
        body: `Your BMI is ${bmi}. Focus on strength training + calorie surplus to build lean muscle. Avoid excessive cardio.`,
        priority: 'high',
      });
    } else if (bmi >= 30) {
      suggestions.push({
        type: 'bmi',
        icon: '💡',
        title: 'Focus on Low-Impact Cardio',
        body: `Protect your joints with swimming, cycling, or walking. Aim for 150 mins moderate cardio/week alongside strength work.`,
        priority: 'medium',
      });
    }

    // Age-based (for young athletes)
    if (age <= 20) {
      suggestions.push({
        type: 'age',
        icon: '⚡',
        title: 'Young Athlete Advantage',
        body: `At ${age}, your recovery is excellent! You can handle higher training volume. Still prioritize sleep (8–10 hrs) for optimal growth hormone release.`,
        priority: 'low',
      });
    }

    // Sort by priority
    const order = { high: 0, medium: 1, low: 2 };
    suggestions.sort((a, b) => order[a.priority] - order[b.priority]);

    return suggestions.slice(0, 5);
  }

  // ── Muscle Group Recovery ─────────────────────────────────
  function getMuscleRecovery(recentWorkouts) {
    const muscleLastWorked = {};
    const now = new Date();
    recentWorkouts.slice(-10).forEach(w => {
      if (w.exercises) {
        w.exercises.forEach(ex => {
          (ex.muscles || []).forEach(m => {
            if (!muscleLastWorked[m]) muscleLastWorked[m] = new Date(w.date);
          });
        });
      }
    });

    return Object.entries(muscleLastWorked).map(([muscle, lastDate]) => {
      const hoursAgo = (now - new Date(lastDate)) / 3600000;
      const recoveryHours = 48;
      const pct = Math.min(100, Math.round((hoursAgo / recoveryHours) * 100));
      return { muscle, hoursAgo: Math.round(hoursAgo), pct, ready: pct >= 100 };
    });
  }

  return {
    calcAge, calcBMI, bmiCategory, calcBMR, calcTDEE, calcGoalCalories,
    calcMacros, calcWaterGoalMl, getFullReport,
    getWorkoutSuggestions, getMuscleRecovery,
    ACTIVITY_LABELS,
  };
})();
