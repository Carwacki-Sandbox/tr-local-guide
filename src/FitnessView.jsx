import React, { useState, useMemo } from "react";

// Theme + Font matching App.jsx
const T = {
  bark:"#1a1208",barkMid:"#2a1e0f",barkLight:"#3a2a18",
  moss:"#2d3d1a",mossLight:"#3d5422",canopy:"#4a6b2a",
  leaf:"#6b9c38",fern:"#8ab84a",sage:"#a8c87a",
  cream:"#f2ead8",parchment:"#e8dcbf",
  amber:"#c8843a",amberWarm:"#e09840",amberGlow:"#f0b060",
  dew:"#7ab8a0",dewDim:"#4a8870",rust:"#c05030",mist:"#8aaa78",
};
const FONT = {
  display:"'Playfair Display', Georgia, serif",
  body:"'DM Sans', system-ui, sans-serif",
  mono:"'DM Mono', 'Courier New', monospace",
};
const TYPE_META = {
  cycle:{color:"#7ab8d8",icon:"🚴",label:"Cycling"},
  run:{color:"#8ab84a",icon:"🏃",label:"Running"},
  strength:{color:"#e09840",icon:"💪",label:"Strength"},
  yoga:{color:"#b89ad8",icon:"🧘",label:"Yoga/Pilates"},
  rest:{color:"#6b7280",icon:"😴",label:"Rest"},
  race:{color:"#c87858",icon:"🏁",label:"RACE DAY"},
};
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SHORT_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TODAY_DATE = new Date();
const TODAY = { month: TODAY_DATE.getMonth()+1, day: TODAY_DATE.getDate() };
const TODAY_DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][TODAY_DATE.getDay()];

function scoreWorkoutWeather(day, workoutType) {
  if (!day || workoutType === "rest" || workoutType === "strength" || workoutType === "yoga") return { score: null };
  let s = 100;
  const temp = day.high ?? 70, precip = day.precip ?? 0, wind = day.windSpeed ?? 0, thunder = day.thunder ?? false;
  if (workoutType === "cycle") {
    if (temp < 45 || temp > 95) s -= 30;
    if (precip > 10) s -= Math.min(50, (precip - 10) * 1.5);
    if (wind > 18) s -= 20;
    if (thunder) s -= 40;
  } else {
    if (temp < 35 || temp > 85) s -= 25;
    if (precip > 20) s -= Math.min(40, (precip - 20) * 1.2);
    if (wind > 22) s -= 15;
    if (thunder) s -= 40;
  }
  s = Math.max(0, Math.round(s));
  const label = s >= 80 ? "Great" : s >= 55 ? "Fair" : "Poor";
  const color = s >= 80 ? T.fern : s >= 55 ? T.amberWarm : T.rust;
  let note = null;
  if (thunder) note = "⛈️ Thunderstorm risk — consider indoor alternative";
  else if (precip >= 60) note = `🌧️ ${precip}% rain — have a backup plan`;
  else if (precip >= 30) note = `🌦️ ${precip}% rain — check hourly forecast`;
  else if (wind >= 20 && workoutType === "cycle") note = `💨 Winds ${wind}mph — adjust route`;
  else if (temp >= 85) note = `🌡️ ${temp}°F — hydrate extra, go early`;
  else if (temp <= 40) note = `🥶 ${temp}°F — layer up`;
  else if (s >= 80) note = "☀️ Great conditions!";
  return { score: s, label, color, note };
}

// === JAKE DATA ===
const JAKE_PHASES = [
  {id:"base",name:"Base Building",weeks:[1,2,3,4],label:"Phase 1",color:T.fern,icon:"🌱",focus:"Rebuild aerobic foundation",weeklyTargets:{cycling:{hours:"3–5 hrs",intensity:"Easy (Z2)",sessions:3},running:{hours:"30–60 min",intensity:"Run/walk",sessions:1},strength:{hours:"20–30 min",intensity:"Bodyweight",sessions:1}}},
  {id:"build",name:"Build",weeks:[5,6,7,8],label:"Phase 2",color:T.amberWarm,icon:"🔥",focus:"Add intensity & extend endurance",weeklyTargets:{cycling:{hours:"5–7 hrs",intensity:"Z2 + tempo",sessions:3},running:{hours:"45–75 min",intensity:"Easy + trail",sessions:1},strength:{hours:"25–35 min",intensity:"Bodyweight + bands",sessions:1}}},
  {id:"peak",name:"Peak Performance",weeks:[9,10,11,12],label:"Phase 3",color:T.rust,icon:"⚡",focus:"Sustained efforts & climbing",weeklyTargets:{cycling:{hours:"6–9 hrs",intensity:"Z2 + sweet spot",sessions:"3–4"},running:{hours:"60–90 min",intensity:"Easy + trail",sessions:"1–2"},strength:{hours:"20–30 min",intensity:"Maintenance",sessions:1}}},
];
const JAKE_WEEKS = [
  {week:1,phase:"base",theme:"Ease back in",totalHours:"3.5 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Spin",duration:"45 min",zone:"Z2",route:"Swamp Rabbit Trail",details:"Flat route, cadence 85–95 RPM.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest / Walk",duration:"–",zone:"–",route:"–",details:"Full rest or 20-min walk.",icon:"😴"},{day:"Wednesday",type:"run",label:"Run/Walk Intervals",duration:"25 min",zone:"Z1–Z2",route:"SRT (TR)",details:"5 min walk → 8×(2 min jog / 1 min walk) → cool-down.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Easy Ride",duration:"60 min",zone:"Z2",route:"SRT toward Greenville",details:"Flat to rolling. Practice fueling.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Complete rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Longer Easy Ride",duration:"75 min",zone:"Z2",route:"SRT extended",details:"Longest ride of the week.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Bodyweight + Mobility",duration:"25 min",zone:"–",route:"Home",details:"Squats, lunges, plank, glute bridges, calf raises. 10 min stretch.",icon:"💪"}]},
  {week:2,phase:"base",theme:"Build rhythm",totalHours:"4 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Spin",duration:"50 min",zone:"Z2",route:"Furman / Cherrydale",details:"Rolling terrain. Smooth cadence.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Active Recovery",duration:"–",zone:"–",route:"–",details:"Walk or easy 15 min spin.",icon:"😴"},{day:"Wednesday",type:"run",label:"Run/Walk Progression",duration:"28 min",zone:"Z1–Z2",route:"SRT (TR)",details:"Slightly longer jog intervals.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Easy Ride",duration:"65 min",zone:"Z2",route:"SRT",details:"Cadence targets 85–95 RPM.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Long Easy Ride",duration:"90 min",zone:"Z2",route:"SRT — TR to Greenville",details:"Eat/drink every 30 min.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Bodyweight + Mobility",duration:"30 min",zone:"–",route:"Home",details:"Goblet squats, reverse lunges, push-ups, plank, yoga flow.",icon:"💪"}]},
  {week:3,phase:"base",theme:"First real volume week",totalHours:"4.5 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Ride",duration:"55 min",zone:"Z2",route:"Furman / Cherrydale",details:"Focus on breathing rhythm.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest / Walk",duration:"–",zone:"–",route:"–",details:"20–30 min walk or full rest.",icon:"😴"},{day:"Wednesday",type:"run",label:"Continuous Easy Run",duration:"25 min",zone:"Z2",route:"SRT or Lake Conestee",details:"First continuous run!",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Easy + Cadence",duration:"70 min",zone:"Z2",route:"SRT",details:"2-min cadence drills at 100+ RPM every 15 min.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Long Easy Ride",duration:"105 min",zone:"Z2",route:"SRT extended or Altamont",details:"~1h45m. 30g carbs/hour.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Strength + Core",duration:"30 min",zone:"–",route:"Home",details:"Single-leg squats, push-ups, side plank, band pull-aparts.",icon:"💪"}]},
  {week:4,phase:"base",theme:"Recovery week",totalHours:"3.5 hrs",days:[{day:"Monday",type:"cycle",label:"Recovery Spin",duration:"40 min",zone:"Z1–Z2",route:"Flat — SRT",details:"Very easy step-back.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Wednesday",type:"run",label:"Easy Run",duration:"25 min",zone:"Z2",route:"SRT",details:"Same as last week — recovery.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Easy Ride",duration:"50 min",zone:"Z2",route:"Furman / Cherrydale",details:"Relaxed ride.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Phase 2 starts next week.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Moderate Ride",duration:"75 min",zone:"Z2",route:"SRT",details:"Stay easy.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Mobility Focus",duration:"25 min",zone:"–",route:"Home",details:"Light circuit + 15 min stretching.",icon:"💪"}]},
  {week:5,phase:"build",theme:"First tempo work",totalHours:"5.5 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Ride",duration:"60 min",zone:"Z2",route:"SRT",details:"Fresh from recovery week.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Active Recovery",duration:"–",zone:"–",route:"–",details:"Easy walk or foam rolling.",icon:"😴"},{day:"Wednesday",type:"cycle",label:"Tempo Intervals ⚡",duration:"55 min",zone:"Z2–Z3",route:"SRT (flat)",details:"4×5 min tempo w/ 3 min easy.",icon:"🚴"},{day:"Thursday",type:"run",label:"Easy Trail Run",duration:"30 min",zone:"Z2",route:"Furman or Lake Conestee",details:"First trail run!",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Long Ride + Rollers",duration:"2 hrs",zone:"Z2",route:"Altamont or SRT extended",details:"40g carbs/hour.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Cyclist Strength",duration:"30 min",zone:"–",route:"Home",details:"Bulgarian split squats, push-ups, banded side walks, single-leg RDL.",icon:"💪"}]},
  {week:6,phase:"build",theme:"Extending tempo",totalHours:"6 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Ride",duration:"60 min",zone:"Z2",route:"Furman / Cherrydale",details:"Recovery from weekend.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Wednesday",type:"cycle",label:"Tempo Intervals ⚡",duration:"60 min",zone:"Z2–Z3",route:"SRT",details:"3×8 min tempo w/ 3 min easy.",icon:"🚴"},{day:"Thursday",type:"run",label:"Trail Run w/ Hills",duration:"35 min",zone:"Z2–Z3",route:"Paris Mountain (lower)",details:"Walk steep climbs, run flats.",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Long Ride",duration:"2 hrs 15 min",zone:"Z2",route:"SRT extended or Altamont",details:"Fuel every 30 min.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Strength + Core",duration:"30 min",zone:"–",route:"Home",details:"Step-ups, diamond push-ups, banded clamshells, plank.",icon:"💪"}]},
  {week:7,phase:"build",theme:"Sweet spot introduction",totalHours:"6.5 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Ride",duration:"60 min",zone:"Z2",route:"SRT",details:"Monday base miles.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Wednesday",type:"cycle",label:"Sweet Spot ⚡",duration:"65 min",zone:"Z3–Z4",route:"Altamont or SRT",details:"2×12 min sweet spot w/ 5 min easy.",icon:"🚴"},{day:"Thursday",type:"run",label:"Trail Run",duration:"40 min",zone:"Z2",route:"Paris Mountain",details:"Longer trail run. Walk steep sections.",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Long Ride",duration:"2 hrs 30 min",zone:"Z2",route:"Caesars Head approach (partial)",details:"Save full climb for Phase 3.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Cyclist Strength",duration:"30 min",zone:"–",route:"Home",details:"Goblet squats, pause push-ups, calf raises, hollow body.",icon:"💪"}]},
  {week:8,phase:"build",theme:"Recovery week",totalHours:"4.5 hrs",days:[{day:"Monday",type:"cycle",label:"Recovery Spin",duration:"45 min",zone:"Z1–Z2",route:"Flat — SRT",details:"Very easy step-back.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Wednesday",type:"cycle",label:"Easy + Openers",duration:"50 min",zone:"Z2",route:"Furman / Cherrydale",details:"3×30-sec pick-ups.",icon:"🚴"},{day:"Thursday",type:"run",label:"Easy Run",duration:"30 min",zone:"Z2",route:"SRT or Lake Conestee",details:"Easy flat run.",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Peak phase next week.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Moderate Ride",duration:"90 min",zone:"Z2",route:"SRT",details:"Shorter than recent Saturdays.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Mobility + Light",duration:"25 min",zone:"–",route:"Home",details:"Light circuit + stretching.",icon:"💪"}]},
  {week:9,phase:"peak",theme:"Climbing focus begins",totalHours:"7 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Ride",duration:"60 min",zone:"Z2",route:"SRT",details:"Monday base miles.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Wednesday",type:"cycle",label:"Hill Repeats ⚡",duration:"70 min",zone:"Z3–Z5",route:"Altamont or Paris Mtn",details:"5×4 min climbing repeats.",icon:"🚴"},{day:"Thursday",type:"run",label:"Trail Run w/ Hills",duration:"45 min",zone:"Z2–Z3",route:"Paris Mountain (full loop)",details:"Run the runnable, power-hike the steep.",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Long Ride w/ Climbing",duration:"2 hrs 45 min",zone:"Z2–Z3",route:"Caesars Head or Altamont",details:"Fuel 40–50g carbs/hour.",icon:"🚴"},{day:"Sunday",type:"strength",label:"Maintenance",duration:"25 min",zone:"–",route:"Home",details:"Squats, push-ups, plank, glute bridges.",icon:"💪"}]},
  {week:10,phase:"peak",theme:"Sustained efforts",totalHours:"7.5 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Ride",duration:"60 min",zone:"Z2",route:"SRT",details:"Easy spin to recover.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Wednesday",type:"cycle",label:"Sweet Spot ⚡",duration:"75 min",zone:"Z3–Z4",route:"SRT or Altamont",details:"2×15 min sweet spot w/ 5 min easy.",icon:"🚴"},{day:"Thursday",type:"run",label:"Trail + Strides",duration:"45 min",zone:"Z2–Z3",route:"Paris Mountain or Furman",details:"40 min trail + 4×20-sec strides.",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Century Prep Ride",duration:"3 hrs",zone:"Z2–Z3",route:"Hwy 276 or Caesars Head",details:"Biggest ride of the plan!",icon:"🚴"},{day:"Sunday",type:"strength",label:"Maintenance",duration:"25 min",zone:"–",route:"Home",details:"Same as Week 9.",icon:"💪"}]},
  {week:11,phase:"peak",theme:"Peak volume — biggest week",totalHours:"8 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Ride",duration:"65 min",zone:"Z2",route:"SRT",details:"Recovery spin.",icon:"🚴"},{day:"Tuesday",type:"run",label:"Easy Trail Run",duration:"35 min",zone:"Z2",route:"Lake Conestee or Furman",details:"Second run day. Flat and easy.",icon:"🏃"},{day:"Wednesday",type:"cycle",label:"Over-Unders ⚡",duration:"75 min",zone:"Z3–Z5",route:"Altamont or flat",details:"4×(3 min below + 2 min above threshold).",icon:"🚴"},{day:"Thursday",type:"run",label:"Trail Run w/ Tempo",duration:"50 min",zone:"Z2–Z3",route:"Paris Mountain",details:"Longest trail run! 10 min tempo.",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Long Endurance",duration:"3 hrs",zone:"Z2",route:"Hwy 276 or big loop",details:"All endurance — time in saddle.",icon:"🚴"},{day:"Sunday",type:"rest",label:"Extra Rest",duration:"–",zone:"–",route:"–",details:"Replacing strength with rest.",icon:"😴"}]},
  {week:12,phase:"peak",theme:"Deload — you're back 🎉",totalHours:"4 hrs",days:[{day:"Monday",type:"cycle",label:"Easy Spin",duration:"45 min",zone:"Z1–Z2",route:"SRT",details:"Very easy. Absorb 11 weeks.",icon:"🚴"},{day:"Tuesday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Wednesday",type:"cycle",label:"Easy + Openers",duration:"50 min",zone:"Z2",route:"Furman / Cherrydale",details:"4×30-sec brisk efforts.",icon:"🚴"},{day:"Thursday",type:"run",label:"Fun Trail Run",duration:"35 min",zone:"Z2",route:"Your favorite trail",details:"No pace goals. Just enjoy.",icon:"🏃"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"cycle",label:"Celebration Ride 🎉",duration:"90 min",zone:"Z2",route:"Your favorite route",details:"You're back!",icon:"🚴"},{day:"Sunday",type:"strength",label:"Mobility + Reflection",duration:"20 min",zone:"–",route:"Home",details:"Light circuit + stretching.",icon:"💪"}]},
];

// === EMMA DATA ===
const EMMA_PHASES = [
  {id:"sharpening",name:"10K Sharpening",weeks:[1,2],label:"Phase 1",color:T.fern,icon:"🎯",focus:"Sharpen for April 14 10K",weeklyTargets:{running:{hours:"2.5–3 hrs",intensity:"Easy + 1 quality",sessions:3},cycling:{hours:"Commute if nice",intensity:"Easy",sessions:"0–2"},yoga:{hours:"1–2 sessions",intensity:"Gentle / mobility",sessions:"1–2"}}},
  {id:"base",name:"Half Marathon Base Build",weeks:[3,4,5,6],label:"Phase 2",color:"#7ab8d8",icon:"🏗️",focus:"Build mileage toward half marathon",weeklyTargets:{running:{hours:"3.5–5 hrs",intensity:"Easy + 1 tempo",sessions:3},cycling:{hours:"Commute + optional",intensity:"Easy to moderate",sessions:"1–2"},yoga:{hours:"1 session",intensity:"Strength-focused",sessions:1}}},
  {id:"build",name:"Half #1 Race & Recovery → Build",weeks:[7,8,9,10],label:"Phase 3",color:T.amberWarm,icon:"🔥",focus:"Race Half #1, recover, build for goal race",weeklyTargets:{running:{hours:"3–5.5 hrs",intensity:"Race → Recovery → Quality",sessions:"3–4"},cycling:{hours:"Commute + weekend",intensity:"Easy to moderate",sessions:"1–2"},yoga:{hours:"1–2 sessions",intensity:"Recovery → strength",sessions:"1–2"}}},
  {id:"peak",name:"Peak & Taper — Goal Race",weeks:[11,12,13,14],label:"Phase 4",color:T.rust,icon:"⚡",focus:"Peak fitness, taper for June goal half",weeklyTargets:{running:{hours:"4–6 hrs → 2 hrs",intensity:"Quality → taper",sessions:"3–4"},cycling:{hours:"Easy commutes in taper",intensity:"Easy",sessions:"0–1"},yoga:{hours:"1–2 sessions",intensity:"Strength → gentle",sessions:"1–2"}}},
];
const EMMA_RACES = [
  {name:"10K",date:"April 14",goal:"Feel strong, finish confident",color:T.fern},
  {name:"Half Marathon #1",date:"May 9",goal:"Finish strong — not all-out",color:T.amberWarm},
  {name:"Half #2 (GOAL)",date:"June TBD",goal:"PR effort — leave it all out there",color:T.rust},
];
const EMMA_WEEKS = [
  {week:1,phase:"sharpening",theme:"Tune up — stay fresh",totalHours:"3.5 hrs",totalMiles:"~10 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"30 min",zone:"Z2",route:"SRT (TR)",details:"2.5–3 miles conversational.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Yoga / Pilates",duration:"45 min",zone:"–",route:"Studio or home",details:"Pilates core or vinyasa flow.",icon:"🧘"},{day:"Wednesday",type:"run",label:"10K Pace Intervals ⚡",duration:"35 min",zone:"Z3–Z4",route:"SRT (flat)",details:"4×3 min at 10K pace w/ 2 min easy.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Bike Commute",duration:"45–60 min",zone:"Z2",route:"SRT to work",details:"Easy ride. Zero impact volume.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest Day",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run",duration:"50 min",zone:"Z2",route:"SRT",details:"4.5–5 miles easy.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest / Walk",duration:"–",zone:"–",route:"–",details:"Full rest or 20-min walk.",icon:"😴"}]},
  {week:2,phase:"sharpening",theme:"🏁 10K Race Week (Apr 14)",totalHours:"2.5 hrs + race",totalMiles:"~8 mi + 10K",days:[{day:"Monday",type:"run",label:"Easy Shakeout",duration:"20 min",zone:"Z1–Z2",route:"SRT",details:"1.5–2 miles very easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Gentle Yoga",duration:"30 min",zone:"–",route:"Home",details:"Gentle flow — hip openers, breathing.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Openers",duration:"25 min",zone:"Z2 + strides",route:"SRT",details:"15 min easy + 4×20-sec strides.",icon:"🏃"},{day:"Thursday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest. Race prep.",icon:"😴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Rest or 10-min walk.",icon:"😴"},{day:"Saturday",type:"run",label:"Optional Shakeout",duration:"15 min",zone:"Z1",route:"Near race venue",details:"Optional easy jog + strides.",icon:"🏃"},{day:"Sunday",type:"race",label:"🏁 10K RACE DAY",duration:"Race",zone:"Race effort",route:"Race course",details:"Start conservative. Push miles 5–6. Feel strong!",icon:"🏁"}]},
  {week:3,phase:"base",theme:"Post-10K → start building",totalHours:"3.5 hrs",totalMiles:"~12 mi",days:[{day:"Monday",type:"rest",label:"Post-Race Rest",duration:"–",zone:"–",route:"–",details:"Recovery from 10K.",icon:"😴"},{day:"Tuesday",type:"run",label:"Recovery Run",duration:"25 min",zone:"Z1–Z2",route:"SRT or Lake Conestee",details:"Very easy shakeout.",icon:"🏃"},{day:"Wednesday",type:"yoga",label:"Pilates",duration:"45 min",zone:"–",route:"Studio or home",details:"Core and glute activation.",icon:"🧘"},{day:"Thursday",type:"run",label:"Easy Run",duration:"35 min",zone:"Z2",route:"SRT",details:"3–3.5 miles easy.",icon:"🏃"},{day:"Friday",type:"cycle",label:"Bike Commute",duration:"45–60 min",zone:"Z2",route:"SRT to work",details:"Impact-free volume.",icon:"🚴"},{day:"Saturday",type:"run",label:"Long Run",duration:"55 min",zone:"Z2",route:"SRT",details:"~5 miles. New baseline.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:4,phase:"base",theme:"Mileage bump — long run grows",totalHours:"4 hrs",totalMiles:"~15 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"30 min",zone:"Z2",route:"SRT (TR)",details:"3 miles easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Pilates Strength",duration:"45 min",zone:"–",route:"Studio or home",details:"Single-leg stability, core.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Tempo Run ⚡",duration:"40 min",zone:"Z2–Z3",route:"SRT (flat)",details:"20 min tempo in the middle.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Bike Commute",duration:"45–60 min",zone:"Z2",route:"SRT to work",details:"Easy commute.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run",duration:"65 min",zone:"Z2",route:"SRT extended",details:"~6 miles. Fuel at mile 4.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:5,phase:"base",theme:"Building the engine",totalHours:"4.5 hrs",totalMiles:"~18 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"35 min",zone:"Z2",route:"SRT",details:"3.5 miles easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Hot Yoga or Pilates",duration:"50 min",zone:"–",route:"Studio",details:"Hot yoga or hip strength.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Tempo + Cruise ⚡",duration:"45 min",zone:"Z3",route:"SRT (flat)",details:"3×7 min tempo w/ 2 min easy.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Bike Commute",duration:"50–70 min",zone:"Z2",route:"SRT to work",details:"Easy commute.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run",duration:"75 min",zone:"Z2",route:"SRT — TR toward GVL",details:"~7.5 miles. Longest yet!",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:6,phase:"base",theme:"Step-back before Half #1",totalHours:"3.5 hrs",totalMiles:"~13 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"30 min",zone:"Z2",route:"SRT",details:"3 miles easy. Step-back.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Gentle Yoga",duration:"40 min",zone:"–",route:"Studio or home",details:"Restorative.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Easy + Strides",duration:"30 min",zone:"Z2",route:"SRT",details:"25 min easy + 4×20-sec strides.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Easy Commute",duration:"45 min",zone:"Z1–Z2",route:"SRT",details:"Active recovery only.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run (Step-Back)",duration:"60 min",zone:"Z2",route:"SRT",details:"5.5–6 miles — shorter on purpose.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:7,phase:"build",theme:"🏁 Half #1 Race Week (May 9)",totalHours:"2.5 hrs + race",totalMiles:"~8 mi + 13.1",days:[{day:"Monday",type:"run",label:"Easy Shakeout",duration:"25 min",zone:"Z1–Z2",route:"SRT",details:"2–2.5 miles very easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Gentle Yoga",duration:"30 min",zone:"–",route:"Home",details:"Hip openers, breathing.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Openers",duration:"25 min",zone:"Z2 + strides",route:"SRT",details:"15 min easy + 4×20-sec strides.",icon:"🏃"},{day:"Thursday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest. Race prep.",icon:"😴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Rest or 10-min walk.",icon:"😴"},{day:"Saturday",type:"run",label:"Optional Shakeout",duration:"15 min",zone:"Z1",route:"Near race venue",details:"Optional easy jog.",icon:"🏃"},{day:"Sunday",type:"race",label:"🏁 HALF MARATHON #1",duration:"Race",zone:"Strong but controlled",route:"Race course",details:"Start conservative. NOT your goal race — finish strong.",icon:"🏁"}]},
  {week:8,phase:"build",theme:"Recovery week",totalHours:"3 hrs",totalMiles:"~8 mi",days:[{day:"Monday",type:"rest",label:"Post-Race Rest",duration:"–",zone:"–",route:"–",details:"Full rest. You ran 13.1!",icon:"😴"},{day:"Tuesday",type:"rest",label:"Rest / Walk",duration:"–",zone:"–",route:"–",details:"Walk only if it feels good.",icon:"😴"},{day:"Wednesday",type:"yoga",label:"Recovery Yoga",duration:"40 min",zone:"–",route:"Studio or home",details:"Very gentle.",icon:"🧘"},{day:"Thursday",type:"run",label:"Comeback Run",duration:"25 min",zone:"Z1–Z2",route:"SRT or Lake Conestee",details:"Very easy 2 miles.",icon:"🏃"},{day:"Friday",type:"cycle",label:"Easy Ride",duration:"40 min",zone:"Z1–Z2",route:"SRT",details:"Easy spin. Impact-free.",icon:"🚴"},{day:"Saturday",type:"run",label:"Easy Run",duration:"30 min",zone:"Z2",route:"SRT",details:"3 miles easy.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:9,phase:"build",theme:"Race-pace introduction",totalHours:"4.5 hrs",totalMiles:"~17 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"35 min",zone:"Z2",route:"SRT",details:"3.5 miles easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Pilates Strength",duration:"45 min",zone:"–",route:"Studio or home",details:"Single-leg exercises, planks.",icon:"🧘"},{day:"Wednesday",type:"run",label:"HM Pace Intervals ⚡",duration:"45 min",zone:"Z3",route:"SRT (flat)",details:"4×5 min at goal HM pace.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Bike Commute",duration:"50–70 min",zone:"Z2",route:"SRT to work",details:"Easy commute.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run",duration:"75 min",zone:"Z2",route:"SRT extended",details:"7–7.5 miles.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:10,phase:"build",theme:"Longest tempo yet",totalHours:"5 hrs",totalMiles:"~20 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"35 min",zone:"Z2",route:"SRT",details:"3.5 miles easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Hot Yoga or Pilates",duration:"50 min",zone:"–",route:"Studio",details:"Listen to the body.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Tempo Run ⚡",duration:"50 min",zone:"Z3",route:"SRT",details:"25 min continuous tempo.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Bike Commute",duration:"50–70 min",zone:"Z2",route:"SRT to work",details:"Easy commute.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run",duration:"90 min",zone:"Z2",route:"SRT — TR to GVL",details:"8.5–9 miles. Fuel at miles 4 and 7.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:11,phase:"peak",theme:"Peak week #1 — highest quality",totalHours:"5.5 hrs",totalMiles:"~22 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"35 min",zone:"Z2",route:"SRT",details:"3.5 miles easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Pilates Core & Hips",duration:"45 min",zone:"–",route:"Studio or home",details:"Strength-focused.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Race-Pace Intervals ⚡",duration:"50 min",zone:"Z3–Z4",route:"SRT (flat)",details:"3×8 min at goal HM pace.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Bike Commute",duration:"50–70 min",zone:"Z2",route:"SRT to work",details:"Easy commute.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run w/ Tempo ⚡",duration:"100 min",zone:"Z2→Z3",route:"SRT (full)",details:"~10 mi: first 7 easy, last 3 at HM pace. KEY WORKOUT.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:12,phase:"peak",theme:"Last big effort",totalHours:"5 hrs",totalMiles:"~20 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"35 min",zone:"Z2",route:"SRT",details:"3.5 miles easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Hot Yoga",duration:"50 min",zone:"–",route:"Studio",details:"Deep muscle release.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Goal Pace Tempo ⚡",duration:"45 min",zone:"Z3",route:"SRT",details:"20 min at goal HM pace.",icon:"🏃"},{day:"Thursday",type:"cycle",label:"Easy Ride",duration:"40 min",zone:"Z1–Z2",route:"SRT",details:"Taper begins.",icon:"🚴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Saturday",type:"run",label:"Long Run (Last Big)",duration:"85 min",zone:"Z2",route:"SRT",details:"8–8.5 miles. Last long run before taper.",icon:"🏃"},{day:"Sunday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"}]},
  {week:13,phase:"peak",theme:"Taper — keep sharpness",totalHours:"3.5 hrs",totalMiles:"~14 mi",days:[{day:"Monday",type:"run",label:"Easy Run",duration:"30 min",zone:"Z2",route:"SRT",details:"3 miles easy. Trust the taper.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Light Pilates",duration:"35 min",zone:"–",route:"Home or studio",details:"Activation not fatigue.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Race Pace Sharpener ⚡",duration:"35 min",zone:"Z3",route:"SRT",details:"3×4 min at HM pace.",icon:"🏃"},{day:"Thursday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"No cycling this week.",icon:"😴"},{day:"Friday",type:"run",label:"Easy + Strides",duration:"25 min",zone:"Z2",route:"SRT",details:"20 min easy + 4×20-sec strides.",icon:"🏃"},{day:"Saturday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Full rest.",icon:"😴"},{day:"Sunday",type:"run",label:"Easy Shakeout",duration:"20 min",zone:"Z1–Z2",route:"SRT",details:"2 miles very easy. Race week next.",icon:"🏃"}]},
  {week:14,phase:"peak",theme:"🏁 GOAL RACE WEEK",totalHours:"2 hrs + race",totalMiles:"~6 mi + 13.1",days:[{day:"Monday",type:"run",label:"Easy Shakeout",duration:"20 min",zone:"Z1",route:"SRT",details:"1.5–2 miles very easy.",icon:"🏃"},{day:"Tuesday",type:"yoga",label:"Gentle Yoga",duration:"30 min",zone:"–",route:"Home",details:"Gentle flow + meditation. Visualize the race.",icon:"🧘"},{day:"Wednesday",type:"run",label:"Final Openers",duration:"25 min",zone:"Z2 + strides",route:"SRT",details:"15 min easy + 5×20-sec strides. READY.",icon:"🏃"},{day:"Thursday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Pin bib. Charge watch. Carbs at dinner.",icon:"😴"},{day:"Friday",type:"rest",label:"Rest",duration:"–",zone:"–",route:"–",details:"Hydrate all day.",icon:"😴"},{day:"Saturday",type:"rest",label:"Pre-Race Rest",duration:"–",zone:"–",route:"–",details:"Full rest or walk.",icon:"😴"},{day:"Sunday",type:"race",label:"🏁 GOAL HALF MARATHON",duration:"RACE",zone:"ALL OUT",route:"Race course",details:"Miles 1–3: Controlled. Miles 4–8: Rhythm. Miles 9–11: You are STRONG. Miles 12–13.1: EVERYTHING. 🎉",icon:"🏁"}]},
];

const ATHLETES = [
  {key:"jake",name:"Jake",emoji:"🚴",accent:"#7ab8d8",subtitle:"12-Week Cycling & Running Comeback",phases:JAKE_PHASES,weeks:JAKE_WEEKS,races:null},
  {key:"emma",name:"Emma",emoji:"🏃‍♀️",accent:T.rust,subtitle:"10K → Half → Goal Half Marathon",phases:EMMA_PHASES,weeks:EMMA_WEEKS,races:EMMA_RACES},
];

// === COMPONENTS ===
function WeatherWorkoutBadge({day, workoutType}) {
  const wx = scoreWorkoutWeather(day, workoutType);
  if (!wx.score && wx.score !== 0) return null;
  return (<div style={{marginTop:6,padding:"6px 10px",borderRadius:8,background:wx.color+"12",border:`1px solid ${wx.color}33`,fontSize:10,fontFamily:FONT.mono,color:wx.color,display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700}}>{wx.label} ({wx.score})</span>{wx.note && <span style={{color:T.mist}}>— {wx.note}</span>}</div>);
}

function TodayWorkoutCard({athlete, todayWeather}) {
  const todayWorkout = (() => {
    for (const wk of athlete.weeks) {
      for (const d of wk.days) {
        if (d.day === TODAY_DOW) return { ...d, week: wk.week, theme: wk.theme, phase: wk.phase };
      }
    }
    return null;
  })();
  const currentPhase = todayWorkout ? athlete.phases.find(p => p.id === todayWorkout.phase) : athlete.phases[0];
  const meta = todayWorkout ? TYPE_META[todayWorkout.type] : null;
  return (
    <div style={{background:`linear-gradient(135deg,${T.barkMid},${T.bark})`,border:`1.5px solid ${athlete.accent}44`,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:28}}>{athlete.emoji}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:athlete.accent,textTransform:"uppercase"}}>{athlete.name}'s Today</div>
          <div style={{fontSize:16,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{todayWorkout ? todayWorkout.label : "Rest Day"}</div>
          {currentPhase && <div style={{fontSize:10,color:currentPhase.color,fontFamily:FONT.mono,marginTop:2}}>{currentPhase.icon} {currentPhase.name} · Week {todayWorkout?.week || "–"}</div>}
        </div>
        {meta && todayWorkout.type !== "rest" && <div style={{fontSize:14,background:`${meta.color}22`,border:`1px solid ${meta.color}44`,borderRadius:10,padding:"4px 10px",color:meta.color,fontFamily:FONT.mono,fontWeight:600}}>{meta.icon} {meta.label}</div>}
      </div>
      {todayWorkout && todayWorkout.type !== "rest" && (<>
        <div style={{fontSize:11,color:T.mist,fontFamily:FONT.body,marginBottom:4}}>{todayWorkout.duration} · {todayWorkout.zone} · {todayWorkout.route}</div>
        <div style={{fontSize:11,color:T.sage,fontFamily:FONT.body,lineHeight:1.6,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 10px",borderLeft:`3px solid ${meta.color}44`}}>{todayWorkout.details}</div>
        {todayWeather && <WeatherWorkoutBadge day={todayWeather} workoutType={todayWorkout.type}/>}
      </>)}
      {todayWorkout && todayWorkout.type === "rest" && <div style={{fontSize:11,color:T.mist,fontFamily:FONT.body}}>{todayWorkout.details}</div>}
    </div>
  );
}

function WeekForecastStrip({athlete, allWeather}) {
  if (!allWeather || allWeather.length === 0) return null;
  const currentWeek = athlete.weeks[0];
  const todayIdx = new Date().getDay();
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const skyMap = {sunny:"☀️","partly-sunny":"⛅",cloudy:"☁️",rainy:"🌧️",stormy:"⛈️"};
  return (
    <div style={{background:"rgba(26,18,8,0.5)",border:`1px solid rgba(74,107,42,0.2)`,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
      <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:T.canopy,marginBottom:8}}>📅 7-DAY WEATHER × TRAINING</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {allWeather.map((w, i) => {
          const dow = SHORT_DAYS[(todayIdx + i) % 7];
          const fullDow = dayNames[(todayIdx + i) % 7];
          const workout = currentWeek?.days.find(d => d.day === fullDow);
          const wx = workout ? scoreWorkoutWeather(w, workout.type) : null;
          return (
            <div key={i} style={{flex:1,minWidth:0,textAlign:"center",padding:"8px 4px",background:i===0?"rgba(74,107,42,0.15)":"rgba(42,30,15,0.3)",border:`1px solid ${i===0?"rgba(106,156,56,0.3)":"rgba(58,42,24,0.5)"}`,borderRadius:8}}>
              <div style={{fontSize:9,fontFamily:FONT.mono,color:i===0?T.fern:T.canopy,fontWeight:600}}>{dow}</div>
              <div style={{fontSize:14,margin:"2px 0"}}>{skyMap[w.sky]||"🌤️"}</div>
              <div style={{fontSize:10,fontWeight:600,color:T.cream,fontFamily:FONT.mono}}>{w.high}°</div>
              {workout && workout.type !== "rest" && (<div style={{marginTop:3}}><div style={{fontSize:12}}>{workout.icon}</div>{wx && wx.score !== null && <div style={{fontSize:8,fontFamily:FONT.mono,color:wx.color,fontWeight:700,marginTop:1}}>{wx.score}</div>}</div>)}
              {workout && workout.type === "rest" && <div style={{fontSize:10,marginTop:3,opacity:0.4}}>😴</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhaseHeader({phase}) {
  return (
    <div style={{background:`${phase.color}10`,border:`1.5px solid ${phase.color}44`,borderRadius:16,padding:"16px 20px",marginBottom:8}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
        <span style={{fontSize:26}}>{phase.icon}</span>
        <div>
          <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:phase.color,textTransform:"uppercase"}}>{phase.label} · WEEKS {phase.weeks[0]}–{phase.weeks[phase.weeks.length-1]}</div>
          <div style={{fontSize:18,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{phase.name}</div>
        </div>
      </div>
      <div style={{fontSize:12,color:T.mist,marginBottom:10,fontFamily:FONT.body}}>{phase.focus}</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
        {Object.entries(phase.weeklyTargets).map(([key,val])=>(
          <div key={key} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"8px 12px",flex:1,minWidth:130}}>
            <div style={{fontSize:9,fontFamily:FONT.mono,color:T.canopy,letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{key}</div>
            <div style={{fontSize:13,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{val.hours}</div>
            <div style={{fontSize:10,color:T.mist,fontFamily:FONT.mono}}>{val.intensity}</div>
            <div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono}}>{val.sessions}x / week</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DayRow({day, phaseColor, weather}) {
  const [expanded,setExpanded]=useState(false);
  const meta = TYPE_META[day.type];
  const isIntensity = day.label.includes("⚡"), isRace = day.type === "race";
  return (
    <div onClick={()=>setExpanded(e=>!e)} style={{background:isRace?`${meta.color}12`:expanded?"rgba(42,30,15,0.7)":day.type==="rest"?"rgba(26,18,8,0.2)":"rgba(26,18,8,0.45)",border:`1px solid ${isRace?meta.color+"66":isIntensity?phaseColor+"44":"rgba(58,42,24,0.5)"}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:20,minWidth:28}}>{day.icon||meta.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontFamily:FONT.mono,color:T.canopy,minWidth:70}}>{day.day.toUpperCase()}</span>
            <span style={{fontSize:13,fontWeight:isRace?800:600,color:isRace?meta.color:T.cream,fontFamily:FONT.display}}>{day.label}</span>
            {day.type!=="rest"&&<span style={{fontSize:9,fontFamily:FONT.mono,color:meta.color,background:`${meta.color}15`,border:`1px solid ${meta.color}33`,borderRadius:8,padding:"1px 7px"}}>{meta.label}</span>}
          </div>
          {day.type!=="rest"&&<div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono,marginTop:2}}>{day.duration} · {day.zone} · {day.route}</div>}
        </div>
        <span style={{fontSize:10,color:expanded?T.fern:T.barkLight,fontFamily:FONT.mono,flexShrink:0}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded&&(<div><div style={{marginTop:10,padding:"10px 12px",background:isRace?`${meta.color}08`:"rgba(255,255,255,0.03)",borderRadius:8,fontSize:12,color:isRace?T.cream:T.mist,lineHeight:1.7,fontFamily:FONT.body,borderLeft:`3px solid ${meta.color}44`}}>{day.details}</div>{weather && <WeatherWorkoutBadge day={weather} workoutType={day.type}/>}</div>)}
    </div>
  );
}

function WeekCard({weekData,phaseColor,todayWeather}) {
  const [expanded,setExpanded]=useState(false);
  const isRaceWeek = weekData.days.some(d=>d.type==="race");
  const typeCounts = weekData.days.reduce((acc,d)=>{if(d.type!=="rest")acc[d.type]=(acc[d.type]||0)+1;return acc;},{});
  return (
    <div style={{border:`1px solid ${isRaceWeek?phaseColor+"77":phaseColor+"33"}`,borderRadius:14,overflow:"hidden",background:isRaceWeek?`${phaseColor}08`:"rgba(26,18,8,0.4)",marginBottom:8}}>
      <div onClick={()=>setExpanded(e=>!e)} style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
        <div style={{minWidth:44,textAlign:"center",background:`${phaseColor}15`,border:`1px solid ${phaseColor}44`,borderRadius:10,padding:"8px 6px"}}>
          <div style={{fontSize:8,fontFamily:FONT.mono,color:phaseColor,fontWeight:700}}>WEEK</div>
          <div style={{fontSize:22,fontWeight:800,color:T.cream,lineHeight:1,fontFamily:FONT.display}}>{weekData.week}</div>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:isRaceWeek?phaseColor:T.cream,fontFamily:FONT.display}}>{weekData.theme}</div>
          <div style={{display:"flex",gap:8,marginTop:4,flexWrap:"wrap"}}>
            {Object.entries(typeCounts).map(([type,count])=>{const m=TYPE_META[type];return <span key={type} style={{fontSize:9,fontFamily:FONT.mono,color:m.color,background:`${m.color}12`,border:`1px solid ${m.color}33`,borderRadius:8,padding:"1px 7px"}}>{m.icon} {count}x {m.label}</span>;})}
            <span style={{fontSize:9,fontFamily:FONT.mono,color:T.canopy}}>⏱ {weekData.totalHours}</span>
            {weekData.totalMiles&&<span style={{fontSize:9,fontFamily:FONT.mono,color:T.canopy}}>📏 {weekData.totalMiles}</span>}
          </div>
        </div>
        <span style={{fontSize:10,color:expanded?phaseColor:T.barkLight,fontFamily:FONT.mono}}>{expanded?"▲":"▼"}</span>
      </div>
      {expanded&&<div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:6,borderTop:"1px solid rgba(58,42,24,0.4)"}}><div style={{height:8}}/>{weekData.days.map((d,i)=><DayRow key={i} day={d} phaseColor={phaseColor} weather={todayWeather}/>)}</div>}
    </div>
  );
}

function RaceTimeline({races}) {
  if (!races) return null;
  return (
    <div style={{background:"rgba(26,18,8,0.5)",border:"1px solid rgba(58,42,24,0.6)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
      <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:T.rust,marginBottom:12}}>🏁 RACE CALENDAR</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        {races.map((r,i)=>(
          <div key={i} style={{flex:1,minWidth:150,background:`${r.color}10`,border:`1.5px solid ${r.color}44`,borderRadius:12,padding:"12px 14px",position:"relative"}}>
            {i===races.length-1&&<div style={{position:"absolute",top:-8,right:8,fontSize:8,fontFamily:FONT.mono,fontWeight:800,color:T.bark,background:r.color,borderRadius:10,padding:"2px 8px"}}>GOAL RACE</div>}
            <div style={{fontSize:15,fontWeight:800,color:r.color,fontFamily:FONT.display}}>{r.name}</div>
            <div style={{fontSize:12,fontWeight:600,color:T.cream,marginTop:3,fontFamily:FONT.body}}>{r.date}</div>
            <div style={{fontSize:10,color:T.mist,fontFamily:FONT.mono,marginTop:4}}>{r.goal}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === MAIN EXPORTED VIEW ===
export default function FitnessView({ weather }) {
  const [activeAthlete,setActiveAthlete]=useState("jake");
  const [activePhase,setActivePhase]=useState("all");
  const [searchQuery,setSearchQuery]=useState("");
  const athlete = ATHLETES.find(a=>a.key===activeAthlete);
  const todayWeather = weather?.find(w=>w.isToday) || weather?.[0] || null;
  const filteredWeeks = useMemo(()=>{
    let w = athlete.weeks;
    if (activePhase!=="all") w=w.filter(wk=>wk.phase===activePhase);
    if (searchQuery.trim()){const q=searchQuery.toLowerCase();w=w.filter(wk=>wk.theme.toLowerCase().includes(q)||wk.days.some(d=>d.label.toLowerCase().includes(q)||d.details.toLowerCase().includes(q)||d.route.toLowerCase().includes(q)));}
    return w;
  },[activePhase,searchQuery,athlete]);
  const switchAthlete=(key)=>{setActiveAthlete(key);setActivePhase("all");setSearchQuery("");};

  return (
    <div style={{paddingTop:4}}>
      <div style={{display:"flex",gap:8,marginTop:16,marginBottom:16}}>
        {ATHLETES.map(a=>(<button key={a.key} onClick={()=>switchAthlete(a.key)} style={{flex:1,padding:"12px 16px",background:activeAthlete===a.key?`${a.accent}18`:"rgba(26,18,8,0.5)",border:`1.5px solid ${activeAthlete===a.key?a.accent+"66":"rgba(58,42,24,0.5)"}`,borderRadius:12,cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}><div style={{fontSize:22}}>{a.emoji}</div><div style={{fontSize:13,fontWeight:activeAthlete===a.key?700:400,color:activeAthlete===a.key?a.accent:T.mist,fontFamily:FONT.display,marginTop:3}}>{a.name}</div><div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono,marginTop:2}}>{a.weeks.length} weeks</div></button>))}
      </div>
      <TodayWorkoutCard athlete={athlete} todayWeather={todayWeather}/>
      <WeekForecastStrip athlete={athlete} allWeather={weather}/>
      {athlete.races && <RaceTimeline races={athlete.races}/>}
      <div style={{marginBottom:12}}><input type="text" placeholder="Search workouts, routes…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:"rgba(26,18,8,0.6)",border:"1px solid rgba(74,107,42,0.25)",borderRadius:10,padding:"9px 14px",fontSize:12,color:T.parchment,fontFamily:FONT.body,outline:"none"}}/></div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
        {[{id:"all",label:"All Phases",color:T.fern},...athlete.phases.map(p=>({id:p.id,label:`${p.icon} ${p.name}`,color:p.color}))].map(p=>(<button key={p.id} onClick={()=>setActivePhase(p.id)} style={{background:activePhase===p.id?`${p.color}22`:"rgba(26,18,8,0.5)",color:activePhase===p.id?p.color:T.mist,border:`1px solid ${activePhase===p.id?p.color+"55":"rgba(58,42,24,0.6)"}`,borderRadius:20,padding:"5px 14px",fontSize:10,fontFamily:FONT.body,fontWeight:activePhase===p.id?600:400,cursor:"pointer"}}>{p.label}</button>))}
      </div>
      {(activePhase==="all"?athlete.phases:athlete.phases.filter(p=>p.id===activePhase)).map(phase=>(
        <div key={phase.id} style={{marginTop:16}}>
          <PhaseHeader phase={phase}/>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:8}}>
            {filteredWeeks.filter(w=>w.phase===phase.id).map(w=><WeekCard key={w.week} weekData={w} phaseColor={phase.color} todayWeather={todayWeather}/>)}
          </div>
        </div>
      ))}
      {filteredWeeks.length===0&&<div style={{textAlign:"center",padding:"40px 0",fontSize:13,color:T.canopy,fontFamily:FONT.body,fontStyle:"italic"}}>No workouts match your search.</div>}
    </div>
  );
}