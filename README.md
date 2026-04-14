# 🏋️ CR Fitness — CRAIG ROSS

A **next-level, mobile-first** fitness tracking web application with a premium **glossy red and black** theme.

## ✨ Features

| Feature | Details |
|---|---|
| 🏋️ **Workout Tracker** | Log Strength, Cardio, HIIT, Flexibility, Sports — track sets, reps, weight, PRs, calendar |
| 🧠 **Science-Based Suggestions** | BMI, BMR, TDEE calculations + personalized improvement tips + progressive overload guidance |
| 💧 **Water Tracker** | Auto daily goal (~2.2L), quick-add buttons, animated progress ring, streak tracking |
| 😴 **Sleep Tracker** | Bedtime/wake logging, quality rating, sleep score, weekly chart, consistency tracking |
| 📧 **Daily Reminders** | In-app banner + quick mailto link to `craigross252007@gmail.com` |
| 📊 **Dashboard** | All metrics at a glance, weekly charts (Chart.js), motivational quotes, streaks |
| 📱 **PWA** | Installable on phone, offline support via Service Worker |

## 👤 Pre-filled Profile (CRAIG ROSS)
- **Weight:** 65 kg | **Height:** 5'8" (173 cm) | **DOB:** June 25, 2007
- **Email:** craigross252007@gmail.com
- All health calculations (BMI, BMR, TDEE, macros) auto-derived from profile

## 🎨 Design
- **Colors:** Rich reds (`#FF0033`) on deep black (`#0A0A0A`)
- **Effects:** Glass-morphism cards, glossy shine animations, red glow shadows
- **Mobile-First:** Bottom navigation bar, FAB button, 48px touch targets, iOS safe areas
- **Typography:** Poppins (Google Fonts)

## 📁 File Structure
```
index.html          → App shell (all pages, modals, bottom nav)
css/style.css       → Complete responsive styles, glossy theme, animations
js/
  storage.js        → LocalStorage persistence layer
  health.js         → BMI, BMR, TDEE, macro calculations + suggestions
  workout.js        → Workout tracking, exercise library, PRs
  water.js          → Water intake tracker
  sleep.js          → Sleep tracking
  app.js            → Main app logic, navigation, state management
manifest.json       → PWA manifest
sw.js               → Service worker (offline support)
```

## 🚀 Getting Started
1. Open `index.html` in any modern browser (or serve with a static server)
2. Your profile (CRAIG ROSS) is pre-filled — customize in the Profile tab
3. Install as PWA: tap **Share → Add to Home Screen** on iOS or the install prompt on Android/Chrome

## 🔧 Tech Stack
- Pure **HTML5 / CSS3 / Vanilla JavaScript** — no frameworks
- **Chart.js** (CDN) for charts
- **LocalStorage** for all data persistence
- **PWA** with Service Worker for offline use
