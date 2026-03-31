import React, { useState, useMemo } from "react";
import { ATHLETES } from "./trainingData.js";

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
  cycle:{color:"#7ab8d8",icon:"\ud83d\udeb4",label:"Cycling"},
  run:{color:"#8ab84a",icon:"\ud83c\udfc3",label:"Running"},
  strength:{color:"#e09840",icon:"\ud83d\udcaa",label:"Strength"},
  yoga:{color:"#b89ad8",icon:"\ud83e\uddd8",label:"Yoga/Pilates"},
  rest:{color:"#6b7280",icon:"\ud83d\ude34",label:"Rest"},
  race:{color:"#c87858",icon:"\ud83c\udfc1",label:"RACE DAY"},
};
const SHORT_DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TODAY_DATE = new Date();
const TODAY_DOW = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][TODAY_DATE.getDay()];
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

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
  if (thunder) note = "\u26c8\ufe0f Thunderstorm risk \u2014 consider indoor alternative";
  else if (precip >= 60) note = `\ud83c\udf27\ufe0f ${precip}% rain \u2014 have a backup plan`;
  else if (precip >= 30) note = `\ud83c\udf26\ufe0f ${precip}% rain \u2014 check hourly forecast`;
  else if (wind >= 20 && workoutType === "cycle") note = `\ud83d\udca8 Winds ${wind}mph \u2014 adjust route`;
  else if (temp >= 85) note = `\ud83c\udf21\ufe0f ${temp}\u00b0F \u2014 hydrate extra, go early`;
  else if (temp <= 40) note = `\ud83e\udd76 ${temp}\u00b0F \u2014 layer up`;
  else if (s >= 80) note = "\u2600\ufe0f Great conditions!";
  return { score: s, label, color, note };
}

// ========== INDOOR ALTERNATIVES ==========
const INDOOR_ALTS = {
  cycle: [
    {label:"Indoor Trainer / Zwift",icon:"\ud83d\udda5\ufe0f",details:"Same zone work on the trainer. Shorter duration OK \u2014 indoor watts hit harder.",replacesDuration:0.8},
    {label:"Spin Class",icon:"\ud83d\udd04",details:"Great intensity substitute. Match the zone target from the plan.",replacesDuration:0.75},
    {label:"Rowing Machine",icon:"\ud83d\udea3",details:"Low impact, great cardio crossover. Match time, lower intensity.",replacesDuration:0.85},
  ],
  run: [
    {label:"Treadmill Run",icon:"\ud83c\udfc3\u200d\u2642\ufe0f",details:"Set 1% incline to simulate outdoor effort. Same pace/zone targets.",replacesDuration:1.0},
    {label:"Elliptical / Arc Trainer",icon:"\u26a1",details:"Zero impact, good cardio. Add 10\u201315 min to match effort.",replacesDuration:1.15},
    {label:"Pool Running / Swim",icon:"\ud83c\udfca",details:"Deep water running for zero-impact volume. Great for recovery weeks.",replacesDuration:0.9},
  ],
};

// ========== SMART WEATHER ADVISOR ==========
function generateSmartAdvice(athlete, weather) {
  if (!weather || weather.length < 2) return [];
  const todayIdx = TODAY_DATE.getDay();
  const advice = [];
  const weekPlan = athlete.weeks[0]?.days || [];
  const pairings = weather.map((w, i) => {
    const dow = DAY_NAMES[(todayIdx + i) % 7];
    const workout = weekPlan.find(d => d.day === dow);
    const wx = workout ? scoreWorkoutWeather(w, workout.type) : { score: null };
    return { dayIdx: i, dow, weather: w, workout, wx, isOutdoor: workout && !["rest","strength","yoga"].includes(workout.type) };
  });

  const badDays = pairings.filter(p => p.isOutdoor && p.wx.score !== null && p.wx.score < 55);

  for (const bad of badDays) {
    const swapCandidates = pairings.filter(p =>
      p.dayIdx !== bad.dayIdx &&
      p.workout && (p.workout.type === "rest" || p.workout.type === "strength" || p.workout.type === "yoga") &&
      p.weather && !p.weather.thunder && p.weather.precip < 30
    );
    const bestSwap = swapCandidates
      .map(s => {
        const swapWx = scoreWorkoutWeather(s.weather, bad.workout.type);
        const proximity = Math.abs(s.dayIdx - bad.dayIdx);
        return { ...s, swapWxScore: swapWx.score || 0, proximity };
      })
      .filter(s => s.swapWxScore >= 65)
      .sort((a, b) => (b.swapWxScore - a.swapWxScore) || (a.proximity - b.proximity))[0];

    if (bestSwap) {
      advice.push({
        type: "swap", priority: bad.wx.score < 30 ? "high" : "medium", icon: "\ud83d\udd04",
        badDay: bad, swapDay: bestSwap, swapScore: bestSwap.swapWxScore,
        title: `Swap ${bad.dow.slice(0,3)}'s ${bad.workout.label} \u2192 ${bestSwap.dow.slice(0,3)}`,
        reason: bad.weather.thunder
          ? `Thunderstorms on ${bad.dow.slice(0,3)} (${bad.wx.score}/100). ${bestSwap.dow.slice(0,3)} looks clear (${bestSwap.swapWxScore}/100).`
          : `${bad.dow.slice(0,3)} has ${bad.weather.precip}% rain & ${bad.weather.windSpeed}mph wind (${bad.wx.score}/100). ${bestSwap.dow.slice(0,3)} is much better (${bestSwap.swapWxScore}/100).`,
        action: `Do ${bestSwap.workout.label} on ${bad.dow.slice(0,3)} instead, move ${bad.workout.label} to ${bestSwap.dow.slice(0,3)}.`,
      });
    } else {
      const alts = INDOOR_ALTS[bad.workout.type] || [];
      const bestAlt = alts[0];
      if (bestAlt) {
        advice.push({
          type: "indoor", priority: bad.wx.score < 30 ? "high" : "medium", icon: "\ud83c\udfe0",
          badDay: bad, alt: bestAlt,
          title: `${bad.dow.slice(0,3)}: ${bad.workout.label} \u2192 ${bestAlt.label}`,
          reason: bad.weather.thunder
            ? `Thunderstorms forecast for ${bad.dow.slice(0,3)}, no good swap day available.`
            : `Rough weather on ${bad.dow.slice(0,3)} (${bad.wx.score}/100) with no clear swap option.`,
          action: bestAlt.details,
        });
      }
    }
  }

  const marginalDays = pairings.filter(p => p.isOutdoor && p.wx.score !== null && p.wx.score >= 55 && p.wx.score < 75);
  for (const m of marginalDays) {
    let timing = null;
    if (m.weather.high >= 85) timing = "early morning (before 8am) or evening (after 6pm)";
    else if (m.weather.precip >= 30 && m.weather.precip < 60) timing = "early morning \u2014 rain chance usually peaks afternoon";
    else if (m.weather.windSpeed >= 15 && m.workout.type === "cycle") timing = "early morning when winds are calmer";
    if (timing) {
      advice.push({
        type: "timing", priority: "low", icon: "\u23f0", badDay: m,
        title: `${m.dow.slice(0,3)}: Go ${timing}`,
        reason: `Conditions are doable (${m.wx.score}/100) but timing matters.`,
        action: `${m.workout.label} is fine if you go ${timing}.`,
      });
    }
  }

  const outdoorDays = pairings.filter(p => p.isOutdoor && p.wx.score !== null);
  if (outdoorDays.length > 1) {
    const best = outdoorDays.sort((a,b) => b.wx.score - a.wx.score)[0];
    if (best.wx.score >= 85) {
      advice.push({
        type: "golden", priority: "info", icon: "\u2728", badDay: best,
        title: `${best.dow.slice(0,3)} is your golden day`,
        reason: `Perfect conditions for ${best.workout.label} \u2014 ${best.weather.high}\u00b0F, ${best.weather.precip}% rain, ${best.weather.windSpeed}mph wind.`,
        action: `Make the most of it! Consider extending this workout slightly if energy allows.`,
      });
    }
  }

  const raceDay = pairings.find(p => p.workout?.type === "race");
  if (raceDay && raceDay.weather) {
    const raceWx = scoreWorkoutWeather(raceDay.weather, "run");
    if (raceWx.score !== null && raceWx.score < 70) {
      advice.push({
        type: "race_warning", priority: "high", icon: "\ud83c\udfc1", badDay: raceDay,
        title: `Race day weather alert: ${raceDay.weather.high}\u00b0F, ${raceDay.weather.precip}% rain`,
        reason: `Conditions may be challenging (${raceWx.score}/100). Plan accordingly.`,
        action: raceDay.weather.high >= 80
          ? "Start slower, hydrate aggressively, wear light gear. Adjust pace expectations down 15\u201330 sec/mile."
          : raceDay.weather.precip >= 50
            ? "Rain likely \u2014 wear a brimmed hat, body glide, and grip shoes. Traction on turns."
            : "Mixed conditions \u2014 prepare for anything. Have warm-up layers and rain gear ready.",
      });
    }
  }

  const pOrder = {high:0, medium:1, low:2, info:3};
  return advice.sort((a,b) => (pOrder[a.priority]||3) - (pOrder[b.priority]||3));
}

// ========== SMART ADVISOR UI ==========
function SmartAdvisorPanel({athlete, weather}) {
  const advice = useMemo(() => generateSmartAdvice(athlete, weather), [athlete, weather]);
  const [expanded, setExpanded] = useState(true);
  if (advice.length === 0) return (
    <div style={{background:"rgba(106,156,56,0.08)",border:`1.5px solid ${T.fern}33`,borderRadius:14,padding:"14px 18px",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:20}}>{"\u2705"}</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:T.fern,fontFamily:FONT.display}}>Weather looks great this week</div>
          <div style={{fontSize:11,color:T.mist,fontFamily:FONT.body,marginTop:2}}>No adjustments needed \u2014 stick to the plan!</div>
        </div>
      </div>
    </div>
  );
  const highCount = advice.filter(a => a.priority === "high").length;
  return (
    <div style={{border:`1.5px solid ${highCount > 0 ? T.rust+"77" : T.amberWarm+"55"}`,borderRadius:14,overflow:"hidden",marginBottom:16,background:highCount > 0 ? "rgba(192,80,48,0.06)" : "rgba(224,152,64,0.04)"}}>
      <div onClick={()=>setExpanded(e=>!e)} style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>{"\ud83e\udde0"}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>Smart Weather Advisor</div>
          <div style={{fontSize:10,color:T.mist,fontFamily:FONT.mono,marginTop:2}}>
            {advice.length} recommendation{advice.length>1?"s":""}{highCount > 0 ? ` \u00b7 ${highCount} urgent` : ""}
          </div>
        </div>
        <span style={{fontSize:10,color:expanded?T.fern:T.barkLight,fontFamily:FONT.mono}}>{expanded?"\u25b2":"\u25bc"}</span>
      </div>
      {expanded && (
        <div style={{padding:"0 14px 14px",display:"flex",flexDirection:"column",gap:8}}>
          {advice.map((a, i) => <AdviceCard key={i} advice={a}/>)}
        </div>
      )}
    </div>
  );
}

function AdviceCard({advice}) {
  const [showDetails, setShowDetails] = useState(false);
  const borderColor = advice.priority === "high" ? T.rust : advice.priority === "medium" ? T.amberWarm : advice.type === "golden" ? T.fern : T.canopy;
  const bgColor = advice.priority === "high" ? "rgba(192,80,48,0.08)" : advice.priority === "medium" ? "rgba(224,152,64,0.06)" : advice.type === "golden" ? "rgba(106,156,56,0.06)" : "rgba(74,107,42,0.04)";
  return (
    <div style={{background:bgColor,border:`1px solid ${borderColor}55`,borderRadius:10,padding:"10px 14px",cursor:"pointer"}} onClick={()=>setShowDetails(d=>!d)}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{advice.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{advice.title}</div>
          <div style={{fontSize:10,color:T.mist,fontFamily:FONT.body,marginTop:2}}>{advice.reason}</div>
        </div>
        {advice.priority === "high" && <span style={{fontSize:8,fontFamily:FONT.mono,fontWeight:800,color:T.bark,background:T.rust,borderRadius:8,padding:"2px 8px"}}>URGENT</span>}
        {advice.priority === "medium" && <span style={{fontSize:8,fontFamily:FONT.mono,fontWeight:700,color:T.bark,background:T.amberWarm,borderRadius:8,padding:"2px 8px"}}>ADJUST</span>}
      </div>
      {showDetails && (
        <div style={{marginTop:8,padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8,borderLeft:`3px solid ${borderColor}66`}}>
          <div style={{fontSize:11,color:T.sage,fontFamily:FONT.body,lineHeight:1.6}}>{"\ud83d\udca1"} {advice.action}</div>
          {advice.type === "indoor" && advice.alt && (
            <div style={{marginTop:6,display:"flex",gap:6,flexWrap:"wrap"}}>
              {(INDOOR_ALTS[advice.badDay.workout.type]||[]).map((alt,j)=>(
                <div key={j} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"6px 10px",flex:1,minWidth:120}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.cream}}>{alt.icon} {alt.label}</div>
                  <div style={{fontSize:9,color:T.mist,fontFamily:FONT.mono,marginTop:2}}>{alt.details}</div>
                </div>
              ))}
            </div>
          )}
          {advice.type === "swap" && (
            <div style={{marginTop:6,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{background:"rgba(192,80,48,0.12)",borderRadius:8,padding:"6px 10px",fontSize:10,fontFamily:FONT.mono}}>
                <span style={{color:T.rust}}>{"\u274c"} {advice.badDay.dow.slice(0,3)}</span>
                <span style={{color:T.mist}}> {advice.badDay.weather.high}{"\u00b0"}F {"\u00b7"} {advice.badDay.weather.precip}% rain</span>
              </div>
              <span style={{color:T.amberGlow,fontSize:16}}>{"\u2192"}</span>
              <div style={{background:"rgba(106,156,56,0.12)",borderRadius:8,padding:"6px 10px",fontSize:10,fontFamily:FONT.mono}}>
                <span style={{color:T.fern}}>{"\u2705"} {advice.swapDay.dow.slice(0,3)}</span>
                <span style={{color:T.mist}}> {advice.swapDay.weather.high}{"\u00b0"}F {"\u00b7"} {advice.swapDay.weather.precip}% rain</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === COMPONENTS ===
function WeatherWorkoutBadge({day, workoutType}) {
  const wx = scoreWorkoutWeather(day, workoutType);
  if (!wx.score && wx.score !== 0) return null;
  return (<div style={{marginTop:6,padding:"6px 10px",borderRadius:8,background:wx.color+"12",border:`1px solid ${wx.color}33`,fontSize:10,fontFamily:FONT.mono,color:wx.color,display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:700}}>{wx.label} ({wx.score})</span>{wx.note && <span style={{color:T.mist}}>{"\u2014"} {wx.note}</span>}</div>);
}

function TodayWorkoutCard({athlete, todayWeather, weather}) {
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
  const wx = todayWorkout && todayWeather ? scoreWorkoutWeather(todayWeather, todayWorkout.type) : null;
  const todayAdvice = useMemo(() => {
    if (!todayWorkout || !todayWeather || !wx || wx.score === null || wx.score >= 55) return null;
    const adv = generateSmartAdvice(athlete, weather);
    return adv.find(a => a.badDay?.dayIdx === 0) || null;
  }, [todayWorkout, todayWeather, wx, athlete, weather]);

  return (
    <div style={{background:`linear-gradient(135deg,${T.barkMid},${T.bark})`,border:`1.5px solid ${athlete.accent}44`,borderRadius:16,padding:"16px 18px",marginBottom:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
        <span style={{fontSize:28}}>{athlete.emoji}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:athlete.accent,textTransform:"uppercase"}}>{athlete.name}'s Today</div>
          <div style={{fontSize:16,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{todayWorkout ? todayWorkout.label : "Rest Day"}</div>
          {currentPhase && <div style={{fontSize:10,color:currentPhase.color,fontFamily:FONT.mono,marginTop:2}}>{currentPhase.icon} {currentPhase.name} {"\u00b7"} Week {todayWorkout?.week || "\u2013"}</div>}
        </div>
        {meta && todayWorkout.type !== "rest" && <div style={{fontSize:14,background:`${meta.color}22`,border:`1px solid ${meta.color}44`,borderRadius:10,padding:"4px 10px",color:meta.color,fontFamily:FONT.mono,fontWeight:600}}>{meta.icon} {meta.label}</div>}
      </div>
      {todayWorkout && todayWorkout.type !== "rest" && (<>
        <div style={{fontSize:11,color:T.mist,fontFamily:FONT.body,marginBottom:4}}>{todayWorkout.duration} {"\u00b7"} {todayWorkout.zone} {"\u00b7"} {todayWorkout.route}</div>
        <div style={{fontSize:11,color:T.sage,fontFamily:FONT.body,lineHeight:1.6,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 10px",borderLeft:`3px solid ${meta.color}44`}}>{todayWorkout.details}</div>
        {todayWeather && <WeatherWorkoutBadge day={todayWeather} workoutType={todayWorkout.type}/>}
        {todayAdvice && (
          <div style={{marginTop:8,padding:"10px 12px",borderRadius:10,background:todayAdvice.type==="swap"?"rgba(224,152,64,0.08)":"rgba(192,80,48,0.08)",border:`1px solid ${todayAdvice.type==="swap"?T.amberWarm+"44":T.rust+"44"}`}}>
            <div style={{fontSize:11,fontWeight:700,color:todayAdvice.type==="swap"?T.amberWarm:T.rust,fontFamily:FONT.display,marginBottom:4}}>{todayAdvice.icon} {todayAdvice.title}</div>
            <div style={{fontSize:10,color:T.mist,fontFamily:FONT.body,lineHeight:1.5}}>{"\ud83d\udca1"} {todayAdvice.action}</div>
          </div>
        )}
      </>)}
      {todayWorkout && todayWorkout.type === "rest" && <div style={{fontSize:11,color:T.mist,fontFamily:FONT.body}}>{todayWorkout.details}</div>}
    </div>
  );
}

function WeekForecastStrip({athlete, allWeather}) {
  if (!allWeather || allWeather.length === 0) return null;
  const currentWeek = athlete.weeks[0];
  const todayIdx = new Date().getDay();
  const skyMap = {sunny:"\u2600\ufe0f","partly-sunny":"\u26c5",cloudy:"\u2601\ufe0f",rainy:"\ud83c\udf27\ufe0f",stormy:"\u26c8\ufe0f"};
  return (
    <div style={{background:"rgba(26,18,8,0.5)",border:`1px solid rgba(74,107,42,0.2)`,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
      <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:T.canopy,marginBottom:8}}>{"\ud83d\udcc5"} 7-DAY WEATHER {"\u00d7"} TRAINING</div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {allWeather.map((w, i) => {
          const dow = SHORT_DAYS[(todayIdx + i) % 7];
          const fullDow = DAY_NAMES[(todayIdx + i) % 7];
          const workout = currentWeek?.days.find(d => d.day === fullDow);
          const wx = workout ? scoreWorkoutWeather(w, workout.type) : null;
          return (
            <div key={i} style={{flex:1,minWidth:0,textAlign:"center",padding:"8px 4px",background:i===0?"rgba(74,107,42,0.15)":"rgba(42,30,15,0.3)",border:`1px solid ${i===0?"rgba(106,156,56,0.3)":"rgba(58,42,24,0.5)"}`,borderRadius:8}}>
              <div style={{fontSize:9,fontFamily:FONT.mono,color:i===0?T.fern:T.canopy,fontWeight:600}}>{dow}</div>
              <div style={{fontSize:14,margin:"2px 0"}}>{skyMap[w.sky]||"\ud83c\udf24\ufe0f"}</div>
              <div style={{fontSize:10,fontWeight:600,color:T.cream,fontFamily:FONT.mono}}>{w.high}{"\u00b0"}</div>
              {workout && workout.type !== "rest" && (<div style={{marginTop:3}}><div style={{fontSize:12}}>{TYPE_META[workout.type]?.icon}</div>{wx && wx.score !== null && <div style={{fontSize:8,fontFamily:FONT.mono,color:wx.color,fontWeight:700,marginTop:1}}>{wx.score}</div>}</div>)}
              {workout && workout.type === "rest" && <div style={{fontSize:10,marginTop:3,opacity:0.4}}>{"\ud83d\ude34"}</div>}
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
          <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:phase.color,textTransform:"uppercase"}}>{phase.label} {"\u00b7"} WEEKS {phase.weeks[0]}{"\u2013"}{phase.weeks[phase.weeks.length-1]}</div>
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
  const isIntensity = day.label.includes("\u26a1"), isRace = day.type === "race";
  return (
    <div onClick={()=>setExpanded(e=>!e)} style={{background:isRace?`${meta.color}12`:expanded?"rgba(42,30,15,0.7)":day.type==="rest"?"rgba(26,18,8,0.2)":"rgba(26,18,8,0.45)",border:`1px solid ${isRace?meta.color+"66":isIntensity?phaseColor+"44":"rgba(58,42,24,0.5)"}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{fontSize:20,minWidth:28}}>{meta.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontFamily:FONT.mono,color:T.canopy,minWidth:70}}>{day.day.toUpperCase()}</span>
            <span style={{fontSize:13,fontWeight:isRace?800:600,color:isRace?meta.color:T.cream,fontFamily:FONT.display}}>{day.label}</span>
            {day.type!=="rest"&&<span style={{fontSize:9,fontFamily:FONT.mono,color:meta.color,background:`${meta.color}15`,border:`1px solid ${meta.color}33`,borderRadius:8,padding:"1px 7px"}}>{meta.label}</span>}
          </div>
          {day.type!=="rest"&&<div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono,marginTop:2}}>{day.duration} {"\u00b7"} {day.zone} {"\u00b7"} {day.route}</div>}
        </div>
        <span style={{fontSize:10,color:expanded?T.fern:T.barkLight,fontFamily:FONT.mono,flexShrink:0}}>{expanded?"\u25b2":"\u25bc"}</span>
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
            <span style={{fontSize:9,fontFamily:FONT.mono,color:T.canopy}}>{"\u23f1"} {weekData.totalHours}</span>
            {weekData.totalMiles&&<span style={{fontSize:9,fontFamily:FONT.mono,color:T.canopy}}>{"\ud83d\udccf"} {weekData.totalMiles}</span>}
          </div>
        </div>
        <span style={{fontSize:10,color:expanded?phaseColor:T.barkLight,fontFamily:FONT.mono}}>{expanded?"\u25b2":"\u25bc"}</span>
      </div>
      {expanded&&<div style={{padding:"0 12px 12px",display:"flex",flexDirection:"column",gap:6,borderTop:"1px solid rgba(58,42,24,0.4)"}}><div style={{height:8}}/>{weekData.days.map((d,i)=><DayRow key={i} day={d} phaseColor={phaseColor} weather={todayWeather}/>)}</div>}
    </div>
  );
}

function RaceTimeline({races}) {
  if (!races) return null;
  return (
    <div style={{background:"rgba(26,18,8,0.5)",border:"1px solid rgba(58,42,24,0.6)",borderRadius:14,padding:"14px 16px",marginBottom:16}}>
      <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:T.rust,marginBottom:12}}>{"\ud83c\udfc1"} RACE CALENDAR</div>
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
      <TodayWorkoutCard athlete={athlete} todayWeather={todayWeather} weather={weather}/>
      <SmartAdvisorPanel athlete={athlete} weather={weather}/>
      <WeekForecastStrip athlete={athlete} allWeather={weather}/>
      {athlete.races && <RaceTimeline races={athlete.races}/>}
      <div style={{marginBottom:12}}><input type="text" placeholder="Search workouts, routes\u2026" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:"rgba(26,18,8,0.6)",border:"1px solid rgba(74,107,42,0.25)",borderRadius:10,padding:"9px 14px",fontSize:12,color:T.parchment,fontFamily:FONT.body,outline:"none"}}/></div>
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