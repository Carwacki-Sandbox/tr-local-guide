# 🌿 TR Local Guide

A weather-intelligent local activity dashboard for **Travelers Rest, SC** and the surrounding Upstate / Western NC region. Built with React + Vite.

**Live app:** *(add your Vercel URL here after deploying)*

---

## Features

### 🌤️ Weather Tab
- Live 7-day forecast fetched from [Open-Meteo](https://open-meteo.com/) on page load
- Auto-selects today's date
- Scores 12 outdoor activities against current conditions (temp, precip, wind, fog, thunder)
- Shows best time windows and weather warnings per day
- Activity categories: Outdoor, Water, Fitness, Nature, Creative, Social, Indoor

### 📅 Events Tab
- Curated local events for the Greenville / Upstate SC area (Mar–Jun 2026)
- Month timeline calendar with date filtering
- Search, category filter, free-entry toggle, editor's picks
- Sources: GVLToday, venue websites

### 🏟️ Sports Tab
- Home game schedules for all three Greenville pro teams:
  - 🐰 **Swamp Rabbits** — ECHL Hockey (LA Kings affiliate) · Bon Secours Wellness Arena
  - ⚽ **Triumph SC** — USL League One Soccer · GE Vernova Park
  - ⚾ **Drive** — High-A Baseball (Red Sox affiliate) · Fluor Field
- "This week" banner with direct ticket links

### 🍺 Breweries Tab
- Live music schedules across 12 venues in 5 regions:
  - 🐇 **Travelers Rest, SC** — Swamp Rabbit Brewery & Taproom
  - 📍 **Greenville, SC** — Radio Room, New Realm, Southernside, 13 Stripes
  - ⛰️ **Hendersonville, NC** — Oklawaha, Trailside, Rhythm & Brews Series
  - 🏔 **Mills River, NC** — Sierra Nevada Brewing Co. (Amphitheater + High Gravity)
  - 🌲 **Brevard, NC** — Brevard Brewing Co., Ecusta Brewing, Oskar Blues, Noblebräu / 185 King St
- "Live This Week" banner · region filter · expandable show schedules

---

## Tech Stack

- **React 18** + **Vite**
- **Open-Meteo API** — free, no API key required
- Single-file component (`src/App.jsx`) — no external UI libraries
- Dark green theme, monospace accents

---

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173
```

> **Windows PowerShell note:** If you get a scripts execution error, run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect this GitHub repo at [vercel.com/new](https://vercel.com/new) for automatic deploys on every push.

---

## Data Sources

| Data | Source |
|------|--------|
| Weather | [Open-Meteo](https://open-meteo.com/) · NWS GSP Office |
| Events | [GVLToday](https://gvltoday.6amcity.com/) · venue websites |
| Sports | [Swamp Rabbits](https://swamprabbits.com) · [Triumph SC](https://greenvilletriumph.com) · [MiLB Drive](https://milb.com/greenville) |
| Breweries | Venue websites & social media |

---

## Coverage Area

Centered on **Travelers Rest, SC 29690** (34.9651°N, 82.4379°W), covering a ~1-hour radius including Greenville SC, Hendersonville NC, Mills River NC, and Brevard NC.
