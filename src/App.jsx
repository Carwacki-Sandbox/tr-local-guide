import React, { useState, useEffect, useMemo } from "react";

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

// ─── COORDINATES ──────────────────────────────────────────────────────────────
const LAT = 34.9651;
const LON = -82.4379;
const SHORT_DAYS    = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TODAY_DATE    = new Date();
const TODAY         = { month: TODAY_DATE.getMonth() + 1, day: TODAY_DATE.getDate() };

// ─── WEATHER HELPERS ──────────────────────────────────────────────────────────
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

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────
const ACTIVITIES = [
  {id:"hiking",  name:"Hiking",         icon:"🥾",category:"Outdoor",  idealTemp:[55,80],maxPrecip:20,maxWind:20,noFog:false,noThunder:true, description:"Swamp Rabbit Trail or Paris Mountain State Park"},
  {id:"cycling", name:"Cycling",        icon:"🚴",category:"Outdoor",  idealTemp:[55,82],maxPrecip:10,maxWind:18,noFog:true, noThunder:true, description:"Swamp Rabbit Trail — 22 miles paved"},
  {id:"picnic",  name:"Picnic",         icon:"🧺",category:"Outdoor",  idealTemp:[60,85],maxPrecip:15,maxWind:15,noFog:false,noThunder:true, description:"Furman University Lake or Heritage Park"},
  {id:"kayak",   name:"Kayaking",       icon:"🛶",category:"Water",    idealTemp:[60,90],maxPrecip:20,maxWind:15,noFog:true, noThunder:true, description:"Reedy River or Lake Robinson"},
  {id:"golf",    name:"Golf",           icon:"⛳",category:"Outdoor",  idealTemp:[58,88],maxPrecip:15,maxWind:22,noFog:true, noThunder:true, description:"Pebble Creek Golf Club or Furman Golf Course"},
  {id:"market",  name:"Farmers Market", icon:"🌿",category:"Community",idealTemp:[45,95],maxPrecip:30,maxWind:99,noFog:false,noThunder:false,description:"TR Farmers Market — Saturdays 8am–12pm"},
  {id:"photo",   name:"Photography",    icon:"📷",category:"Creative", idealTemp:[40,90],maxPrecip:20,maxWind:25,noFog:false,noThunder:false,description:"Golden hour shots along the Reedy River"},
  {id:"dining",  name:"Outdoor Dining", icon:"🍽️",category:"Social",   idealTemp:[62,88],maxPrecip:10,maxWind:18,noFog:false,noThunder:true, description:"TR's Main Street patio restaurants"},
  {id:"garden",  name:"Gardening",      icon:"🌱",category:"Home",     idealTemp:[50,85],maxPrecip:25,maxWind:20,noFog:false,noThunder:true, description:"Spring planting season is here!"},
  {id:"running", name:"Running",        icon:"🏃",category:"Fitness",  idealTemp:[45,72],maxPrecip:15,maxWind:20,noFog:false,noThunder:true, description:"Swamp Rabbit Trail or Paris Mountain trails"},
  {id:"birds",   name:"Birdwatching",   icon:"🦅",category:"Nature",   idealTemp:[45,85],maxPrecip:15,maxWind:15,noFog:false,noThunder:false,description:"Timmons Park or Chestnut Hill Nature Preserve"},
  {id:"museum",  name:"Museum/Gallery", icon:"🎨",category:"Indoor",   idealTemp:[-99,99],maxPrecip:99,maxWind:99,noFog:false,noThunder:false,description:"Greenville County Museum of Art — 15 min away"},
];
function scoreActivity(act, day) {
  if (!day) return 0;
  const temp = day.high ?? day.low;
  let s = 100;
  if (temp < act.idealTemp[0] || temp > act.idealTemp[1]) s -= 30;
  if (day.precip > act.maxPrecip) s -= Math.min(60,(day.precip-act.maxPrecip)*1.5);
  if (day.windSpeed > act.maxWind) s -= 20;
  if (act.noThunder && day.thunder) s -= 40;
  if (act.noFog && day.fog) s -= 20;
  return Math.max(0, Math.round(s));
}

// ─── SPORTS DATA ──────────────────────────────────────────────────────────────
const SWAMP_RABBITS_HOME = [
  {month:3,day:29,time:"3:05pm",opponent:"Jacksonville Icemen",   promo:"Backyard Sports Day + Palmetto Cup"},
  {month:3,day:31,time:"7:05pm",opponent:"Savannah Ghost Pirates",promo:null},
  {month:4,day:2, time:"7:05pm",opponent:"Atlanta Gladiators",    promo:"NASCAR Night"},
  {month:4,day:8, time:"7:05pm",opponent:"Savannah Ghost Pirates",promo:"Waggin' Wednesday 🐶"},
  {month:4,day:9, time:"7:05pm",opponent:"Bloomington Bison",     promo:null},
  {month:4,day:11,time:"7:05pm",opponent:"Bloomington Bison",     promo:null},
  {month:4,day:12,time:"3:05pm",opponent:"Bloomington Bison",     promo:null},
  {month:4,day:17,time:"7:05pm",opponent:"Jacksonville Icemen",   promo:"Fireworks 🎆"},
  {month:4,day:18,time:"4:05pm",opponent:"Jacksonville Icemen",   promo:null},
  {month:4,day:19,time:"3:05pm",opponent:"Atlanta Gladiators",    promo:"Sensory Friendly Day"},
];
const TRIUMPH_HOME = [
  {month:3,day:14,time:"7pm",opponent:"Chattanooga Red Wolves SC",venue:"Stone Stadium, Furman",          note:"Home opener — from $5"},
  {month:3,day:25,time:"7pm",opponent:"New York Cosmos",           venue:"Stone Stadium, Furman",          note:null},
  {month:3,day:29,time:"7pm",opponent:"Westchester SC",            venue:"Stone Stadium, Furman",          note:null},
  {month:5,day:9, time:"7pm",opponent:"TBD",                       venue:"GE Vernova Park, BridgeWay Sta.",note:"🏟️ New stadium debut!"},
  {month:5,day:15,time:"7pm",opponent:"TBD",                       venue:"GE Vernova Park, BridgeWay Sta.",note:null},
  {month:6,day:3, time:"7pm",opponent:"TBD",                       venue:"GE Vernova Park, BridgeWay Sta.",note:null},
  {month:6,day:20,time:"7pm",opponent:"TBD",                       venue:"GE Vernova Park, BridgeWay Sta.",note:null},
];
const DRIVE_HOME = [
  {month:4,day:2, time:"7:05pm",opponent:"TBD",promo:"Opening Day 🎉 + Giveaway"},
  {month:4,day:3, time:"7:05pm",opponent:"TBD",promo:"Fireworks 🎆"},
  {month:4,day:4, time:"2:05pm",opponent:"TBD",promo:"Opening Weekend Giveaway"},
  {month:4,day:7, time:"7:05pm",opponent:"TBD",promo:null},
  {month:4,day:8, time:"7:05pm",opponent:"TBD",promo:null},
  {month:4,day:9, time:"7:05pm",opponent:"TBD",promo:null},
  {month:4,day:17,time:"7:05pm",opponent:"TBD",promo:"Fireworks 🎆"},
  {month:4,day:18,time:"7:05pm",opponent:"TBD",promo:null},
  {month:4,day:19,time:"2:05pm",opponent:"TBD",promo:null},
  {month:5,day:1, time:"7:05pm",opponent:"TBD",promo:"Fireworks 🎆"},
  {month:5,day:15,time:"7:05pm",opponent:"TBD",promo:"Fireworks 🎆"},
  {month:5,day:29,time:"7:05pm",opponent:"TBD",promo:"Fireworks 🎆"},
  {month:6,day:12,time:"7:05pm",opponent:"TBD",promo:"Fireworks 🎆"},
  {month:6,day:26,time:"7:05pm",opponent:"TBD",promo:"Fireworks 🎆"},
];
const TEAMS = [
  {id:"rabbits",name:"Swamp Rabbits",fullName:"Greenville Swamp Rabbits",sport:"Hockey 🏒",  icon:"🐰",league:"ECHL",          affiliation:"LA Kings affiliate",       venue:"Bon Secours Wellness Arena",  color:"#7ab8d8",ticketPrice:"$38+",url:"https://swamprabbits.com/schedule/",         ticketsUrl:"https://www.ticketmaster.com/greenville-swamp-rabbits-tickets/artist/1470967",games:SWAMP_RABBITS_HOME},
  {id:"triumph",name:"Triumph",      fullName:"Greenville Triumph SC",    sport:"Soccer ⚽", icon:"⚽",league:"USL League One",  affiliation:"Professional USL L1",      venue:"Stone Stadium / GE Vernova Park",color:"#8ab84a",ticketPrice:"$15+",url:"https://www.greenvilletriumph.com/schedule/",ticketsUrl:"https://www.greenvilletriumph.com/schedule/",games:TRIUMPH_HOME},
  {id:"drive",  name:"Drive",        fullName:"Greenville Drive",         sport:"Baseball ⚾",icon:"⚾",league:"High-A Baseball",affiliation:"Boston Red Sox affiliate", venue:"Fluor Field at the West End",  color:"#c87858",ticketPrice:"$9+", url:"https://www.milb.com/greenville/schedule",   ticketsUrl:"https://www.milb.com/greenville/tickets",games:DRIVE_HOME},
];

// ─── BREWERY DATA ─────────────────────────────────────────────────────────────
const BREWERIES = [
  {id:"srb",     name:"Swamp Rabbit Brewery & Taproom", area:"Travelers Rest, SC", region:"tr",      address:"26 S. Main St, Travelers Rest SC 29690",              vibe:"Award-Winning Craft · Dog-Friendly · Trail Stop",   icon:"🐇",color:"#8ab84a",url:"https://www.theswamprabbitbrewery.com/", note:"TR's original brewery since 2014 · On Swamp Rabbit Trail · Live music & trivia Thurs–Sat",
    shows:[{month:3,day:13,time:"TBD",artist:"Live Music (check Instagram)",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:3,day:14,time:"TBD",artist:"Food Truck + Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:3,day:15,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:3,day:19,time:"TBD",artist:"Trivia Night",genre:"Trivia",price:"Free",allAges:true,ticketUrl:null},{month:3,day:20,time:"TBD",artist:"Food Truck + Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:3,day:21,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:3,day:26,time:"TBD",artist:"Trivia Night",genre:"Trivia",price:"Free",allAges:true,ticketUrl:null},{month:3,day:27,time:"TBD",artist:"Food Truck + Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:3,day:28,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:null}]},
  {id:"radio",   name:"Radio Room",                      area:"Greenville, SC",     region:"gvl",     address:"28 Liberty Lane, Greenville SC 29607",               vibe:"Indie · Alt · Rock · Bluegrass · Metal",            icon:"🎸",color:"#e09840",url:"https://radioroomgreenville.com/events/",note:"4–5 shows/week · 490-cap",
    shows:[{month:3,day:11,time:"8pm",artist:"Rev. Peyton's Big Damn Band",   genre:"Blues/Country",price:"$24",allAges:true, ticketUrl:"https://www.etix.com/ticket/p/64243756/"},{month:3,day:12,time:"8pm",artist:"Harry Styles Dance Night",        genre:"Pop/Dance",    price:"$22",allAges:false,ticketUrl:"https://www.etix.com/ticket/p/37498419/"},{month:3,day:13,time:"8pm",artist:"Glen Phillips (Toad the Wet Sprocket)",genre:"Alt/Folk",     price:"$42",allAges:true, ticketUrl:"https://www.etix.com/ticket/p/87522208/"},{month:3,day:14,time:"7pm",artist:"Still Not Okay",                  genre:"Pop Punk",     price:"$25",allAges:true, ticketUrl:"https://www.etix.com/ticket/p/85381088/"},{month:3,day:19,time:"8pm",artist:"K-POP Demon Hunter's Rave",       genre:"K-Pop",        price:"$22",allAges:false,ticketUrl:"https://radioroomgreenville.com/events/"},{month:3,day:20,time:"8pm",artist:"Jay Webb",                         genre:"Country",      price:"$33",allAges:true, ticketUrl:"https://radioroomgreenville.com/events/"},{month:3,day:21,time:"7pm",artist:"The Browning",                    genre:"Metal",        price:"$45",allAges:true, ticketUrl:"https://radioroomgreenville.com/events/"},{month:3,day:27,time:"8pm",artist:"The Stews",                       genre:"Indie/Rock",   price:"$47",allAges:true, ticketUrl:"https://radioroomgreenville.com/events/"},{month:3,day:28,time:"8pm",artist:"Sebastian Bach",                  genre:"Hard Rock",    price:"$48",allAges:true, ticketUrl:"https://radioroomgreenville.com/events/"},{month:4,day:9,time:"8pm",artist:"CupcakKe",                         genre:"Hip-Hop",      price:"$29",allAges:true, ticketUrl:"https://radioroomgreenville.com/events/"}]},
  {id:"realm",   name:"New Realm Brewing",               area:"Greenville, SC",     region:"gvl",     address:"912 S. Main St (Cigar Warehouse), Greenville SC",    vibe:"Craft Beer · Food · Events · Swamp Rabbit Trail",   icon:"🍺",color:"#7ab8a0",url:"https://newrealmbrewing.com/greenville/", note:"Music venue + restaurant · On the Swamp Rabbit Trail",
    shows:[{month:3,day:14,time:"11am–4pm",artist:"Drive Fan Fest 🎉",genre:"Family",price:"Free",allAges:true,ticketUrl:null},{month:3,day:15,time:"TBD",artist:"Live Music",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://newrealmbrewing.com/greenville/"},{month:3,day:22,time:"TBD",artist:"Live Music",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://newrealmbrewing.com/greenville/"},{month:3,day:29,time:"TBD",artist:"Live Music",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://newrealmbrewing.com/greenville/"}]},
  {id:"south",   name:"Southernside Brewing Co.",         area:"Greenville, SC",     region:"gvl",     address:"701 Easley Bridge Rd, Greenville SC",                 vibe:"Craft Beer · Yard Games · Outdoor Stage",           icon:"🌿",color:"#a8c87a",url:"https://southernsidebrewing.com/",       note:"Thurs: $10 Burger + Pint w/ Big Radio 6–9pm",
    shows:[{month:3,day:12,time:"6–9pm",artist:"Big Radio (Recurring)",genre:"Indie/Alt",price:"Free",allAges:true,ticketUrl:null},{month:3,day:19,time:"6–9pm",artist:"Big Radio (Recurring)",genre:"Indie/Alt",price:"Free",allAges:true,ticketUrl:null},{month:3,day:26,time:"6–9pm",artist:"Big Radio (Recurring)",genre:"Indie/Alt",price:"Free",allAges:true,ticketUrl:null},{month:4,day:2,time:"6–9pm",artist:"Big Radio (Recurring)",genre:"Indie/Alt",price:"Free",allAges:true,ticketUrl:null}]},
  {id:"stripes", name:"13 Stripes Brewery",               area:"Taylors Mill, SC",   region:"gvl",     address:"250 Mill St, Taylors SC 29687",                        vibe:"Old-World Craft · Industrial Taproom",              icon:"🇺🇸",color:"#c87858",url:"https://13stripesbrewery.com/",         note:"Live music ~once/month Fridays",
    shows:[{month:3,day:13,time:"6–11pm",artist:"Drop O' The Pure (Celtic Pub Rock)",genre:"Celtic/Rock",price:"$7", allAges:true,ticketUrl:"https://www.eventbrite.com/e/st-patricks-day-at-13-stripes-brewery-tickets"},{month:3,day:14,time:"TBD",artist:"Live Music",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://www.facebook.com/13stripesbrewery/events"},{month:4,day:10,time:"TBD",artist:"Monthly Show",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://www.facebook.com/13stripesbrewery/events"}]},
  {id:"okla",    name:"Oklawaha Brewing Co.",             area:"Hendersonville, NC", region:"hendo",   address:"147 First Ave E, Hendersonville NC 28792",              vibe:"Craft IPA · Sours · Live Music 7 Nights/Week",      icon:"🌻",color:"#e09840",url:"https://oklawahabrewing.com/events/",   note:"Music 7 nights/week · Award-winning community brewery",
    shows:[{month:3,day:13,time:"8pm",artist:"Drop O' The Pure (Celtic)",genre:"Celtic Rock",price:"TBD",allAges:true,ticketUrl:"https://oklawahabrewing.com/events/"},{month:3,day:31,time:"7pm",artist:"Billy Litz (Kid Billy)",genre:"Blues/Americana",price:"Free",allAges:true,ticketUrl:null},{month:4,day:1,time:"8pm",artist:"Blake Anthony Ellege Band",genre:"Pop/Dance",price:"Free",allAges:true,ticketUrl:null},{month:4,day:7,time:"7pm",artist:"Wesley Ganey (Blues Guitar)",genre:"Blues",price:"Free",allAges:true,ticketUrl:null},{month:4,day:10,time:"7pm",artist:"Tommy Brooks Bluegrass",genre:"Bluegrass",price:"Free",allAges:true,ticketUrl:null},{month:4,day:17,time:"8pm",artist:"The Get Right Band",genre:"Rock/Indie",price:"$5",allAges:true,ticketUrl:"https://oklawahabrewing.com/events/"}]},
  {id:"trail",   name:"Trailside Brewing Co.",            area:"Hendersonville, NC", region:"hendo",   address:"873 Lenox Park Dr, Hendersonville NC 28792 (Ecusta Trail)",vibe:"Craft Beer · Food Garden · 400-person Venue",    icon:"🏔️",color:"#7ab8d8",url:"https://trailsidebrews.com/calendar",   note:"Lennox Station (1915) · On the Ecusta Trail",
    shows:[{month:3,day:14,time:"8am",artist:"St. Paddy's Day 5K 🍀",genre:"Community",price:"Race Entry",allAges:true,ticketUrl:"https://kickitevents.com/venue/trailside-brewing/"},{month:3,day:14,time:"7pm",artist:"Live Music (check calendar)",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://trailsidebrews.com/calendar"},{month:3,day:21,time:"7pm",artist:"Live Music (check calendar)",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://trailsidebrews.com/calendar"},{month:4,day:26,time:"7pm",artist:"The Late Shifters",genre:"Rock/Americana",price:"TBD",allAges:true,ticketUrl:"https://www.bandsintown.com/v/10371186-trailside-brewing-co"}]},
  {id:"rhythm",  name:"Rhythm & Brews Concert Series",    area:"Hendersonville, NC", region:"hendo",   address:"S. Main St, Downtown Hendersonville NC",                vibe:"FREE Outdoor Concerts · Local Craft Beer · Family",  icon:"🎶",color:"#b89ad8",url:"https://www.hendersonvillenc.gov/events/rhythm-brews-concert-series",note:"3rd Thursday May–Sept · Free! · Sierra Nevada, Oklawaha, Dry Falls + more",
    shows:[{month:5,day:21,time:"5:30–9:30pm",artist:"TBA — Opener 5:30 / Headliner 7:30",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:6,day:18,time:"5:30–9:30pm",artist:"TBA",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:7,day:16,time:"5:30–9:30pm",artist:"TBA",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:8,day:20,time:"5:30–9:30pm",artist:"TBA",genre:"Varies",price:"Free",allAges:true,ticketUrl:null},{month:9,day:17,time:"5:30–9:30pm",artist:"TBA",genre:"Varies",price:"Free",allAges:true,ticketUrl:null}]},
  {id:"sierranevada",name:"Sierra Nevada Brewing Co.",    area:"Mills River, NC",    region:"mills",   address:"100 Sierra Nevada Way, Mills River NC 28732",            vibe:"World-Class Brewery · Amphitheater · Mountain Views",icon:"🏔",color:"#e09840",url:"https://sierranevada.com/events/mills-river",note:"Free amphitheater shows Sat & Sun 2–5pm · High Gravity indoor venue · 100 acres",
    shows:[{month:3,day:15,time:"6pm",  artist:"Rumours ATL: A Fleetwood Mac Tribute",genre:"Tribute/Rock",   price:"Ticketed",allAges:true,ticketUrl:"https://sierranevada.com/event/rumours-atl-a-fleetwood-mac-tribute"},{month:3,day:27,time:"6pm",  artist:"Larry Keel & Jon Stickley Duo",          genre:"Bluegrass",      price:"Free",    allAges:true,ticketUrl:"https://sierranevada.com/event/larrykeel-jonstickley-duo"},{month:3,day:28,time:"6pm",  artist:"Carolina Table Beer Dinner",             genre:"Beer Dinner",    price:"Ticketed",allAges:true,ticketUrl:"https://sierranevada.com/event/carolina-table-beer-dinner"},{month:4,day:4, time:"2pm",  artist:"Morrissey Blvd",                         genre:"Indie Rock",     price:"Free",    allAges:true,ticketUrl:"https://sierranevada.com/event/morrissey-blvd"},{month:4,day:12,time:"2pm",  artist:"The Aaron Austin Band",                  genre:"Jazz/Funk/Blues", price:"Free",   allAges:true,ticketUrl:"https://sierranevada.com/event/the-aaron-austin-band"},{month:4,day:19,time:"2pm",  artist:"My Magnificent Nemesis w/ Alien Music Club",genre:"Rock/Jazz",   price:"Free",    allAges:true,ticketUrl:"https://sierranevada.com/event/my-magnificent-nemesis-w-alien-music-club-2"},{month:4,day:25,time:"2pm",  artist:"Strange Rangers",                        genre:"Pop/Funk/Soul",   price:"Free",   allAges:true,ticketUrl:"https://sierranevada.com/event/strange-rangers-6"},{month:4,day:26,time:"2pm",  artist:"Andrew Scotchie",                        genre:"Rock",           price:"Free",    allAges:true,ticketUrl:"https://sierranevada.com/event/andrew-scotchie-3"},{month:5,day:1, time:"6pm",  artist:"The Brothers Comatose",                  genre:"Bluegrass/Folk",  price:"Ticketed",allAges:true,ticketUrl:"https://sierranevada.com/event/the-brothers-comatose-2"},{month:5,day:2, time:"2pm",  artist:"Joe Moss Band",                          genre:"Blues/Rock",      price:"Free",   allAges:true,ticketUrl:"https://sierranevada.com/event/joe-moss-band"},{month:5,day:3, time:"2pm",  artist:"Tina and Her Pony",                      genre:"Appalachian Folk", price:"Free",  allAges:true,ticketUrl:"https://sierranevada.com/event/tina-and-her-pony-3"},{month:5,day:14,time:"6pm",  artist:"Reggie Watts",                           genre:"Comedy/Music",    price:"Ticketed",allAges:true,ticketUrl:"https://sierranevada.com/event/reggie-watts"},{month:5,day:28,time:"6pm",  artist:"Steep Canyon Rangers",                   genre:"Bluegrass",       price:"Ticketed",allAges:true,ticketUrl:"https://sierranevada.com/event/steep-canyon-rangers-2"},{month:5,day:29,time:"6pm",  artist:"Steep Canyon Rangers",                   genre:"Bluegrass",       price:"Ticketed",allAges:true,ticketUrl:"https://sierranevada.com/event/steep-canyon-rangers"}]},
  {id:"brevbrew",  name:"Brevard Brewing Company",        area:"Brevard, NC",         region:"brevard", address:"63 E. Main St, Brevard NC 28712",                        vibe:"German Lagers · Social District · Dog-Friendly",    icon:"🏛️",color:"#b89ad8",url:"https://www.brevardbrewing.com/",      note:"Oldest brewery in Brevard (2012) · Only brewery inside Brevard's social district · Lagers & pilsners",
    shows:[{month:3,day:14,time:"TBD",artist:"Live Music (check social)",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.brevardbrewing.com/"},{month:3,day:15,time:"TBD",artist:"Live Music (check social)",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.brevardbrewing.com/"},{month:3,day:21,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.brevardbrewing.com/"},{month:3,day:28,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.brevardbrewing.com/"}]},
  {id:"ecusta",    name:"Ecusta Brewing Co.",              area:"Brevard, NC",         region:"brevard", address:"Looking Glass Falls Rd, Pisgah Forest NC 28768",         vibe:"Adventure Brewery · Sours · Tacos · Pisgah Forest", icon:"🌊",color:"#7ab8d8",url:"https://www.ecustabrewing.com/",      note:"Named after the Cherokee word for Davidson River · Historic Ecusta Paper Plant site · Gordingo's tacos on-site",
    shows:[{month:3,day:14,time:"TBD",artist:"Live Music (check social)",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.ecustabrewing.com/"},{month:3,day:15,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.ecustabrewing.com/"},{month:3,day:21,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.ecustabrewing.com/"},{month:3,day:28,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://www.ecustabrewing.com/"}]},
  {id:"oskarblues",name:"Oskar Blues Brewery Taproom",    area:"Brevard, NC",         region:"brevard", address:"342 Mountain Industrial Dr, Brevard NC 28712",            vibe:"Bold Craft Cans · Patio · CHUBwagon Food Truck",     icon:"🥫",color:"#c87858",url:"https://oskarblues.com/location/brevard/",note:"CO brewery's East Coast home since 2012 · Monthly music · Dale's Pale Ale birthplace · Dog & kid friendly",
    shows:[{month:3,day:1, time:"Varies",artist:"Monthly Music (March)",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://oskarblues.com/events/"},{month:3,day:14,time:"TBD",artist:"St. Patrick's Day Weekend",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://oskarblues.com/events/"},{month:3,day:15,time:"TBD",artist:"Weekend Live Music",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://oskarblues.com/events/"},{month:4,day:1, time:"Varies",artist:"Monthly Music (April)",genre:"Varies",price:"Free",allAges:true,ticketUrl:"https://oskarblues.com/events/"}]},
  {id:"noblebrau", name:"Noblebräu / 185 King St",        area:"Brevard, NC",         region:"brevard", address:"185 King St, Brevard NC 28712 (Lumberyard District)",     vibe:"Rotating Craft Taps · Premier Live Music Venue",    icon:"🎸",color:"#e09840",url:"https://185kingst.com/events/",        note:"Noblebräu brews always on tap at 185 King St · Brevard's premier music venue · Book early!",
    shows:[{month:3,day:13,time:"TBD",artist:"Weekend Show (check calendar)",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://185kingst.com/events/"},{month:3,day:14,time:"TBD",artist:"Weekend Show (check calendar)",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://185kingst.com/events/"},{month:3,day:15,time:"TBD",artist:"Weekend Show (check calendar)",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://185kingst.com/events/"},{month:4,day:11,time:"TBD",artist:"Monthly Show",genre:"Varies",price:"TBD",allAges:true,ticketUrl:"https://185kingst.com/events/"}]},
];

// ─── EVENTS DATA ──────────────────────────────────────────────────────────────
const CATEGORY_META = {
  "Sports":            {icon:"🏟️",color:"#7ab8d8"},
  "Music":             {icon:"🎵",color:"#b89ad8"},
  "Theatre":           {icon:"🎭",color:"#d87898"},
  "Arts":              {icon:"🎨",color:"#e09840"},
  "Food & Drink":      {icon:"🍽️",color:"#8ab84a"},
  "St. Patrick's Day": {icon:"☘️",color:"#a8c87a"},
  "Seasonal":          {icon:"🌸",color:"#e8d890"},
  "Family":            {icon:"👨‍👩‍👧",color:"#7ab8a0"},
};
function daysSince(e)      { const d=e.dates[0]; return (d.month-TODAY.month)*30+(d.day-TODAY.day); }
function isUpcoming(e)     { return daysSince(e)>=0; }
function isThisWeekEvent(e){ const d=daysSince(e); return d>=0&&d<=7; }
function monthName(m)      { return MONTHS_SHORT[m-1]; }

const EVENTS = [
  {id:4, title:"St. Patrick's Day at 13 Stripes Brewery",       dates:[{month:3,day:13}],dateLabel:"Fri, Mar 13",      time:"6–11pm",   venue:"13 Stripes Brewery at Taylors Mill",area:"Taylors",           price:"$7",      free:false,category:"St. Patrick's Day",tags:["brewery","music","food"],          editorPick:false,description:"Celtic pub rock band Drop O' The Pure performs live while Defiance BBQ serves smash burgers.",url:"https://gvltoday.6amcity.com/events/",ticketUrl:"https://www.eventbrite.com/e/st-patricks-day-at-13-stripes-brewery-tickets"},
  {id:6, title:"Fiddler on the Roof",                            dates:[{month:3,day:13},{month:3,day:14},{month:3,day:15},{month:3,day:20},{month:3,day:21},{month:3,day:22},{month:3,day:27},{month:3,day:28},{month:3,day:29}],dateLabel:"Mar 13–29",time:"Times vary",venue:"Greenville Theatre",           area:"Downtown Greenville",price:"$45",    free:false,category:"Theatre",           tags:["broadway","theatre"],            editorPick:false,description:"Tony Award-winning musical telling the story of Tevye and his family in the little town of Anatevka.",url:"https://www.greenvilletheatre.org/gt_events/fiddler-on-the-roof/",ticketUrl:"https://www.greenvilletheatre.org/gt_events/fiddler-on-the-roof/"},
  {id:7, title:"Greenville St. Patrick's Day Parade & Festival", dates:[{month:3,day:14}],dateLabel:"Sat, Mar 14",      time:"10am–8pm", venue:"Downtown / NOMA Square",           area:"Downtown Greenville",price:"Free",    free:true, category:"St. Patrick's Day",tags:["parade","festival","family","free"],editorPick:true,editorNote:"Editor's Pick ☘️",description:"Parade at 10am on Main Street, then the festival takes over NOMA Square for the rest of the day.",url:"https://gvltoday.6amcity.com/events/"},
  {id:9, title:"Greenville Drive Fan Fest",                      dates:[{month:3,day:14}],dateLabel:"Sat, Mar 14",      time:"11am–4pm", venue:"New Realm Brewing Co.",            area:"Greenville",         price:"Free",    free:true, category:"Sports",           tags:["baseball","family","free"],       editorPick:true,editorNote:"Editor's Pick ⚾",description:"Family fun with inflatable games, face painting, balloon artists, and a make-your-own baseball card photo booth.",url:"https://gvltoday.6amcity.com/events/"},
  {id:10,title:"Greenville Triumph Soccer",                      dates:[{month:3,day:14},{month:3,day:25},{month:3,day:29}],dateLabel:"Mar 14/25/29",time:"7pm",venue:"Stone Stadium at Furman",          area:"Greenville",         price:"$15+",   free:false,category:"Sports",           tags:["soccer","professional sports"],  editorPick:false,description:"Greenville's home soccer team — three home matches this month.",url:"https://www.greenvilletriumph.com/schedule/",ticketUrl:"https://www.greenvilletriumph.com/schedule/"},
  {id:12,title:"NCAA Men's Basketball Tournament",               dates:[{month:3,day:19},{month:3,day:20},{month:3,day:21}],dateLabel:"Mar 19–21",   time:"Times vary",venue:"Bon Secours Wellness Arena",       area:"Downtown Greenville",price:"$105+",  free:false,category:"Sports",           tags:["basketball","ncaa","march madness"],editorPick:true,editorNote:"Editor's Pick 🏀",description:"Greenville hosts the first round of March Madness — three days of tournament basketball downtown.",url:"https://www.bonsecoursarena.com/",ticketUrl:"https://www.bonsecoursarena.com/"},
  {id:13,title:"Larkin Poe",                                     dates:[{month:3,day:24}],dateLabel:"Tue, Mar 24",      time:"7:30pm",   venue:"Peace Center",                     area:"Downtown Greenville",price:"$44+",   free:false,category:"Music",             tags:["rock","americana","sisters"],    editorPick:true,editorNote:"Editor's Pick 🎸",description:"Atlanta-based sister duo known for blues-tinged rock and slide guitar mastery.",url:"https://www.peacecenter.org/",ticketUrl:"https://www.peacecenter.org/"},
  {id:14,title:"Jon Pardi",                                      dates:[{month:3,day:26}],dateLabel:"Thu, Mar 26",      time:"7pm",      venue:"Bon Secours Wellness Arena",       area:"Downtown Greenville",price:"$46+",   free:false,category:"Music",             tags:["country","concert"],             editorPick:false,description:"Country star Jon Pardi brings his Ain't Always the Cowboy Tour to Greenville.",url:"https://www.bonsecoursarena.com/",ticketUrl:"https://www.bonsecoursarena.com/"},
  {id:15,title:"Harlem Globetrotters",                           dates:[{month:3,day:27}],dateLabel:"Fri, Mar 27",      time:"7pm",      venue:"Bon Secours Wellness Arena",       area:"Downtown Greenville",price:"$42+",   free:false,category:"Sports",           tags:["basketball","family"],           editorPick:false,description:"World-famous basketball entertainers bring their Spread Game Tour to Greenville.",url:"https://www.bonsecoursarena.com/",ticketUrl:"https://www.ticketmaster.com/"},
  {id:16,title:"Southern Roots BBQ Reunion",                     dates:[{month:4,day:11}],dateLabel:"Sat, Apr 11",      time:"12–10pm",  venue:"Travelers Rest",                   area:"Travelers Rest",     price:"$103+",  free:false,category:"Food & Drink",     tags:["bbq","food","music","outdoor"], editorPick:true,editorNote:"Editor's Pick 🔥 · TR's premier food event",description:"Award-winning pitmasters, live music, and a celebration of Southern BBQ culture in Travelers Rest.",url:"https://gvltoday.6amcity.com/events/"},
  {id:17,title:"euphoria Spring Fest",                           dates:[{month:4,day:16},{month:4,day:17},{month:4,day:18},{month:4,day:19}],dateLabel:"Apr 16–19",time:"Times vary",venue:"Various downtown venues",         area:"Downtown Greenville",price:"Ticketed",free:false,category:"Food & Drink",tags:["food","wine","chefs"],          editorPick:false,description:"Multi-day food and wine festival featuring James Beard-recognized chefs and intimate dinners.",url:"https://euphoriasc.com/",ticketUrl:"https://euphoriasc.com/"},
  {id:18,title:"Artisphere",                                     dates:[{month:5,day:8},{month:5,day:9},{month:5,day:10}],dateLabel:"May 8–10",     time:"10am–6pm", venue:"Main Street, Downtown",            area:"Downtown Greenville",price:"Free",    free:true, category:"Arts",             tags:["art","festival","free","family"],editorPick:true,editorNote:"Editor's Pick 🎨",description:"One of the top 20 fine art festivals in the US, featuring 135+ juried artists on Main Street.",url:"https://gvltoday.6amcity.com/events/"},
  {id:19,title:"Jazz Fest",                                      dates:[{month:6,day:12},{month:6,day:13}],dateLabel:"Jun 12–13",      time:"Times vary",venue:"Downtown Greenville",              area:"Downtown Greenville",price:"Free",    free:true, category:"Music",             tags:["jazz","festival","free"],       editorPick:false,description:"Two days of live jazz across downtown, food trucks, drink tents, and jazz culture.",url:"https://gvltoday.6amcity.com/events/"},
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function ScoreBar({score}) {
  const c = score>=80 ? T.fern : score>=55 ? T.amberWarm : T.rust;
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1,height:5,borderRadius:3,background:T.barkMid,overflow:"hidden"}}>
        <div style={{width:`${score}%`,height:"100%",background:`linear-gradient(90deg,${c}99,${c})`,borderRadius:3,transition:"width 0.6s ease"}}/>
      </div>
      <span style={{fontSize:11,color:c,fontWeight:600,minWidth:28,fontFamily:FONT.mono}}>{score}</span>
    </div>
  );
}
function WxIcon({sky,size=28}) {
  const m={sunny:"☀️","partly-sunny":"⛅",cloudy:"☁️",rainy:"🌧️",stormy:"⛈️"};
  return <span style={{fontSize:size}}>{m[sky]||"🌤️"}</span>;
}
function CategoryPill({cat,small}) {
  const meta = CATEGORY_META[cat]||{icon:"📅",color:T.mist};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:small?9:10,fontFamily:FONT.mono,fontWeight:500,color:meta.color,background:meta.color+"18",border:`1px solid ${meta.color}44`,borderRadius:20,padding:small?"1px 7px":"2px 9px",whiteSpace:"nowrap"}}>
      {meta.icon} {cat}
    </span>
  );
}
function PriceBadge({price,free}) {
  return (
    <span style={{fontSize:10,fontFamily:FONT.mono,fontWeight:600,color:free?T.fern:T.parchment+"99",background:free?"rgba(138,184,74,0.12)":"rgba(242,234,216,0.06)",border:`1px solid ${free?"rgba(138,184,74,0.3)":"rgba(242,234,216,0.15)"}`,borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>
      {price}
    </span>
  );
}

// ─── SECTION DIVIDER ─────────────────────────────────────────────────────────
function ForestDivider() {
  return (
    <div style={{textAlign:"center",margin:"6px 0",opacity:0.18,fontSize:13,letterSpacing:8,color:T.leaf,userSelect:"none"}}>
      ✦ ✦ ✦
    </div>
  );
}

// ─── WEATHER TAB ──────────────────────────────────────────────────────────────
function DayCard({day,selected,onClick}) {
  const great = day.precip<=20 && (day.high??day.low)>=65;
  return (
    <button onClick={onClick} style={{
      background: selected
        ? `linear-gradient(160deg,${T.mossLight},${T.moss})`
        : day.isToday ? `rgba(74,107,42,0.18)` : `rgba(42,30,15,0.5)`,
      border:`1.5px solid ${selected?T.canopy:day.isToday?"rgba(106,156,56,0.5)":"rgba(58,42,24,0.8)"}`,
      borderRadius:12,padding:"12px 6px",cursor:"pointer",textAlign:"center",
      transition:"all 0.2s",flex:1,minWidth:0,position:"relative",
      boxShadow: selected ? `0 4px 20px rgba(74,107,42,0.3)` : "none",
    }}>
      {great && <div style={{position:"absolute",top:-7,right:-4,fontSize:9,background:T.amber,color:T.bark,borderRadius:20,padding:"1px 6px",fontWeight:700,fontFamily:FONT.mono,letterSpacing:0.5}}>✓</div>}
      {!great && day.isToday && <div style={{position:"absolute",top:-8,right:-4,fontSize:7,background:T.mossLight,color:T.sage,borderRadius:20,padding:"1px 5px",fontWeight:700,fontFamily:FONT.mono,border:`1px solid ${T.canopy}`,whiteSpace:"nowrap"}}>TODAY</div>}
      <div style={{fontSize:10,color:day.isToday?T.fern:T.mist,fontWeight:600,letterSpacing:1,marginBottom:4,fontFamily:FONT.mono}}>{day.short.toUpperCase()}</div>
      <WxIcon sky={day.sky} size={18}/>
      <div style={{marginTop:4,fontSize:12,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{day.high}°<span style={{fontSize:9,color:T.mist,fontWeight:400}}>/{day.low}°</span></div>
      <div style={{marginTop:2,fontSize:9,fontWeight:600,color:day.precip>40?T.rust:day.precip>20?T.amberWarm:T.fern,fontFamily:FONT.mono}}>{day.precip}%</div>
    </button>
  );
}

function WeatherView() {
  const [weather,  setWeather]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(null);
  const [selDay,   setSelDay]   = useState(0);
  const [category, setCategory] = useState("All");
  const [hovered,  setHovered]  = useState(null);
  const [updated,  setUpdated]  = useState(null);

  useEffect(()=>{
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,weathercode&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FNew_York&forecast_days=7`)
      .then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();})
      .then(({daily:d})=>{
        const days=d.time.map((dateStr,i)=>{
          const wmo=d.weathercode[i],precip=d.precipitation_probability_max[i]||0,
            high=Math.round(d.temperature_2m_max[i]),low=Math.round(d.temperature_2m_min[i]),
            wind=Math.round(d.windspeed_10m_max[i]),gusts=Math.round(d.windgusts_10m_max[i]||wind),
            wx=interpretCode(wmo,precip),parsed=new Date(dateStr+"T12:00:00"),
            short=SHORT_DAYS[parsed.getDay()],today=isToday(dateStr);
          return {date:`${short} ${MONTHS_SHORT[parsed.getMonth()]} ${parsed.getDate()}`,short,
            period:today?"Today":`${short} ${MONTHS_SHORT[parsed.getMonth()]} ${parsed.getDate()}`,
            high,low,condition:wx.label+(precip>=20?` · ${precip}% rain`:""),
            precip,windSpeed:wind,windGusts:gusts,fog:wx.fog,thunder:wx.thunder,
            sky:wx.sky,isToday:today,warnings:buildWarnings(wmo,precip,gusts,wx.fog),
            windows:buildBestWindows(wmo,precip,high)};
        });
        setWeather(days);
        const ti=days.findIndex(d=>d.isToday);
        setSelDay(ti>=0?ti:0);
        setUpdated(new Date().toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}));
        setLoading(false);
      })
      .catch(e=>{setErr(e.message);setLoading(false);});
  },[]);

  const day=weather[selDay];
  const cats=["All",...new Set(ACTIVITIES.map(a=>a.category))];
  const scored=day?ACTIVITIES.filter(a=>category==="All"||a.category===category).map(a=>({...a,score:scoreActivity(a,day)})).sort((a,b)=>b.score-a.score):[];
  const topPick=scored[0];

  if(loading) return (
    <div style={{marginTop:60,textAlign:"center",color:T.mist,fontFamily:FONT.body}}>
      <div style={{fontSize:36,marginBottom:12}}>🌲</div>
      <div style={{fontFamily:FONT.display,fontSize:16,color:T.sage}}>Reading the canopy…</div>
      <div style={{fontSize:12,color:T.mist,marginTop:6}}>Fetching live 7-day forecast for Travelers Rest</div>
    </div>
  );
  if(err) return (
    <div style={{marginTop:40,padding:20,background:`rgba(192,80,48,0.08)`,border:`1px solid rgba(192,80,48,0.25)`,borderRadius:14,fontFamily:FONT.mono,color:T.rust,textAlign:"center"}}>
      <div style={{fontSize:28,marginBottom:8}}>⚠️</div>
      Could not load live weather ({err})
      <br/><span style={{fontSize:11,color:T.mist}}>Check your connection and reload</span>
    </div>
  );

  return (
    <div style={{paddingTop:4}}>
      <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono,letterSpacing:2}}>{weather.length>0?`${weather[0].date} – ${weather[6].date}`:""}</div>
        {updated&&<div style={{fontSize:9,color:T.mossLight,fontFamily:FONT.mono}}>Updated {updated}</div>}
      </div>
      <div style={{marginTop:8,display:"flex",gap:5}}>{weather.map((d,i)=><DayCard key={i} day={d} selected={selDay===i} onClick={()=>setSelDay(i)}/>)}</div>

      {day&&<div style={{marginTop:14,background:`linear-gradient(135deg,rgba(45,61,26,0.5),rgba(26,18,8,0.6))`,border:`1px solid rgba(74,107,42,0.35)`,borderRadius:16,padding:"16px 18px",backdropFilter:"blur(4px)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <WxIcon sky={day.sky} size={32}/>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{day.period}</div>
              <div style={{fontSize:12,color:T.mist,marginTop:2,fontFamily:FONT.body}}>{day.condition}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:18}}>
            {[{val:`${day.high}°F`,label:"HIGH",color:T.cream},{val:`${day.precip}%`,label:"PRECIP",color:day.precip>=50?T.rust:day.precip>=25?T.amberWarm:T.fern},{val:`${day.windSpeed}mph`,label:"WIND",color:T.cream}].map(({val,label,color})=>(
              <div key={label} style={{textAlign:"center"}}>
                <div style={{fontSize:19,fontWeight:700,color,fontFamily:FONT.display}}>{val}</div>
                <div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono,letterSpacing:1}}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        {day.windows.length>0&&<div style={{marginTop:12,display:"flex",gap:8,flexWrap:"wrap"}}>{day.windows.map((w,i)=><div key={i} style={{background:"rgba(106,156,56,0.12)",border:"1px solid rgba(106,156,56,0.3)",borderRadius:8,padding:"4px 11px",fontSize:11,color:T.sage,fontFamily:FONT.mono}}>🌿 {w.start}–{w.end} · {w.label}</div>)}</div>}
        {day.warnings.length>0&&<div style={{marginTop:8,display:"flex",gap:8,flexWrap:"wrap"}}>{day.warnings.map((w,i)=><div key={i} style={{background:"rgba(200,132,58,0.08)",border:"1px solid rgba(200,132,58,0.25)",borderRadius:8,padding:"4px 11px",fontSize:11,color:T.amberGlow,fontFamily:FONT.mono}}>⚠ {w.time}: {w.note}</div>)}</div>}
      </div>}

      {topPick&&topPick.score>60&&<div style={{marginTop:14,background:`linear-gradient(135deg,${T.barkMid},${T.bark})`,border:`1.5px solid ${T.amber}55`,borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:`0 4px 24px rgba(200,132,58,0.12)`}}>
        <div style={{fontSize:28}}>{topPick.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:T.amber,textTransform:"uppercase"}}>★ Top Pick for {day?.short}</div>
          <div style={{fontSize:16,fontWeight:700,color:T.cream,marginTop:3,fontFamily:FONT.display}}>{topPick.name}</div>
          <div style={{fontSize:11,color:T.mist,marginTop:2,fontFamily:FONT.body}}>{topPick.description}</div>
        </div>
        <div style={{background:T.amber,color:T.bark,borderRadius:10,padding:"5px 11px",fontWeight:700,fontSize:16,fontFamily:FONT.display,minWidth:42,textAlign:"center"}}>{topPick.score}</div>
      </div>}

      <div style={{marginTop:20}}>
        <div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Filter by Category</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{cats.map(cat=>(
          <button key={cat} onClick={()=>setCategory(cat)} style={{background:category===cat?T.canopy:`rgba(42,30,15,0.5)`,color:category===cat?T.cream:T.mist,border:`1px solid ${category===cat?T.canopy:"rgba(58,42,24,0.8)"}`,borderRadius:20,padding:"4px 12px",fontSize:11,fontWeight:category===cat?600:400,cursor:"pointer",fontFamily:FONT.body,transition:"all 0.15s"}}>{cat}</button>
        ))}</div>
      </div>

      <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>{scored.map(act=>{
        const great=act.score>=80,ok=act.score>=55,tc=great?T.fern:ok?T.amberWarm:T.rust;
        return (
          <div key={act.id} onMouseEnter={()=>setHovered(act.id)} onMouseLeave={()=>setHovered(null)} style={{background:hovered===act.id?`rgba(42,30,15,0.7)`:`rgba(26,18,8,0.5)`,border:`1px solid ${great?`rgba(106,156,56,0.3)`:"rgba(58,42,24,0.6)"}`,borderRadius:12,padding:"13px 15px",transition:"all 0.15s"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{fontSize:22,minWidth:30}}>{act.icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:600,color:T.cream,fontFamily:FONT.display}}>{act.name}</span>
                  <span style={{fontSize:9,fontFamily:FONT.mono,color:tc,border:`1px solid ${tc}44`,borderRadius:10,padding:"1px 6px"}}>{great?"Great":ok?"Fair":"Poor"}</span>
                  <span style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono,marginLeft:"auto"}}>{act.category}</span>
                </div>
                <div style={{fontSize:11,color:T.mist,marginBottom:6,fontFamily:FONT.body}}>{act.description}</div>
                <ScoreBar score={act.score}/>
              </div>
            </div>
            {act.score<55&&day&&<div style={{marginTop:7,fontSize:10,color:T.rust,fontFamily:FONT.mono,background:"rgba(192,80,48,0.06)",borderRadius:6,padding:"4px 10px"}}>
              {day.precip>act.maxPrecip&&`⚠ ${day.precip}% precip exceeds ${act.maxPrecip}% threshold`}
              {day.windSpeed>act.maxWind&&" · Winds too high"}
              {act.noThunder&&day.thunder&&" · Thunder risk"}
            </div>}
          </div>
        );
      })}</div>
      <div style={{marginTop:24,textAlign:"center",fontSize:9,color:T.barkLight,fontFamily:FONT.mono,borderTop:`1px solid rgba(58,42,24,0.5)`,paddingTop:12}}>
        Data: Open-Meteo · National Weather Service GSP · Travelers Rest, SC 29690
      </div>
    </div>
  );
}

// ─── EVENTS TAB ───────────────────────────────────────────────────────────────
function DateBubble({event}) {
  const d=event.dates[0],multi=event.dates.length>1,soon=isThisWeekEvent(event);
  const c=soon?T.fern:T.mist;
  return (
    <div style={{textAlign:"center",minWidth:44,flexShrink:0,background:soon?"rgba(106,156,56,0.1)":"rgba(42,30,15,0.5)",border:`1px solid ${soon?"rgba(106,156,56,0.3)":"rgba(58,42,24,0.6)"}`,borderRadius:10,padding:"8px 6px"}}>
      <div style={{fontSize:9,color:c,fontFamily:FONT.mono,fontWeight:600,letterSpacing:1}}>{monthName(d.month).toUpperCase()}</div>
      <div style={{fontSize:20,fontWeight:800,color:T.cream,lineHeight:1,fontFamily:FONT.display}}>{d.day}</div>
      {multi&&<div style={{fontSize:8,color:T.canopy,fontFamily:FONT.mono,marginTop:2}}>+{event.dates.length-1}more</div>}
    </div>
  );
}

function EventCard({event,expanded,onToggle}) {
  const meta=CATEGORY_META[event.category]||{icon:"📅",color:T.mist},soon=isThisWeekEvent(event);
  return (
    <div style={{background:expanded?"rgba(42,30,15,0.7)":"rgba(26,18,8,0.5)",border:`1px solid ${event.editorPick?meta.color+"44":soon?"rgba(106,156,56,0.2)":"rgba(58,42,24,0.5)"}`,borderRadius:14,overflow:"hidden",transition:"background 0.2s",position:"relative"}}>
      {event.editorPick&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${meta.color}88,transparent)`}}/>}
      <div onClick={onToggle} style={{display:"flex",gap:12,padding:"13px 14px",cursor:"pointer",alignItems:"flex-start"}}>
        <DateBubble event={event}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{marginBottom:5}}>
            <span style={{fontSize:14,fontWeight:600,color:T.cream,lineHeight:1.3,fontFamily:FONT.display}}>
              {event.editorPick&&<span style={{color:meta.color,marginRight:5}}>★</span>}{event.title}
            </span>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
            <CategoryPill cat={event.category} small/>
            <PriceBadge price={event.price} free={event.free}/>
            <span style={{fontSize:10,color:T.dewDim,fontFamily:FONT.mono}}>📍 {event.area}</span>
            {soon&&<span style={{fontSize:9,fontFamily:FONT.mono,color:T.fern,background:"rgba(106,156,56,0.1)",border:"1px solid rgba(106,156,56,0.25)",borderRadius:10,padding:"1px 6px",letterSpacing:1}}>THIS WEEK</span>}
          </div>
          <div style={{marginTop:5,fontSize:10,color:T.canopy,fontFamily:FONT.mono}}>{event.time} · {event.venue}</div>
        </div>
        <div style={{fontSize:10,color:expanded?T.amber:T.barkLight,fontFamily:FONT.mono,flexShrink:0,marginTop:4}}>{expanded?"▲":"▼"}</div>
      </div>
      {expanded&&<div style={{padding:"0 14px 14px",borderTop:`1px solid rgba(58,42,24,0.5)`}}>
        <div style={{marginTop:12,fontSize:12,color:T.mist,lineHeight:1.7,fontFamily:FONT.body}}>{event.description}</div>
        {event.editorPick&&<div style={{marginTop:8,fontSize:10,color:meta.color,fontFamily:FONT.mono,background:meta.color+"10",border:`1px solid ${meta.color}33`,borderRadius:8,padding:"5px 10px"}}>{event.editorNote}</div>}
        <div style={{marginTop:10,display:"flex",gap:5,flexWrap:"wrap"}}>{event.tags.map(t=><span key={t} style={{fontSize:9,fontFamily:FONT.mono,color:T.canopy,background:"rgba(42,30,15,0.5)",border:"1px solid rgba(58,42,24,0.6)",borderRadius:10,padding:"2px 8px"}}>#{t}</span>)}</div>
        {event.dates.length>1&&<div style={{marginTop:8,fontSize:10,color:T.canopy,fontFamily:FONT.mono}}>All dates: {event.dates.map(d=>`${monthName(d.month)} ${d.day}`).join(" · ")}</div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
          {event.ticketUrl&&!event.free&&<a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontFamily:FONT.mono,color:T.bark,background:meta.color,borderRadius:8,padding:"6px 14px",textDecoration:"none",fontWeight:600}}>🎟 Get Tickets ↗</a>}
          <a href={event.url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{display:"inline-block",fontSize:10,fontFamily:FONT.mono,color:meta.color,background:meta.color+"12",border:`1px solid ${meta.color}44`,borderRadius:8,padding:"5px 12px",textDecoration:"none"}}>More info ↗</a>
        </div>
      </div>}
    </div>
  );
}

function MonthTimeline({events,selectedDay,onSelectDay}) {
  const days=Array.from({length:31},(_,i)=>i+1);
  const eventDays=new Set(events.flatMap(e=>e.dates.filter(d=>d.month===TODAY.month).map(d=>d.day)));
  const editorDays=new Set(events.filter(e=>e.editorPick).flatMap(e=>e.dates.filter(d=>d.month===TODAY.month).map(d=>d.day)));
  return (
    <div style={{marginTop:16}}>
      <div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono,letterSpacing:2,marginBottom:8}}>{MONTHS_SHORT[TODAY.month-1].toUpperCase()} 2026 · CLICK A DATE TO FILTER</div>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{days.map(d=>{
        const hasEvent=eventDays.has(d),isEditor=editorDays.has(d),isTod=d===TODAY.day,isSel=selectedDay===d,isPast=d<TODAY.day;
        return <button key={d} onClick={()=>onSelectDay(isSel?null:d)} style={{width:26,height:26,borderRadius:6,border:`1px solid ${isTod?"rgba(106,156,56,0.4)":"transparent"}`,background:isSel?(isEditor?T.amber:"rgba(200,132,58,0.3)"):isEditor?"rgba(200,132,58,0.15)":hasEvent?"rgba(74,107,42,0.2)":"rgba(26,18,8,0.3)",cursor:hasEvent?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
          <span style={{fontSize:9,fontFamily:FONT.mono,fontWeight:hasEvent?700:400,color:isSel?T.bark:isPast?"rgba(168,158,138,0.3)":hasEvent?T.parchment:"rgba(168,158,138,0.25)"}}>{d}</span>
        </button>;
      })}</div>
    </div>
  );
}

function EventsView() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showFreeOnly,   setShowFreeOnly]   = useState(false);
  const [showEditorOnly, setShowEditorOnly] = useState(false);
  const [showUpcoming,   setShowUpcoming]   = useState(true);
  const [selectedDay,    setSelectedDay]    = useState(null);
  const [expandedId,     setExpandedId]     = useState(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const cats=["All",...Object.keys(CATEGORY_META)];
  const filtered=useMemo(()=>EVENTS.filter(e=>{
    if(showUpcoming&&!isUpcoming(e))return false;
    if(activeCategory!=="All"&&e.category!==activeCategory)return false;
    if(showFreeOnly&&!e.free)return false;
    if(showEditorOnly&&!e.editorPick)return false;
    if(selectedDay!==null&&!e.dates.some(d=>d.month===TODAY.month&&d.day===selectedDay))return false;
    if(searchQuery.trim()){const q=searchQuery.toLowerCase();return e.title.toLowerCase().includes(q)||e.venue.toLowerCase().includes(q)||e.area.toLowerCase().includes(q)||e.tags.some(t=>t.includes(q))||e.description.toLowerCase().includes(q);}
    return true;
  }).sort((a,b)=>{const da=a.dates[0],db=b.dates[0];return(da.month*100+da.day)-(db.month*100+db.day);}),[activeCategory,showFreeOnly,showEditorOnly,showUpcoming,selectedDay,searchQuery]);
  const twc=filtered.filter(isThisWeekEvent).length;

  return (
    <div style={{paddingTop:4}}>
      <MonthTimeline events={EVENTS.filter(isUpcoming)} selectedDay={selectedDay} onSelectDay={setSelectedDay}/>
      <div style={{marginTop:14}}>
        <input type="text" placeholder="Search events, venues, tags…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{width:"100%",boxSizing:"border-box",background:"rgba(26,18,8,0.6)",border:`1px solid rgba(74,107,42,0.25)`,borderRadius:10,padding:"9px 14px",fontSize:12,color:T.parchment,fontFamily:FONT.body,outline:"none","::placeholder":{color:T.canopy}}}/>
      </div>
      <div style={{marginTop:12}}>
        <div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono,letterSpacing:2,marginBottom:7}}>CATEGORY</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{cats.map(cat=>{const meta=CATEGORY_META[cat],active=activeCategory===cat;return <button key={cat} onClick={()=>setActiveCategory(cat)} style={{background:active?(meta?meta.color+"22":"rgba(74,107,42,0.2)"):"rgba(26,18,8,0.5)",color:active?(meta?meta.color:T.fern):T.mist,border:`1px solid ${active?(meta?meta.color+"55":"rgba(106,156,56,0.4)"):"rgba(58,42,24,0.6)"}`,borderRadius:18,padding:"4px 12px",fontSize:10,fontWeight:active?600:400,cursor:"pointer",fontFamily:FONT.body,transition:"all 0.15s"}}>{meta?`${meta.icon} `:""}{cat}</button>;})}</div>
      </div>
      <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
        {[{label:"Upcoming",state:showUpcoming,toggle:()=>setShowUpcoming(s=>!s)},{label:"★ Editor's picks",state:showEditorOnly,toggle:()=>setShowEditorOnly(s=>!s)},{label:"Free entry",state:showFreeOnly,toggle:()=>setShowFreeOnly(s=>!s)},selectedDay!==null&&{label:`${MONTHS_SHORT[TODAY.month-1]} ${selectedDay} ×`,state:true,toggle:()=>setSelectedDay(null)}].filter(Boolean).map(({label,state,toggle})=><button key={label} onClick={toggle} style={{background:state?"rgba(74,107,42,0.2)":"rgba(26,18,8,0.5)",color:state?T.fern:T.mist,border:`1px solid ${state?"rgba(106,156,56,0.3)":"rgba(58,42,24,0.6)"}`,borderRadius:8,padding:"4px 11px",fontSize:10,cursor:"pointer",fontFamily:FONT.body}}>{label}</button>)}
      </div>
      <div style={{marginTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono}}>{filtered.length} EVENT{filtered.length!==1?"S":""}{twc>0?` · ${twc} THIS WEEK`:""}</div>
        {(selectedDay||searchQuery||activeCategory!=="All"||showFreeOnly||showEditorOnly)&&<button onClick={()=>{setSelectedDay(null);setSearchQuery("");setActiveCategory("All");setShowFreeOnly(false);setShowEditorOnly(false);}} style={{fontSize:9,fontFamily:FONT.mono,color:T.rust,background:"rgba(192,80,48,0.07)",border:"1px solid rgba(192,80,48,0.2)",borderRadius:6,padding:"3px 9px",cursor:"pointer"}}>clear filters</button>}
      </div>
      <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:7}}>
        {filtered.length===0
          ? <div style={{textAlign:"center",padding:"40px 0",fontSize:13,color:T.canopy,fontFamily:FONT.body,fontStyle:"italic"}}>No events match your filters.</div>
          : filtered.map(ev=><EventCard key={ev.id} event={ev} expanded={expandedId===ev.id} onToggle={()=>setExpandedId(expandedId===ev.id?null:ev.id)}/>)}
      </div>
    </div>
  );
}

// ─── SPORTS TAB ───────────────────────────────────────────────────────────────
function GameRow({game,teamColor,ticketsUrl}) {
  const isPast=(game.month<TODAY.month)||(game.month===TODAY.month&&game.day<TODAY.day),
        isTod=game.month===TODAY.month&&game.day===TODAY.day,
        isThisWeek=!isPast&&((game.month-TODAY.month)*30+(game.day-TODAY.day))<=7;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:isPast?"transparent":isTod?`${teamColor}0d`:"rgba(26,18,8,0.3)",borderBottom:`1px solid rgba(58,42,24,0.4)`,opacity:isPast?0.35:1}}>
      <div style={{minWidth:42,textAlign:"center",background:isThisWeek&&!isPast?`${teamColor}18`:"rgba(42,30,15,0.5)",border:`1px solid ${isThisWeek&&!isPast?teamColor+"44":"rgba(58,42,24,0.5)"}`,borderRadius:8,padding:"5px 4px"}}>
        <div style={{fontSize:8,color:isThisWeek&&!isPast?teamColor:T.canopy,fontFamily:FONT.mono,fontWeight:600}}>{monthName(game.month).toUpperCase()}</div>
        <div style={{fontSize:18,fontWeight:800,color:T.cream,lineHeight:1,fontFamily:FONT.display}}>{game.day}</div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:500,color:T.parchment,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",fontFamily:FONT.body}}>
          <span style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono}}>vs</span>
          {game.opponent||"TBD"}
          {(game.note||game.promo)&&<span style={{fontSize:9,fontFamily:FONT.mono,color:teamColor,background:`${teamColor}14`,border:`1px solid ${teamColor}33`,borderRadius:8,padding:"1px 7px"}}>{game.note||game.promo}</span>}
        </div>
        <div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono,marginTop:2}}>{game.time} · {game.venue||"Bon Secours Wellness Arena"}</div>
      </div>
      <div style={{flexShrink:0,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
        {isTod&&<span style={{fontSize:9,fontFamily:FONT.mono,color:teamColor,fontWeight:600}}>TODAY</span>}
        {isThisWeek&&!isTod&&<span style={{fontSize:9,fontFamily:FONT.mono,color:T.fern}}>THIS WEEK</span>}
        {isPast&&<span style={{fontSize:9,fontFamily:FONT.mono,color:T.barkLight}}>PAST</span>}
        {!isPast&&ticketsUrl&&<a href={ticketsUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:8,fontFamily:FONT.mono,color:teamColor,background:teamColor+"18",border:`1px solid ${teamColor}44`,borderRadius:6,padding:"2px 7px",textDecoration:"none"}}>🎟 Tickets</a>}
      </div>
    </div>
  );
}

function TeamCard({team,expanded,onToggle}) {
  const upcoming=team.games.filter(g=>(g.month>TODAY.month)||(g.month===TODAY.month&&g.day>=TODAY.day)),nextGame=upcoming[0];
  return (
    <div style={{border:`1px solid ${expanded?team.color+"44":"rgba(58,42,24,0.6)"}`,borderRadius:14,overflow:"hidden",background:expanded?"rgba(42,30,15,0.5)":"rgba(26,18,8,0.4)",transition:"all 0.2s"}}>
      <div onClick={onToggle} style={{padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:26}}>{team.icon}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:16,fontWeight:700,color:T.cream,fontFamily:FONT.display}}>{team.fullName}</span>
            <span style={{fontSize:9,fontFamily:FONT.mono,color:team.color,background:`${team.color}18`,border:`1px solid ${team.color}44`,borderRadius:10,padding:"1px 7px"}}>{team.league}</span>
          </div>
          <div style={{fontSize:11,color:T.mist,marginTop:2,fontFamily:FONT.body}}>{team.sport} · {team.affiliation}</div>
          {nextGame&&<div style={{fontSize:10,color:team.color,fontFamily:FONT.mono,marginTop:4}}>Next home: {monthName(nextGame.month)} {nextGame.day} · {nextGame.time}</div>}
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:16,fontWeight:800,color:team.color,fontFamily:FONT.display}}>{upcoming.length}</div>
          <div style={{fontSize:8,color:T.canopy,fontFamily:FONT.mono}}>UPCOMING</div>
          <div style={{fontSize:9,color:expanded?team.color:T.barkLight,fontFamily:FONT.mono,marginTop:4}}>{expanded?"▲":"▼"}</div>
        </div>
      </div>
      {expanded&&<div style={{borderTop:`1px solid ${team.color}22`}}>
        <div style={{padding:"8px 14px",background:`${team.color}08`,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
          <span style={{fontSize:10,color:T.mist,fontFamily:FONT.mono}}>📍 {team.venue}</span>
          <div style={{display:"flex",gap:8}}>
            <span style={{fontSize:10,color:T.mist,fontFamily:FONT.mono}}>From {team.ticketPrice}</span>
            <a href={team.url} target="_blank" rel="noopener noreferrer" style={{fontSize:9,fontFamily:FONT.mono,color:team.color,background:`${team.color}14`,border:`1px solid ${team.color}44`,borderRadius:6,padding:"2px 9px",textDecoration:"none"}}>Full schedule ↗</a>
          </div>
        </div>
        <div style={{maxHeight:420,overflowY:"auto"}}>{team.games.map((g,i)=><GameRow key={i} game={g} teamColor={team.color} ticketsUrl={team.ticketsUrl}/>)}</div>
      </div>}
    </div>
  );
}

function SportsView() {
  const [expandedTeam,setExpandedTeam]=useState("rabbits");
  const allUpcoming=TEAMS.flatMap(t=>t.games.filter(g=>(g.month>TODAY.month)||(g.month===TODAY.month&&g.day>=TODAY.day)).map(g=>({...g,teamId:t.id,teamName:t.name,teamColor:t.color,teamIcon:t.icon,teamTicketsUrl:t.ticketsUrl}))).sort((a,b)=>(a.month*100+a.day)-(b.month*100+b.day));
  const thisWeek=allUpcoming.filter(g=>((g.month-TODAY.month)*30+(g.day-TODAY.day))<=7);
  return (
    <div style={{paddingTop:4}}>
      {thisWeek.length>0&&<div style={{marginTop:16,background:"rgba(26,18,8,0.5)",border:`1px solid rgba(74,107,42,0.2)`,borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono,letterSpacing:2,marginBottom:8}}>🏟️ HOME GAMES THIS WEEK</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>{thisWeek.map((g,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 10px",background:`${g.teamColor}0d`,border:`1px solid ${g.teamColor}2a`,borderRadius:8}}>
            <span style={{fontSize:16}}>{g.teamIcon}</span>
            <div style={{flex:1}}><span style={{fontSize:11,fontWeight:600,color:T.parchment,fontFamily:FONT.body}}>{g.teamName}</span><span style={{fontSize:10,color:T.mist,marginLeft:6,fontFamily:FONT.body}}>vs {g.opponent||"TBD"}</span></div>
            <span style={{fontSize:10,fontFamily:FONT.mono,color:g.teamColor}}>{monthName(g.month)} {g.day} · {g.time}</span>
            {g.teamTicketsUrl&&<a href={g.teamTicketsUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:9,fontFamily:FONT.mono,color:T.bark,background:g.teamColor,borderRadius:6,padding:"2px 8px",textDecoration:"none",fontWeight:600}}>🎟</a>}
          </div>
        ))}</div>
      </div>}
      <div style={{marginTop:14,display:"flex",gap:10,flexWrap:"wrap"}}>{TEAMS.map(t=>{const uc=t.games.filter(g=>(g.month>TODAY.month)||(g.month===TODAY.month&&g.day>=TODAY.day)).length;return <div key={t.id} onClick={()=>setExpandedTeam(t.id===expandedTeam?null:t.id)} style={{flex:1,minWidth:90,textAlign:"center",padding:"10px 8px",background:expandedTeam===t.id?`${t.color}14`:"rgba(26,18,8,0.4)",border:`1px solid ${expandedTeam===t.id?t.color+"44":"rgba(58,42,24,0.5)"}`,borderRadius:10,cursor:"pointer",transition:"all 0.15s"}}><div style={{fontSize:20}}>{t.icon}</div><div style={{fontSize:10,fontWeight:600,color:T.parchment,marginTop:3,fontFamily:FONT.body}}>{t.name}</div><div style={{fontSize:16,fontWeight:800,color:t.color,fontFamily:FONT.display}}>{uc}</div><div style={{fontSize:8,color:T.canopy,fontFamily:FONT.mono}}>HOME GAMES</div></div>;})}
      </div>
      <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>{TEAMS.map(t=><TeamCard key={t.id} team={t} expanded={expandedTeam===t.id} onToggle={()=>setExpandedTeam(expandedTeam===t.id?null:t.id)}/>)}</div>
    </div>
  );
}

// ─── BREWERY TAB ──────────────────────────────────────────────────────────────
function ShowRow({show,color}) {
  const isPast=(show.month<TODAY.month)||(show.month===TODAY.month&&show.day<TODAY.day),
        isThisWeek=!isPast&&((show.month-TODAY.month)*30+(show.day-TODAY.day))<=7,
        isFree=show.price==="Free";
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:isPast?"transparent":isThisWeek?`${color}0d`:"rgba(26,18,8,0.3)",borderBottom:`1px solid rgba(58,42,24,0.35)`,opacity:isPast?0.35:1}}>
      <div style={{minWidth:42,textAlign:"center",background:isThisWeek&&!isPast?`${color}18`:"rgba(42,30,15,0.5)",border:`1px solid ${isThisWeek&&!isPast?color+"55":"rgba(58,42,24,0.5)"}`,borderRadius:8,padding:"5px 4px"}}>
        <div style={{fontSize:8,color:isThisWeek&&!isPast?color:T.canopy,fontFamily:FONT.mono,fontWeight:600}}>{monthName(show.month).toUpperCase()}</div>
        <div style={{fontSize:18,fontWeight:800,color:T.cream,lineHeight:1,fontFamily:FONT.display}}>{show.day}</div>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:12,fontWeight:500,color:T.parchment,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:FONT.body}}>{show.artist}</div>
        <div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono}}>{show.time} · <span style={{color:T.dewDim}}>{show.genre}</span></div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
        <span style={{fontSize:10,fontFamily:FONT.mono,fontWeight:600,color:isFree?T.fern:T.parchment}}>{show.price}</span>
        {isThisWeek&&!isPast&&<span style={{fontSize:8,fontFamily:FONT.mono,color,background:`${color}14`,border:`1px solid ${color}33`,borderRadius:6,padding:"1px 5px"}}>THIS WEEK</span>}
        {show.ticketUrl&&!isPast&&!isFree&&<a href={show.ticketUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:8,fontFamily:FONT.mono,color,background:`${color}14`,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 7px",textDecoration:"none"}}>🎟 Tickets</a>}
      </div>
    </div>
  );
}

function BreweryCard({brewery}) {
  const [expanded,setExpanded]=useState(false);
  const upcoming=brewery.shows.filter(s=>(s.month>TODAY.month)||(s.month===TODAY.month&&s.day>=TODAY.day)),nextShow=upcoming[0];
  return (
    <div style={{background:"rgba(26,18,8,0.45)",border:`1px solid ${brewery.color}22`,borderRadius:14,overflow:"hidden",marginBottom:10}}>
      <button onClick={()=>setExpanded(e=>!e)} style={{width:"100%",background:"none",border:"none",cursor:"pointer",padding:"14px 16px",textAlign:"left",display:"flex",alignItems:"center",gap:12}}>
        <div style={{fontSize:26,flexShrink:0}}>{brewery.icon}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
            <span style={{fontSize:14,fontWeight:600,color:T.cream,fontFamily:FONT.display}}>{brewery.name}</span>
            <span style={{fontSize:9,fontFamily:FONT.mono,color:brewery.color,background:`${brewery.color}15`,border:`1px solid ${brewery.color}33`,borderRadius:8,padding:"1px 7px"}}>{brewery.area}</span>
            {brewery.region==="tr"&&<span style={{fontSize:9,fontFamily:FONT.mono,color:T.amber,background:"rgba(200,132,58,0.12)",border:`1px solid rgba(200,132,58,0.3)`,borderRadius:8,padding:"1px 7px"}}>📍 LOCAL</span>}
          </div>
          <div style={{fontSize:10,color:T.mist,fontFamily:FONT.body,marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{brewery.vibe}</div>
          {nextShow&&<div style={{marginTop:5,fontSize:10,color:brewery.color,fontFamily:FONT.mono}}>▶ Next: {monthName(nextShow.month)} {nextShow.day} — {nextShow.artist}</div>}
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
          <span style={{fontSize:11,fontWeight:700,color:brewery.color,fontFamily:FONT.display}}>{upcoming.length}</span>
          <span style={{fontSize:8,color:T.canopy,fontFamily:FONT.mono}}>UPCOMING</span>
          <span style={{fontSize:10,color:expanded?brewery.color:T.barkLight,fontFamily:FONT.mono,marginTop:2}}>{expanded?"▲":"▼"}</span>
        </div>
      </button>
      {expanded&&<div>
        <div style={{padding:"0 16px 12px",borderBottom:`1px solid rgba(58,42,24,0.5)`}}>
          <div style={{fontSize:10,color:T.canopy,fontFamily:FONT.mono,marginBottom:4}}>📍 {brewery.address}</div>
          <div style={{fontSize:10,color:T.mist,fontFamily:FONT.body,marginBottom:8,lineHeight:1.5}}>ℹ {brewery.note}</div>
          <a href={brewery.url} target="_blank" rel="noopener noreferrer" style={{fontSize:10,fontFamily:FONT.mono,color:brewery.color,textDecoration:"none",background:`${brewery.color}12`,border:`1px solid ${brewery.color}33`,borderRadius:8,padding:"4px 12px"}}>🌐 Full Calendar ↗</a>
        </div>
        <div>{brewery.shows.map((s,i)=><ShowRow key={i} show={s} color={brewery.color}/>)}</div>
      </div>}
    </div>
  );
}

function BreweriesView() {
  const [region,setRegion]=useState("all");
  const shown=region==="all"?BREWERIES:BREWERIES.filter(b=>b.region===region);
  const twShows=BREWERIES.flatMap(b=>b.shows.filter(s=>{
    const isPast=(s.month<TODAY.month)||(s.month===TODAY.month&&s.day<TODAY.day);
    return !isPast&&((s.month-TODAY.month)*30+(s.day-TODAY.day))<=7;
  }).map(s=>({...s,brewery:b}))).sort((a,b)=>(a.month*100+a.day)-(b.month*100+b.day));

  return (
    <div style={{paddingTop:4}}>
      {twShows.length>0&&<div style={{marginTop:16,marginBottom:18,background:"rgba(26,18,8,0.5)",border:`1px solid rgba(138,184,74,0.2)`,borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:9,fontFamily:FONT.mono,letterSpacing:2,color:T.fern,marginBottom:10}}>🍺 LIVE THIS WEEK</div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>{twShows.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:16}}>{s.brewery.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,fontWeight:500,color:T.parchment,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:FONT.body}}>{s.artist}</div>
              <div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono}}>{s.brewery.name} · {monthName(s.month)} {s.day} · {s.time}</div>
            </div>
            <span style={{fontSize:10,fontFamily:FONT.mono,color:s.price==="Free"?T.fern:T.parchment,fontWeight:600,flexShrink:0}}>{s.price}</span>
          </div>
        ))}</div>
      </div>}
      <div style={{display:"flex",gap:7,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","🗺️ All"],["tr","🐇 Travelers Rest"],["gvl","📍 Greenville SC"],["hendo","⛰️ Hendersonville NC"],["mills","🏔 Mills River NC"],["brevard","🌲 Brevard NC"]].map(([val,label])=>(
          <button key={val} onClick={()=>setRegion(val)} style={{background:region===val?T.mossLight:`rgba(26,18,8,0.5)`,color:region===val?T.cream:T.mist,border:`1px solid ${region===val?T.canopy:"rgba(58,42,24,0.6)"}`,borderRadius:20,padding:"5px 13px",fontSize:10,fontFamily:FONT.body,fontWeight:region===val?600:400,cursor:"pointer",transition:"all 0.15s"}}>{label}</button>
        ))}
      </div>
      {shown.map(b=><BreweryCard key={b.id} brewery={b}/>)}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
const TABS=[
  {id:"weather",   label:"🌤️ Weather"},
  {id:"events",    label:"📅 Events"},
  {id:"sports",    label:"🏟️ Sports"},
  {id:"breweries", label:"🍺 Breweries"},
];

export default function App() {
  const [activeTab,setActiveTab]=useState("weather");
  const upcomingEvents = EVENTS.filter(isUpcoming).length;
  const thisWeekEvents = EVENTS.filter(isThisWeekEvent).length;
  const upcomingGames  = TEAMS.reduce((n,t)=>n+t.games.filter(g=>(g.month>TODAY.month)||(g.month===TODAY.month&&g.day>=TODAY.day)).length,0);
  const upcomingShows  = BREWERIES.reduce((n,b)=>n+b.shows.filter(s=>(s.month>TODAY.month)||(s.month===TODAY.month&&s.day>=TODAY.day)).length,0);

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(180deg,#0e1a08 0%,#0a0e06 60%,#090c05 100%)`,color:T.parchment,fontFamily:FONT.body,paddingBottom:48}}>

      {/* HEADER */}
      <div style={{background:`linear-gradient(180deg,#16260e 0%,rgba(14,26,8,0.95) 100%)`,borderBottom:`1px solid rgba(74,107,42,0.25)`,padding:"22px 20px 18px",position:"relative",overflow:"hidden"}}>
        {/* subtle radial glow */}
        <div style={{position:"absolute",top:-60,left:"30%",width:320,height:200,background:"radial-gradient(ellipse,rgba(106,156,56,0.08),transparent 70%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:740,margin:"0 auto",position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
            <div>
              <div style={{fontFamily:FONT.mono,fontSize:9,letterSpacing:3,color:T.canopy,marginBottom:6,textTransform:"uppercase"}}>📍 Travelers Rest, SC · 29690</div>
              <h1 style={{margin:0,fontSize:28,fontWeight:700,color:T.cream,lineHeight:1.1,fontFamily:FONT.display,letterSpacing:"-0.5px"}}>
                TR Local Guide
              </h1>
              <div style={{fontSize:12,color:T.mist,marginTop:4,fontFamily:FONT.body,letterSpacing:"0.3px"}}>
                Weather · Events · Sports · Brewery Music
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end",marginBottom:4}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:T.fern,boxShadow:`0 0 8px ${T.fern}`}}/>
                <span style={{fontSize:9,color:T.fern,fontFamily:FONT.mono,fontWeight:600,letterSpacing:1}}>LIVE</span>
              </div>
              <div style={{fontSize:9,color:T.canopy,fontFamily:FONT.mono}}>Open-Meteo · GVLtoday</div>
            </div>
          </div>

          <ForestDivider/>

          <div style={{marginTop:10,display:"flex",gap:18,flexWrap:"wrap"}}>
            {[{label:"Events",val:upcomingEvents,color:T.cream},{label:"This Week",val:thisWeekEvents,color:T.fern},{label:"Home Games",val:upcomingGames,color:T.dew},{label:"Live Music",val:upcomingShows,color:T.amberGlow}].map(({label,val,color})=>(
              <div key={label} style={{textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:700,color,fontFamily:FONT.display}}>{val}</div>
                <div style={{fontSize:8,color:T.canopy,fontFamily:FONT.mono,letterSpacing:1}}>{label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{background:"rgba(10,14,6,0.97)",borderBottom:`1px solid rgba(58,42,24,0.5)`,position:"sticky",top:0,zIndex:10,backdropFilter:"blur(8px)"}}>
        <div style={{maxWidth:740,margin:"0 auto",padding:"0 16px",display:"flex"}}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{background:"none",border:"none",borderBottom:`2px solid ${activeTab===tab.id?T.amber:"transparent"}`,color:activeTab===tab.id?T.amberGlow:T.canopy,padding:"11px 14px",fontSize:11,fontFamily:FONT.mono,fontWeight:activeTab===tab.id?600:400,cursor:"pointer",letterSpacing:0.5,transition:"all 0.15s",flex:1,whiteSpace:"nowrap"}}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{maxWidth:740,margin:"0 auto",padding:"0 16px"}}>
        {activeTab==="weather"    && <WeatherView/>}
        {activeTab==="events"     && <EventsView/>}
        {activeTab==="sports"     && <SportsView/>}
        {activeTab==="breweries"  && <BreweriesView/>}
      </div>
    </div>
  );
}
