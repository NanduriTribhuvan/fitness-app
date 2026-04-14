// ============================================================
// workout.js — Workout tracking, exercise library, PRs
// ============================================================

const Workout = (() => {

  // ── Exercise Library ──────────────────────────────────────
  const EXERCISE_DB = {
    chest: [
      { name: 'Bench Press', type: 'strength', muscles: ['chest', 'triceps', 'shoulders'], equipment: 'barbell' },
      { name: 'Incline Bench Press', type: 'strength', muscles: ['chest', 'shoulders'], equipment: 'barbell' },
      { name: 'Dumbbell Flyes', type: 'strength', muscles: ['chest'], equipment: 'dumbbell' },
      { name: 'Push-Ups', type: 'strength', muscles: ['chest', 'triceps'], equipment: 'bodyweight' },
      { name: 'Cable Crossover', type: 'strength', muscles: ['chest'], equipment: 'cable' },
    ],
    back: [
      { name: 'Deadlift', type: 'strength', muscles: ['back', 'glutes', 'hamstrings'], equipment: 'barbell' },
      { name: 'Pull-Ups', type: 'strength', muscles: ['back', 'biceps'], equipment: 'bodyweight' },
      { name: 'Barbell Row', type: 'strength', muscles: ['back', 'biceps'], equipment: 'barbell' },
      { name: 'Lat Pulldown', type: 'strength', muscles: ['back', 'biceps'], equipment: 'cable' },
      { name: 'Seated Cable Row', type: 'strength', muscles: ['back'], equipment: 'cable' },
      { name: 'Dumbbell Row', type: 'strength', muscles: ['back', 'biceps'], equipment: 'dumbbell' },
    ],
    shoulders: [
      { name: 'Overhead Press', type: 'strength', muscles: ['shoulders', 'triceps'], equipment: 'barbell' },
      { name: 'Dumbbell Shoulder Press', type: 'strength', muscles: ['shoulders'], equipment: 'dumbbell' },
      { name: 'Lateral Raises', type: 'strength', muscles: ['shoulders'], equipment: 'dumbbell' },
      { name: 'Front Raises', type: 'strength', muscles: ['shoulders'], equipment: 'dumbbell' },
      { name: 'Face Pulls', type: 'strength', muscles: ['shoulders', 'back'], equipment: 'cable' },
    ],
    arms: [
      { name: 'Barbell Curl', type: 'strength', muscles: ['biceps'], equipment: 'barbell' },
      { name: 'Dumbbell Curl', type: 'strength', muscles: ['biceps'], equipment: 'dumbbell' },
      { name: 'Hammer Curl', type: 'strength', muscles: ['biceps', 'forearms'], equipment: 'dumbbell' },
      { name: 'Tricep Pushdown', type: 'strength', muscles: ['triceps'], equipment: 'cable' },
      { name: 'Skull Crushers', type: 'strength', muscles: ['triceps'], equipment: 'barbell' },
      { name: 'Dips', type: 'strength', muscles: ['triceps', 'chest'], equipment: 'bodyweight' },
    ],
    legs: [
      { name: 'Squat', type: 'strength', muscles: ['quads', 'glutes', 'hamstrings'], equipment: 'barbell' },
      { name: 'Leg Press', type: 'strength', muscles: ['quads', 'glutes'], equipment: 'machine' },
      { name: 'Romanian Deadlift', type: 'strength', muscles: ['hamstrings', 'glutes'], equipment: 'barbell' },
      { name: 'Leg Curls', type: 'strength', muscles: ['hamstrings'], equipment: 'machine' },
      { name: 'Leg Extensions', type: 'strength', muscles: ['quads'], equipment: 'machine' },
      { name: 'Calf Raises', type: 'strength', muscles: ['calves'], equipment: 'machine' },
      { name: 'Lunges', type: 'strength', muscles: ['quads', 'glutes'], equipment: 'dumbbell' },
    ],
    core: [
      { name: 'Plank', type: 'strength', muscles: ['core'], equipment: 'bodyweight' },
      { name: 'Crunches', type: 'strength', muscles: ['core'], equipment: 'bodyweight' },
      { name: 'Russian Twists', type: 'strength', muscles: ['core'], equipment: 'bodyweight' },
      { name: 'Hanging Leg Raise', type: 'strength', muscles: ['core'], equipment: 'bodyweight' },
      { name: 'Ab Wheel', type: 'strength', muscles: ['core'], equipment: 'equipment' },
    ],
    cardio: [
      { name: 'Running', type: 'cardio', muscles: ['legs', 'core'], equipment: 'none' },
      { name: 'Cycling', type: 'cardio', muscles: ['legs'], equipment: 'bike' },
      { name: 'Jump Rope', type: 'cardio', muscles: ['legs', 'shoulders'], equipment: 'rope' },
      { name: 'Rowing Machine', type: 'cardio', muscles: ['back', 'legs'], equipment: 'machine' },
      { name: 'Swimming', type: 'cardio', muscles: ['full_body'], equipment: 'pool' },
      { name: 'Stair Climber', type: 'cardio', muscles: ['legs', 'glutes'], equipment: 'machine' },
    ],
    hiit: [
      { name: 'Burpees', type: 'hiit', muscles: ['full_body'], equipment: 'bodyweight' },
      { name: 'Box Jumps', type: 'hiit', muscles: ['legs', 'core'], equipment: 'box' },
      { name: 'Mountain Climbers', type: 'hiit', muscles: ['core', 'shoulders'], equipment: 'bodyweight' },
      { name: 'Jumping Jacks', type: 'hiit', muscles: ['full_body'], equipment: 'bodyweight' },
      { name: 'Kettlebell Swings', type: 'hiit', muscles: ['glutes', 'back'], equipment: 'kettlebell' },
    ],
    flexibility: [
      { name: 'Hip Flexor Stretch', type: 'flexibility', muscles: ['hips'], equipment: 'none' },
      { name: 'Hamstring Stretch', type: 'flexibility', muscles: ['hamstrings'], equipment: 'none' },
      { name: 'Shoulder Stretch', type: 'flexibility', muscles: ['shoulders'], equipment: 'none' },
      { name: 'Yoga Flow', type: 'flexibility', muscles: ['full_body'], equipment: 'mat' },
      { name: 'Foam Rolling', type: 'flexibility', muscles: ['full_body'], equipment: 'foam_roller' },
    ],
  };

  const WORKOUT_TYPES = ['Strength', 'Cardio', 'HIIT', 'Flexibility', 'Sports'];
  const MUSCLE_GROUPS = Object.keys(EXERCISE_DB).filter(k => k !== 'cardio' && k !== 'hiit' && k !== 'flexibility');

  // ── Workout CRUD ──────────────────────────────────────────
  function createWorkout(type, name, exercises = []) {
    return {
      id: 'w_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type,
      name: name || type + ' Session',
      date: new Date().toISOString(),
      exercises,
      duration: 0,
      notes: '',
      completed: false,
    };
  }

  function createExercise(exerciseName, muscleGroup) {
    const dbEx = findExercise(exerciseName);
    return {
      id: 'ex_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: exerciseName,
      muscleGroup: muscleGroup || 'other',
      muscles: dbEx ? dbEx.muscles : [],
      type: dbEx ? dbEx.type : 'strength',
      sets: [],
    };
  }

  function createSet(weight, reps, duration, distance) {
    return {
      id: 'set_' + Date.now(),
      weight: weight || 0,
      reps: reps || 0,
      duration: duration || 0, // seconds
      distance: distance || 0, // meters
      completed: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ── Queries ───────────────────────────────────────────────
  function getWorkoutsThisWeek(workouts) {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return workouts.filter(w => new Date(w.date) > weekAgo && w.completed);
  }

  function getWorkoutsThisMonth(workouts) {
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    return workouts.filter(w => new Date(w.date) > monthAgo && w.completed);
  }

  function getWorkoutDatesSet(workouts) {
    return new Set(workouts.filter(w => w.completed).map(w => w.date.slice(0, 10)));
  }

  function findExercise(name) {
    for (const group of Object.values(EXERCISE_DB)) {
      const found = group.find(e => e.name.toLowerCase() === name.toLowerCase());
      if (found) return found;
    }
    return null;
  }

  function getExercisesByMuscle(muscleGroup) {
    return EXERCISE_DB[muscleGroup] || [];
  }

  function getAllExercises() {
    return Object.entries(EXERCISE_DB).reduce((acc, [group, exs]) => {
      exs.forEach(e => acc.push({ ...e, group }));
      return acc;
    }, []);
  }

  // ── Stats ─────────────────────────────────────────────────
  function calcWorkoutStats(workouts) {
    const completed = workouts.filter(w => w.completed);
    const totalVolume = completed.reduce((sum, w) => {
      return sum + (w.exercises || []).reduce((es, ex) => {
        return es + (ex.sets || []).reduce((ss, s) => ss + (s.weight * s.reps || 0), 0);
      }, 0);
    }, 0);

    const totalDuration = completed.reduce((sum, w) => sum + (w.duration || 0), 0);

    const typeCounts = {};
    completed.forEach(w => { typeCounts[w.type] = (typeCounts[w.type] || 0) + 1; });
    const favType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      totalWorkouts: completed.length,
      totalVolume: Math.round(totalVolume),
      totalDurationMins: Math.round(totalDuration / 60),
      favoriteType: favType ? favType[0] : null,
      typeCounts,
    };
  }

  // ── Weekly Chart Data ─────────────────────────────────────
  function getWeeklyChartData(workouts) {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    const labels = days.map(d => {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const data = days.map(day =>
      workouts.filter(w => w.date.slice(0, 10) === day && w.completed).length
    );
    return { labels, data };
  }

  // ── Progressive Overload ──────────────────────────────────
  function getProgressiveOverloadSuggestion(exerciseName, workouts) {
    const setsForExercise = [];
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        if (ex.name.toLowerCase() === exerciseName.toLowerCase()) {
          (ex.sets || []).forEach(s => setsForExercise.push({ ...s, date: w.date }));
        }
      });
    });

    if (setsForExercise.length < 2) return null;
    setsForExercise.sort((a, b) => new Date(a.date) - new Date(b.date));

    const recent = setsForExercise.slice(-5);
    const avgWeight = recent.reduce((s, x) => s + x.weight, 0) / recent.length;
    const avgReps = recent.reduce((s, x) => s + x.reps, 0) / recent.length;

    if (avgReps >= 12) {
      return { action: 'increase_weight', suggestion: `Add 2.5–5kg. Your recent avg: ${avgWeight.toFixed(1)}kg × ${avgReps.toFixed(0)} reps.` };
    } else if (avgReps < 6) {
      return { action: 'decrease_weight', suggestion: `Consider reducing weight slightly and focusing on form. Aim for 8–12 rep range.` };
    }
    return { action: 'maintain', suggestion: `Aim to add 1–2 more reps each session before increasing weight.` };
  }

  return {
    EXERCISE_DB, WORKOUT_TYPES, MUSCLE_GROUPS,
    createWorkout, createExercise, createSet,
    getWorkoutsThisWeek, getWorkoutsThisMonth, getWorkoutDatesSet,
    findExercise, getExercisesByMuscle, getAllExercises,
    calcWorkoutStats, getWeeklyChartData, getProgressiveOverloadSuggestion,
  };
})();
