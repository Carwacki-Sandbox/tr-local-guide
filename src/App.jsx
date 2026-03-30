import React, { useState, useEffect, useMemo, useRef } from "react";
import FitnessView from "./FitnessView.jsx";

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bark:       "#1a1208",
  barkMid:    "#2a1e0f",
  barkLight:  "#3a2a18",
  moss:       "#2d3d1a",
  mossLight:  "#3d5422",
  canopy:     "#4a6b2a",
  leaf:       "#6b9c38",
  fern:       "#8ab84a",
  sage:       "#a8c87a",
  cream:      "#f2ead8",
  parchment:  "#e8dcbf",
  amber:      "#c8843a",
  amberWarm:  "#e09840",
  amberGlow:  "#f0b060",
  dew:        "#7ab8a0",
  dewDim:     "#4a8870",
  rust:       "#c05030",
  mist:       "#8aaa78",
  shadow:     "rgba(10,8,2,0.6)",
};

const FONT = {
  display: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', system-ui, sans-serif",
  mono:    "'DM Mono', 'Courier New', monospace",
};

const LAT = 34.9651;
const LON = -82.4379;
const SHORT_DAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TODAY_DATE    = new Date();
const TODAY         = { month: TODAY_DATE.getMonth() + 1, day: TODAY_DATE.getDate() };

function interpretCode(wmo, precip) {
  if (wmo === 0) return { label:"Sunny",          sky:"sunny",        thunder:false, fog:false };
  if (wmo <= 2)  return { label:"Partly Cloudy",  sky:"partly-sunny", thunder:false, fog:false };
  if (wmo === 3) return { label:"Overcast",        sky:"cloudy",       thunder:false, fog:false };
  if (wmo <= 49) return { label:"Foggy",           sky:"cloudy",       thunder:false, fog:true  };
  if (wmo <= 55) return { label:"Drizzle",         sky:"rainy",        thunder:false, fog:false };
  if (wmo <= 67) return { label:"Rain",            sky:"rainy",        thunder:false, fog:false };
  if (wmo <= 77) return { label:"Snow",            sky:"cloudy",       thunder:false, fog:false };
  if (wmo <= 82) return { label:"Rain Showers",    sky:"rainy",        thunder:false, fog:false };
  if (wmo <= 99) return { label:"Thunderstorm",    sky:"stormy",       thunder:true,  fog:false };
  if (precip>50) return { label:"Showers Likely",  sky:"rainy",        thunder:false, fog:false };
  if (precip>20) return { label:"Chance of Rain",  sky:"partly-sunny", thunder:false, fog:false };
  return { label:"Mostly Sunny", sky:"sunny", thunder:false, fog:false };
}
function buildBestWindows(wmo, precip, high) {
  const { thunder, fog } = interpretCode(wmo, precip);
  if (thunder)      return precip<=40?[{start:"2pm",end:"7pm",label:"Afternoon clearing"}]:[];
  if (fog)          return [{start:"9am",end:"6pm",label:"After fog lifts"}];
  if (precip >= 70) return [{start:"3pm",end:"Dusk",label:"Best chance of clearing"}];
  if (precip >= 40) return [{start:"1pm",end:"6pm",label:"Afternoon window"}];
  if (precip >= 20) return [{start:"9am",end:"5pm",label:"Watch for showers"}];
  if (high >= 70)   return [{start:"9am",end:"6pm",label:"Prime outdoor day"}];
  if (high >= 60)   return [{start:"10am",end:"5pm",label:"Pleasant day"}];
  return [{start:"10am",end:"4pm",label:"Best hours"}];
}
function buildWarnings(wmo, precip, gusts, fog) {
  const w = [];
  if (fog)            w.push({time:"Before 9am", note:"Patchy fog"});
  if (wmo >= 95)      w.push({time:"Any time",   note:"Thunderstorm risk"});
  else if (wmo >= 80) w.push({time:"Afternoon",  note:"Showers possible"});
  if (precip >= 70)   w.push({time:"Morning",    note:`Heavy rain likely (${precip}%)`});
  else if(precip>=40) w.push({time:"AM–Midday",  note:`Rain chance ${precip}%`});
  if (gusts >= 25)    w.push({time:"Afternoon",  note:`Gusts up to ${gusts} mph`});
  return w;
}
function isToday(dateStr) {
  const d = new Date(dateStr+"T12:00:00"), n = new Date();
  return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate();
}
