import React from 'react';
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const DARK = {
  bg:"#0A1520",bgMid:"#0F1E2E",bgCard:"#13243A",bgLight:"#1A3050",
  border:"#1E3A54",gold:"#C9A84C",goldDim:"#8B6834",goldPale:"#F0DFA0",
  teal:"#29AFA0",tealDim:"#1A7068",sage:"#7BAE7F",sageDim:"#4A7050",
  coral:"#D96845",sky:"#4A9CC8",lavender:"#8A7EC8",amber:"#E8A030",
  cream:"#EAE4D6",creamDim:"#9A9080",p1:"#C9A84C",p2:"#29AFA0",p3:"#7BAE7F",
};

const LIGHT = {
  bg:"#F4F1EB",bgMid:"#EAE5D8",bgCard:"#FFFFFF",bgLight:"#E0D9CC",
  border:"#C8BFA8",gold:"#8B6228",goldDim:"#C9A84C",goldPale:"#5C3D0E",
  teal:"#1A7068",tealDim:"#29AFA0",sage:"#3D6B40",sageDim:"#7BAE7F",
  coral:"#B84E2A",sky:"#2A6B96",lavender:"#5A4FA0",amber:"#B06010",
  cream:"#1A1208",creamDim:"#5C4A30",p1:"#8B6228",p2:"#1A7068",p3:"#3D6B40",
};

// C is set dynamically in App and passed via context — default dark for module-level use
let C = DARK;
const mono="'DM Mono','Courier New',monospace";
const serif="'Cormorant Garamond','Georgia',serif";
const sans="'Inter',system-ui,sans-serif";

const fM=(v,d=1)=>v===0?"—":`$${(v/1e6).toFixed(d)}M`;
const fK=(v)=>v===0?"—":`$${(v/1e3).toFixed(0)}K`;
const fD=(v)=>Math.abs(v)>=1e6?fM(v):Math.abs(v)>=1e3?fK(v):`$${Number(v).toFixed(0)}`;
const fP=(v)=>`${(v*100).toFixed(1)}%`;
const fYr=(v)=>v<=0?"N/A":v<1?`${(v*12).toFixed(1)} mo`:v>25?">25 yrs":`${v.toFixed(1)} yrs`;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

const CAPITALS=[
  {key:"Natural",  color:"#7BAE7F",icon:"🌿",desc:"Ecology · soil · water · biodiversity · marine"},
  {key:"Social",   color:"#4A9CC8",icon:"🤝",desc:"Community · public access · education · tribal"},
  {key:"Cultural", color:"#8A7EC8",icon:"🏺",desc:"Chumash heritage · living culture · ceremony"},
  {key:"Built",    color:"#D96845",icon:"🏗", desc:"Infrastructure · buildings · farm · lodging"},
  {key:"Financial",color:"#C9A84C",icon:"📈",desc:"Revenue · NOI · returns · endowment"},
];

const DEFAULT_SETTINGS={
  projectName:"Dos Pueblos Ranch",location:"Gaviota Coast, Santa Barbara Co., CA",acres:219,
  costBasis:52e6,defaultPurchasePrice:62e6,defaultHBU:133e6,
  defaultSellerFinance:22e6,noteInterestRate:0.055,noteTerm:7,
  defaultBuyerTaxRate:0.37,ltcgRate:0.200,niitRate:0.038,
  monthlyCarryCost:250e3,
  p1OpCostPct:0.38,p1AnnualMaintCapex:45e3,
  p2InfraFloor:200e3,p2PermittingCost:85e3,p2OpCostPct:0.42,
  renoUnitCostLo:60e3,renoUnitCostHi:150e3,
  namuStdUnitCost:276e3,namuPremUnitCost:420e3,glamRevSharePct:0.60,defaultOccupancy:0.65,
  p3BaselineStudiesCost:80e3,p3MonitoringAnnual:32e3,p3PermittingCost:60e3,p3RestorationCapex:150e3,p3OpCostPct:0.18,
  baseNatural:5,baseSocial:5,baseCultural:4,baseBuilt:5,baseFinancial:4,
};

const STREAM_DEFS=[
  {id:"abalone",  phase:"p1",name:"Abalone Farm",                  yr1Lo:800e3,yr1Hi:1200e3,yr3Lo:1500e3,yr3Hi:2000e3,capDelta:{Natural:0,Social:0,Cultural:0,Built:0,Financial:0},on:true, icon:"🐚"},
  {id:"urchin",   phase:"p1",name:"Purple Urchin / Uni",           yr1Lo:100e3,yr1Hi:200e3, yr3Lo:400e3, yr3Hi:600e3, capDelta:{Natural:0,Social:0,Cultural:0,Built:0,Financial:0},on:true, icon:"🦔"},
  {id:"tours",    phase:"p1",name:"Farm Tours",                    yr1Lo:150e3,yr1Hi:250e3, yr3Lo:300e3, yr3Hi:500e3, capDelta:{Natural:0,Social:1,Cultural:0,Built:0,Financial:0},on:true, icon:"🚶"},
  {id:"filmranch",phase:"p1",name:"Film Ranch / Locations",        yr1Lo:200e3,yr1Hi:500e3, yr3Lo:400e3, yr3Hi:600e3, capDelta:{Natural:0,Social:0,Cultural:0,Built:0,Financial:0},on:true, icon:"🎬"},
  {id:"ag",       phase:"p1",name:"Agriculture (avocado/cherimoya)",yr1Lo:100e3,yr1Hi:200e3,yr3Lo:150e3, yr3Hi:250e3, capDelta:{Natural:1,Social:0,Cultural:0,Built:0,Financial:0},on:true, icon:"🥑"},
  {id:"rental",   phase:"p1",name:"Vacation Rental (3BR)",         yr1Lo:100e3,yr1Hi:150e3, yr3Lo:120e3, yr3Hi:180e3, capDelta:{Natural:0,Social:0,Cultural:0,Built:0,Financial:0},on:true, icon:"🏠"},
  {id:"dpi",      phase:"p1",name:"Education / DPI Programs",      yr1Lo:50e3, yr1Hi:100e3, yr3Lo:200e3, yr3Hi:400e3, capDelta:{Natural:0,Social:2,Cultural:2,Built:0,Financial:0},on:true, icon:"📚"},
  {id:"kelp",     phase:"p1",name:"Kelp Farming (expansion)",      yr1Lo:0,    yr1Hi:0,     yr3Lo:150e3, yr3Hi:400e3, capDelta:{Natural:2,Social:0,Cultural:0,Built:1,Financial:0},on:false,icon:"🌊",capexLo:80e3,capexHi:200e3,note:"Coastal restoration + commercial harvest"},
  {id:"fishing",  phase:"p1",name:"Commercial Fishing License",    yr1Lo:30e3, yr1Hi:60e3,  yr3Lo:50e3,  yr3Hi:100e3, capDelta:{Natural:0,Social:0,Cultural:0,Built:0,Financial:0},on:false,icon:"🎣"},
  {id:"chumkitch",phase:"p2",name:"Chumash Kitchen / F&B",         yr1Lo:0,    yr1Hi:0,     yr3Lo:300e3, yr3Hi:600e3, capDelta:{Natural:0,Social:1,Cultural:3,Built:1,Financial:1},on:false,icon:"🍽",capexLo:150e3,capexHi:350e3,note:"Tribal co-managed restaurant + catering"},
  {id:"wedding",  phase:"p2",name:"Weddings & Events Venue",        yr1Lo:100e3,yr1Hi:200e3, yr3Lo:300e3, yr3Hi:600e3, capDelta:{Natural:0,Social:2,Cultural:0,Built:0,Financial:1},on:false,icon:"💍",capexLo:50e3,capexHi:120e3,note:"Ocean-view site + barn"},
  {id:"corporate",phase:"p2",name:"Corporate Retreats",             yr1Lo:50e3, yr1Hi:150e3, yr3Lo:200e3, yr3Hi:500e3, capDelta:{Natural:0,Social:1,Cultural:0,Built:0,Financial:1},on:false,icon:"🤝"},
  {id:"wellness", phase:"p2",name:"Wellness / Spa",                 yr1Lo:0,    yr1Hi:0,     yr3Lo:150e3, yr3Hi:400e3, capDelta:{Natural:0,Social:1,Cultural:1,Built:1,Financial:1},on:false,icon:"🧘",capexLo:100e3,capexHi:250e3,note:"Chumash-informed healing modalities"},
  {id:"marinesci",phase:"p2",name:"Marine Science Education Hub",   yr1Lo:0,    yr1Hi:50e3,  yr3Lo:200e3, yr3Hi:500e3, capDelta:{Natural:1,Social:2,Cultural:1,Built:1,Financial:1},on:false,icon:"🔬",capexLo:100e3,capexHi:300e3,note:"UCSB / Scripps / NOAA partnership"},
  {id:"biodivcredit",phase:"p3",name:"Biodiversity Credits",        yr1Lo:0,    yr1Hi:0,     yr3Lo:200e3, yr3Hi:500e3, capDelta:{Natural:3,Social:0,Cultural:0,Built:0,Financial:1},on:false,icon:"🦋",note:"Market est. $37.5B by 2032"},
  {id:"bluecarbon",  phase:"p3",name:"Blue Carbon / Kelp Credits",  yr1Lo:0,    yr1Hi:0,     yr3Lo:100e3, yr3Hi:300e3, capDelta:{Natural:2,Social:0,Cultural:0,Built:0,Financial:1},on:false,icon:"🌊"},
  {id:"nrcs",        phase:"p3",name:"NRCS / EQIP Payments",        yr1Lo:50e3, yr1Hi:100e3, yr3Lo:75e3,  yr3Hi:150e3, capDelta:{Natural:1,Social:0,Cultural:0,Built:0,Financial:0},on:false,icon:"🌾"},
  {id:"calfire",     phase:"p3",name:"CalFire Prescribed Grazing",  yr1Lo:25e3, yr1Hi:75e3,  yr3Lo:50e3,  yr3Hi:100e3, capDelta:{Natural:1,Social:0,Cultural:0,Built:0,Financial:0},on:false,icon:"🔥"},
  {id:"mitigation",  phase:"p3",name:"Mitigation Banking",          yr1Lo:0,    yr1Hi:0,     yr3Lo:100e3, yr3Hi:300e3, capDelta:{Natural:2,Social:0,Cultural:0,Built:0,Financial:1},on:false,icon:"⚖️",capexLo:100e3,capexHi:300e3,note:"Coastal wetland / creek credits"},
  {id:"hydro",       phase:"p3",name:"Micro-Hydro (DP Creek)",      yr1Lo:0,    yr1Hi:0,     yr3Lo:50e3,  yr3Hi:150e3, capDelta:{Natural:0,Social:0,Cultural:0,Built:2,Financial:0},on:false,icon:"💧",capexLo:200e3,capexHi:500e3},
  {id:"researchlab", phase:"p3",name:"Marine Research Lab Lease",   yr1Lo:0,    yr1Hi:50e3,  yr3Lo:100e3, yr3Hi:200e3, capDelta:{Natural:1,Social:1,Cultural:0,Built:2,Financial:1},on:false,icon:"🧪",capexLo:150e3,capexHi:400e3,note:"UCSB / NOAA / Scripps adjacency"},
  {id:"endowment",   phase:"p3",name:"Stewardship Endowment Draw",  yr1Lo:0,    yr1Hi:0,     yr3Lo:150e3, yr3Hi:300e3, capDelta:{Natural:0,Social:0,Cultural:0,Built:0,Financial:1},on:false,icon:"🏦",note:"5% draw on philanthropic endowment"},
  {id:"easement",    phase:"p3",name:"Conservation Easement",       yr1Lo:0,    yr1Hi:0,     yr3Lo:0,     yr3Hi:0,     capDelta:{Natural:3,Social:0,Cultural:1,Built:0,Financial:2},on:false,icon:"📜",oneTime:true,note:"One-time closing event — buyer tax optimization"},
  {id:"parcel",      phase:"p3",name:"Development Parcel Sale",     yr1Lo:0,    yr1Hi:0,     yr3Lo:0,     yr3Hi:0,     capDelta:{Natural:-1,Social:0,Cultural:0,Built:0,Financial:2},on:false,icon:"🗺",oneTime:true,note:"1–2 entitled parcels · retain conservation remainder"},
];

const PHASE_META={
  p1:{label:"Phase I",  sublabel:"Existing Operations",     color:C.p1,desc:"Zero development capex. Revenue from currently-operating assets."},
  p2:{label:"Phase II", sublabel:"Eco-Lodge + Hospitality", color:C.p2,desc:"Glamping units + hospitality programming under AEO."},
  p3:{label:"Phase III",sublabel:"Conservation Finance",    color:C.p3,desc:"Stack public + private conservation revenue streams."},
};

const SK_SETTINGS ="prt:settings:v1";
const SK_SESSION  ="prt:session:dos-pueblos:v1";
const SK_SCENARIOS="prt:scenarios:dos-pueblos:v1";

// Storage helpers — safe in published artifacts (window.storage may not exist)
// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
// Paste your Supabase project URL and anon key here.
// Table required: CREATE TABLE prt_storage (key text primary key, value text, updated_at timestamptz default now());
// RLS policy: FOR ALL USING (true) WITH CHECK (true);
const SB_URL = "https://uvojezuorjgqzmhhgluu.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2b2plenVvcmpncXptaGhnbHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMTQ3MTcsImV4cCI6MjA4Njg5MDcxN30.1irtkNYnTJbvg8VJMQh-VpByqpmIRiASwR1qTOZ6RiQ";
const SB_READY = SB_URL !== "YOUR_SUPABASE_URL" && SB_KEY !== "YOUR_SUPABASE_ANON_KEY";

const SB_HEADERS = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
};

async function sGet(key, fb) {
  // Try Supabase first (works everywhere — published, Claude.ai, any browser)
  if (SB_READY) {
    try {
      const res = await fetch(
        `${SB_URL}/rest/v1/prt_storage?key=eq.${encodeURIComponent(key)}&select=value`,
        { headers: SB_HEADERS }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.value) return JSON.parse(data[0].value);
    } catch {}
  }
  // Fallback: window.storage (Claude.ai only)
  if (typeof window !== "undefined" && typeof window.storage?.get === "function") {
    try {
      const timeout = new Promise((_,rej) => setTimeout(() => rej(new Error("timeout")), 1500));
      const r = await Promise.race([window.storage.get(key), timeout]);
      if (r) return JSON.parse(r.value);
    } catch {}
  }
  return fb;
}

async function sSet(key, val) {
  const serialized = JSON.stringify(val);
  // Write to Supabase (upsert via merge-duplicates)
  if (SB_READY) {
    try {
      await fetch(`${SB_URL}/rest/v1/prt_storage`, {
        method: "POST",
        headers: { ...SB_HEADERS, Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ key, value: serialized, updated_at: new Date().toISOString() }),
      });
    } catch {}
  }
  // Also write to window.storage when available (keeps Claude.ai in sync)
  if (typeof window !== "undefined" && typeof window.storage?.set === "function") {
    try { await window.storage.set(key, serialized); } catch {}
  }
}

const sRev=(s,m,yr)=>{const lo=yr===1?s.yr1Lo:s.yr3Lo,hi=yr===1?s.yr1Hi:s.yr3Hi;return lo+(hi-lo)*m;};

// ─── SMALL UI ────────────────────────────────────────────────────────────────
function Slider({label,val,set,min,max,step,fmt,sub,color=C.gold,disabled}){
  const pct=((val-min)/(max-min))*100;
  return(<div style={{marginBottom:13,opacity:disabled?0.4:1}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
      <span style={{fontSize:11,color:C.creamDim}}>{label}</span>
      <span style={{fontSize:12,fontWeight:700,color,fontFamily:mono}}>{fmt(val)}</span>
    </div>
    {sub&&<div style={{fontSize:10,color:C.creamDim,opacity:.7,marginBottom:3}}>{sub}</div>}
    <div style={{position:"relative",height:5,background:C.bgLight,borderRadius:3}}>
      <div style={{position:"absolute",left:0,top:0,height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${color}60,${color})`,borderRadius:3}}/>
      <input type="range" min={min} max={max} step={step} value={val} disabled={disabled}
        onChange={e=>set(Number(e.target.value))}
        style={{position:"absolute",top:-10,left:0,width:"100%",opacity:0,cursor:disabled?"not-allowed":"pointer",height:24}}/>
    </div>
  </div>);
}

function NumInput({label,val,set,prefix="$",suffix="",note}){
  return(<div style={{marginBottom:11}}>
    <div style={{fontSize:10,color:C.creamDim,marginBottom:3}}>{label}</div>
    {note&&<div style={{fontSize:9,color:C.creamDim,opacity:.7,marginBottom:3}}>{note}</div>}
    <div style={{display:"flex",alignItems:"center",background:C.bgLight,borderRadius:5,border:`1px solid ${C.border}`,overflow:"hidden"}}>
      {prefix&&<span style={{fontSize:11,color:C.creamDim,padding:"0 8px"}}>{prefix}</span>}
      <input type="number" value={val} onChange={e=>set(Number(e.target.value)||0)}
        style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.cream,fontFamily:mono,fontSize:12,padding:"6px 4px 6px 0"}}/>
      {suffix&&<span style={{fontSize:11,color:C.creamDim,padding:"0 8px"}}>{suffix}</span>}
    </div>
  </div>);
}

function CheckRow({id,label,icon,checked,onChange,note,color,oneTime}){
  return(<label style={{display:"flex",alignItems:"flex-start",gap:7,cursor:"pointer",padding:"5px 7px",
    borderRadius:5,marginBottom:2,background:checked?`${color}0D`:"transparent",
    border:`1px solid ${checked?`${color}40`:C.border}`,transition:"all 0.14s"}}>
    <div style={{width:13,height:13,borderRadius:3,border:`2px solid ${color}`,background:checked?color:"transparent",
      flexShrink:0,marginTop:2,display:"flex",alignItems:"center",justifyContent:"center"}}
      onClick={()=>onChange(!checked)}>
      {checked&&<span style={{fontSize:8,color:C.bg,fontWeight:900,lineHeight:1}}>✓</span>}
    </div>
    <div onClick={()=>onChange(!checked)} style={{flex:1,minWidth:0}}>
      <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
        <span style={{fontSize:11}}>{icon}</span>
        <span style={{fontSize:11,color:checked?C.cream:C.creamDim,fontWeight:checked?600:400}}>{label}</span>
        {oneTime&&<span style={{fontSize:8,color:C.amber,background:`${C.amber}20`,border:`1px solid ${C.amber}50`,borderRadius:3,padding:"1px 4px",fontFamily:mono}}>1×</span>}
      </div>
      {note&&<div style={{fontSize:9,color:C.creamDim,marginTop:1,opacity:.8}}>{note}</div>}
    </div>
  </label>);
}

function PhaseHeader({pid,active,onToggle,yr3noi}){
  const p=PHASE_META[pid];
  return(<button onClick={()=>onToggle(pid)} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",
    borderRadius:7,cursor:"pointer",width:"100%",border:`2px solid ${active?p.color:C.border}`,
    background:active?`${p.color}12`:C.bgMid,transition:"all 0.18s",textAlign:"left"}}>
    <div style={{width:15,height:15,borderRadius:3,border:`2px solid ${p.color}`,background:active?p.color:"transparent",
      flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
      {active&&<span style={{fontSize:9,color:C.bg,fontWeight:900}}>✓</span>}
    </div>
    <div style={{flex:1}}>
      <div style={{fontSize:12,fontWeight:700,color:active?p.color:C.cream}}>{p.label} — {p.sublabel}</div>
      <div style={{fontSize:9,color:C.creamDim}}>{p.desc}</div>
    </div>
    {active&&yr3noi>0&&<div style={{fontSize:10,fontWeight:700,color:p.color,fontFamily:mono,flexShrink:0,textAlign:"right"}}>{fD(yr3noi)}<span style={{fontSize:8,fontWeight:400,color:C.creamDim}}><br/>Yr3 NOI</span></div>}
  </button>);
}

function Kpi({label,value,sub,accent,size=15,warn}){
  return(<div style={{background:C.bgCard,border:`1px solid ${warn?`${C.coral}60`:accent?`${accent}40`:C.border}`,borderRadius:8,padding:"10px 12px"}}>
    <div style={{fontSize:9,color:C.creamDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
    <div style={{fontSize:size,fontWeight:800,color:warn?C.coral:accent||C.cream,fontFamily:mono,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:C.creamDim,marginTop:4,lineHeight:1.4}}>{sub}</div>}
  </div>);
}

function CapBar({cap,score,delta}){
  const pct=clamp(score,0,10)/10;
  return(<div style={{marginBottom:11}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontSize:12}}>{cap.icon}</span>
        <span style={{fontSize:11,color:C.cream,fontWeight:600}}>{cap.key}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        {delta!==0&&<span style={{fontSize:9,fontFamily:mono,color:delta>0?C.sage:C.coral,fontWeight:700}}>{delta>0?"+":""}{delta}</span>}
        <span style={{fontSize:12,fontFamily:mono,fontWeight:700,color:cap.color}}>{score.toFixed(1)}/10</span>
      </div>
    </div>
    <div style={{height:5,background:C.bgLight,borderRadius:3,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct*100}%`,background:`linear-gradient(90deg,${cap.color}70,${cap.color})`,borderRadius:3,transition:"width 0.5s ease"}}/>
    </div>
    <div style={{fontSize:9,color:C.creamDim,marginTop:2}}>{cap.desc}</div>
  </div>);
}

const TTip=({active,payload,label})=>{
  if(!active||!payload?.length)return null;
  return(<div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"9px 12px"}}>
    <div style={{fontSize:11,color:C.cream,fontWeight:700,marginBottom:6}}>{label}</div>
    {payload.map((p,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:10,marginBottom:3}}>
      <span style={{color:p.fill}}>{p.name}</span>
      <span style={{fontFamily:mono,color:C.cream}}>{fD(p.value)}</span>
    </div>))}
  </div>);
};

// ─── GLAMPING BUILDER ─────────────────────────────────────────────────────────
function GlampingBuilder({unitTypes,setUnitTypes,globalOcc,setGlobalOcc,S}){
  const units=[
    {key:"reno",     label:"Renovate Existing Buildings",icon:"🏚→🛖",color:C.amber, rateLo:195,rateHi:350,maxUnits:6},
    {key:"namu_std", label:"Issho Namu Standard",        icon:"🛖",   color:C.teal,  rateLo:280,rateHi:450,maxUnits:15},
    {key:"namu_prem",label:"Issho Namu Premium",         icon:"🏕✨", color:C.lavender,rateLo:450,rateHi:700,maxUnits:10},
  ];
  return(<div style={{marginBottom:6}}>
    {units.map(u=>{
      const st=unitTypes[u.key];const on=st.enabled;
      const unitCost=u.key==="reno"?(st.costPerUnit||100e3):u.key==="namu_std"?S.namuStdUnitCost:S.namuPremUnitCost;
      const yr3PropRev=st.count*st.rate*365*globalOcc*S.glamRevSharePct;
      return(<div key={u.key} style={{background:on?`${u.color}0A`:C.bgCard,border:`1px solid ${on?`${u.color}50`:C.border}`,borderRadius:7,padding:"9px 10px",marginBottom:7}}>
        <label style={{display:"flex",gap:7,alignItems:"center",cursor:"pointer",marginBottom:on?9:0}}>
          <div style={{width:12,height:12,borderRadius:3,border:`2px solid ${u.color}`,background:on?u.color:"transparent",flexShrink:0,
            display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={()=>setUnitTypes(p=>({...p,[u.key]:{...p[u.key],enabled:!on}}))}>
            {on&&<span style={{fontSize:7,color:C.bg,fontWeight:900}}>✓</span>}
          </div>
          <span style={{fontSize:11,fontWeight:on?700:400,color:on?u.color:C.creamDim}}>{u.icon} {u.label}</span>
        </label>
        {on&&<div>
          <Slider label="# Units" val={st.count} min={1} max={u.maxUnits} step={1}
            set={v=>setUnitTypes(p=>({...p,[u.key]:{...p[u.key],count:v}}))} fmt={v=>`${v} units`} color={u.color}/>
          {u.key==="reno"
            ?<Slider label="Reno Cost/Unit" val={st.costPerUnit||100e3} min={S.renoUnitCostLo} max={S.renoUnitCostHi} step={5e3}
                set={v=>setUnitTypes(p=>({...p,[u.key]:{...p[u.key],costPerUnit:v}}))} fmt={fD} color={u.color}
                sub={`Total reno capex: ${fD(unitCost*st.count)}`}/>
            :<div style={{fontSize:10,color:u.color,fontFamily:mono,marginBottom:8}}>Unit cost (Settings): {fD(unitCost)} · Total: <strong>{fD(unitCost*st.count)}</strong></div>}
          <Slider label="Nightly Rate" val={st.rate} min={u.rateLo} max={u.rateHi} step={5}
            set={v=>setUnitTypes(p=>({...p,[u.key]:{...p[u.key],rate:v}}))} fmt={v=>`$${v}/nt`} color={u.color}/>
          <div style={{fontSize:9,color:C.creamDim,background:C.bgMid,borderRadius:4,padding:"5px 7px"}}>
            Yr3 gross: <span style={{color:C.cream,fontFamily:mono}}>{fD(st.count*st.rate*365*globalOcc)}</span>
            {" "}· {fP(S.glamRevSharePct)} to property: <span style={{color:u.color,fontFamily:mono,fontWeight:700}}>{fD(yr3PropRev)}</span>
          </div>
        </div>}
      </div>);
    })}
    <Slider label="Portfolio Occupancy" val={globalOcc} min={0.35} max={0.90} step={0.01}
      set={setGlobalOcc} fmt={fP} color={C.teal} sub="El Capitan Canyon: 70–75% · applies to all unit types"/>
  </div>);
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettBox({title,color=C.gold,children}){
  const [o,setO]=useState(true);
  return(<div style={{marginBottom:14}}>
    <button onClick={()=>setO(!o)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"transparent",border:"none",cursor:"pointer",borderBottom:`1px solid ${color}40`,paddingBottom:7,marginBottom:o?11:0}}>
      <span style={{fontSize:9,color,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",flex:1,textAlign:"left"}}>{title}</span>
      <span style={{fontSize:11,color:C.creamDim}}>{o?"▲":"▼"}</span>
    </button>
    {o&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 14px"}}>{children}</div>}
  </div>);
}

function SettingsPage({settings:S,setSettings,onClose}){
  const set=(k,v)=>setSettings(p=>({...p,[k]:v}));
  return(<div style={{padding:"20px 24px",maxWidth:900,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div>
        <div style={{fontSize:9,color:C.gold,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:3}}>PRT Project Configuration</div>
        <div style={{fontSize:18,fontWeight:800,fontFamily:serif,color:C.cream}}>Settings — {S.projectName}</div>
        <div style={{fontSize:11,color:C.creamDim,marginTop:3}}>Saved locally · reusable across PRT project artifacts</div>
      </div>
      <button onClick={onClose} style={{padding:"8px 18px",borderRadius:7,border:`1px solid ${C.gold}`,background:`${C.gold}20`,color:C.gold,cursor:"pointer",fontWeight:700,fontSize:12}}>← Back to Model</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <div>
        <SettBox title="Project Identity">
          <div style={{gridColumn:"1/-1",marginBottom:10}}>
            <div style={{fontSize:10,color:C.creamDim,marginBottom:3}}>Project Name</div>
            <input value={S.projectName} onChange={e=>set("projectName",e.target.value)}
              style={{width:"100%",background:C.bgLight,border:`1px solid ${C.border}`,borderRadius:5,color:C.cream,fontFamily:mono,fontSize:12,padding:"6px 10px",outline:"none"}}/>
          </div>
          <div style={{gridColumn:"1/-1",marginBottom:10}}>
            <div style={{fontSize:10,color:C.creamDim,marginBottom:3}}>Location</div>
            <input value={S.location} onChange={e=>set("location",e.target.value)}
              style={{width:"100%",background:C.bgLight,border:`1px solid ${C.border}`,borderRadius:5,color:C.cream,fontSize:12,padding:"6px 10px",outline:"none"}}/>
          </div>
          <NumInput label="Total Acres" val={S.acres} set={v=>set("acres",v)} prefix="" suffix="ac"/>
          <NumInput label="Cost Basis" val={S.costBasis} set={v=>set("costBasis",v)}/>
        </SettBox>
        <SettBox title="Deal Parameters">
          <NumInput label="Default Purchase Price" val={S.defaultPurchasePrice} set={v=>set("defaultPurchasePrice",v)}/>
          <NumInput label="Default HBU Appraisal" val={S.defaultHBU} set={v=>set("defaultHBU",v)}/>
          <NumInput label="Default Seller Finance" val={S.defaultSellerFinance} set={v=>set("defaultSellerFinance",v)}/>
          <NumInput label="Note Interest Rate" val={S.noteInterestRate} set={v=>set("noteInterestRate",v)} prefix="" suffix="%" note="e.g. 0.055 for 5.5%"/>
          <NumInput label="LTCG Rate" val={S.ltcgRate} set={v=>set("ltcgRate",v)} prefix="" suffix="%"/>
          <NumInput label="NIIT Rate" val={S.niitRate} set={v=>set("niitRate",v)} prefix="" suffix="%"/>
          <NumInput label="Default Buyer Tax Rate" val={S.defaultBuyerTaxRate} set={v=>set("defaultBuyerTaxRate",v)} prefix="" suffix="%"/>
          <NumInput label="Monthly Carry Cost" val={S.monthlyCarryCost} set={v=>set("monthlyCarryCost",v)}/>
        </SettBox>
        <SettBox title="Five Capitals Baseline" color={C.sage}>
          {CAPITALS.map(cap=>(<NumInput key={cap.key} label={`${cap.icon} ${cap.key} (0–10)`} val={S[`base${cap.key}`]} set={v=>set(`base${cap.key}`,clamp(Number(v),0,10))} prefix=""/>))}
        </SettBox>
      </div>
      <div>
        <SettBox title="Phase I — Operating Costs" color={C.p1}>
          <NumInput label="Op Cost % of Gross" val={S.p1OpCostPct} set={v=>set("p1OpCostPct",v)} prefix="" suffix="%" note="Staff, utilities, farm maintenance"/>
          <NumInput label="Annual Maintenance Capex" val={S.p1AnnualMaintCapex} set={v=>set("p1AnnualMaintCapex",v)} note="Keep existing infra running"/>
        </SettBox>
        <SettBox title="Phase II — Eco-Lodge Costs" color={C.p2}>
          <NumInput label="Infrastructure Floor" val={S.p2InfraFloor} set={v=>set("p2InfraFloor",v)} note="Site prep, paths, electrical — always required"/>
          <NumInput label="Permitting Cost" val={S.p2PermittingCost} set={v=>set("p2PermittingCost",v)} note="AEO, CCC scoping, legal — always required"/>
          <NumInput label="Op Cost % of Gross" val={S.p2OpCostPct} set={v=>set("p2OpCostPct",v)} prefix="" suffix="%" note="Hospitality operating costs"/>
          <NumInput label="Revenue Share to Property" val={S.glamRevSharePct} set={v=>set("glamRevSharePct",v)} prefix="" suffix="%" note="% of gross glamping rev retained"/>
          <NumInput label="Issho Namu Standard ($/unit)" val={S.namuStdUnitCost} set={v=>set("namuStdUnitCost",v)}/>
          <NumInput label="Issho Namu Premium ($/unit)" val={S.namuPremUnitCost} set={v=>set("namuPremUnitCost",v)}/>
          <NumInput label="Reno Cost/Unit — Low" val={S.renoUnitCostLo} set={v=>set("renoUnitCostLo",v)}/>
          <NumInput label="Reno Cost/Unit — High" val={S.renoUnitCostHi} set={v=>set("renoUnitCostHi",v)}/>
        </SettBox>
        <SettBox title="Phase III — Conservation Costs" color={C.p3}>
          <NumInput label="Baseline Ecological Studies" val={S.p3BaselineStudiesCost} set={v=>set("p3BaselineStudiesCost",v)} note="Required before credit programs"/>
          <NumInput label="Annual Monitoring Cost" val={S.p3MonitoringAnnual} set={v=>set("p3MonitoringAnnual",v)} note="Annual credit program reporting"/>
          <NumInput label="Credit Program Permitting" val={S.p3PermittingCost} set={v=>set("p3PermittingCost",v)}/>
          <NumInput label="Initial Restoration Capex" val={S.p3RestorationCapex} set={v=>set("p3RestorationCapex",v)} note="Estuary / creek / wetland initial work"/>
          <NumInput label="Op Cost % of Gross" val={S.p3OpCostPct} set={v=>set("p3OpCostPct",v)} prefix="" suffix="%" note="Conservation income is mostly passive"/>
        </SettBox>
      </div>
    </div>
    <div style={{borderTop:`1px solid ${C.border}`,marginTop:18,paddingTop:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontSize:10,color:C.creamDim}}>Settings auto-saved to local storage · reusable across PRT project artifacts</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>setSettings(DEFAULT_SETTINGS)} style={{padding:"7px 16px",borderRadius:6,border:`1px solid ${C.coral}`,background:"transparent",color:C.coral,cursor:"pointer",fontSize:11}}>Reset to Defaults</button>
        <button onClick={onClose} style={{padding:"7px 18px",borderRadius:6,border:`1px solid ${C.gold}`,background:`${C.gold}20`,color:C.gold,cursor:"pointer",fontWeight:700,fontSize:12}}>Save & Return</button>
      </div>
    </div>
  </div>);
}

// ─── SCENARIOS PAGE ───────────────────────────────────────────────────────────
function ScenariosPage({scenarios,onSave,onLoad,onDelete,onClose}){
  const [nm,setNm]=useState("");
  return(<div style={{padding:"20px 24px",maxWidth:720,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div>
        <div style={{fontSize:9,color:C.teal,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:3}}>Session Snapshots</div>
        <div style={{fontSize:18,fontWeight:800,fontFamily:serif,color:C.cream}}>Scenario Manager</div>
        <div style={{fontSize:11,color:C.creamDim,marginTop:3}}>Save named snapshots — all params, phases, unit configs, stream selections</div>
      </div>
      <button onClick={onClose} style={{padding:"8px 18px",borderRadius:7,border:`1px solid ${C.teal}`,background:`${C.teal}20`,color:C.teal,cursor:"pointer",fontWeight:700,fontSize:12}}>← Back to Model</button>
    </div>
    <div style={{background:C.bgCard,border:`1px solid ${C.teal}40`,borderRadius:10,padding:"16px 20px",marginBottom:18}}>
      <div style={{fontSize:11,fontWeight:700,color:C.teal,marginBottom:10}}>Save Current Session</div>
      <div style={{display:"flex",gap:10}}>
        <input value={nm} onChange={e=>setNm(e.target.value)} placeholder='e.g. "Roger Meeting — Base Case"'
          style={{flex:1,background:C.bgLight,border:`1px solid ${C.border}`,borderRadius:6,color:C.cream,fontSize:12,padding:"8px 12px",outline:"none"}}/>
        <button onClick={()=>{if(nm.trim()){onSave(nm.trim());setNm("");}}} style={{padding:"8px 18px",borderRadius:6,border:`1px solid ${C.teal}`,background:`${C.teal}20`,color:C.teal,cursor:"pointer",fontWeight:700,fontSize:12,flexShrink:0}}>Save Snapshot</button>
      </div>
    </div>
    {scenarios.length===0
      ?<div style={{textAlign:"center",padding:"40px 20px",color:C.creamDim}}>
          <div style={{fontSize:24,marginBottom:8}}>📋</div>
          <div style={{fontSize:13}}>No saved scenarios yet</div>
        </div>
      :scenarios.map((sc,i)=>{
          const d=new Date(sc.timestamp);
          return(<div key={i} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9,padding:"13px 18px",marginBottom:9,display:"flex",alignItems:"center",gap:14}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:C.cream,marginBottom:3}}>{sc.name}</div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:C.creamDim}}>{d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})} · {d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
                {sc.meta?.phases&&<span style={{fontSize:10,color:C.gold}}>{sc.meta.phases}</span>}
                {sc.meta?.yr3&&<span style={{fontSize:10,color:C.teal,fontFamily:mono}}>{fD(sc.meta.yr3)} Yr3 gross</span>}
                {sc.meta?.noi3&&<span style={{fontSize:10,color:C.sage,fontFamily:mono}}>{fD(sc.meta.noi3)} NOI</span>}
                <span style={{fontSize:10,color:C.creamDim}}>{{"low":"Conservative","mid":"Base Case","high":"Upside"}[sc.state?.scenario]||""}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:7,flexShrink:0}}>
              <button onClick={()=>onLoad(sc)} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${C.gold}`,background:`${C.gold}15`,color:C.gold,cursor:"pointer",fontSize:11,fontWeight:700}}>Load</button>
              <button onClick={()=>onDelete(i)} style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${C.coral}40`,background:"transparent",color:C.coral,cursor:"pointer",fontSize:11}}>✕</button>
            </div>
          </div>);
        })}
  </div>);
}

// ═══ MAIN APP ═════════════════════════════════════════════════════════════════
export default function App(){
  const [isDark,setIsDark]=useState(()=>{
    try{return localStorage.getItem("prt:theme")!=="light";}catch{return true;}
  });
  // Update module-level C so all components use correct theme
  C = isDark ? DARK : LIGHT;
  const toggleTheme=()=>{
    setIsDark(d=>{
      const next=!d;
      try{localStorage.setItem("prt:theme",next?"dark":"light");}catch{}
      return next;
    });
  };
  const [view,setView]=useState("model");
  const [settings,setSettings]=useState(DEFAULT_SETTINGS);
  const [loaded,setLoaded]=useState(false);
  const [scenarios,setScenarios]=useState([]);
  const [scenario,setScenario]=useState("mid");
  const [activePhases,setActivePhases]=useState({p1:true,p2:false,p3:false});
  const [activeStreams,setActiveStreams]=useState(Object.fromEntries(STREAM_DEFS.map(s=>[s.id,s.on])));
  const [purchasePrice,setPP]=useState(DEFAULT_SETTINGS.defaultPurchasePrice);
  const [hbu,setHbu]=useState(DEFAULT_SETTINGS.defaultHBU);
  const [buyerTax,setBuyerTax]=useState(DEFAULT_SETTINGS.defaultBuyerTaxRate);
  const [sellerNote,setNote]=useState(DEFAULT_SETTINGS.defaultSellerFinance);
  const [unitTypes,setUnitTypes]=useState({
    reno:     {enabled:false,count:3,rate:250,costPerUnit:100e3},
    namu_std: {enabled:false,count:8,rate:320},
    namu_prem:{enabled:false,count:4,rate:520},
  });
  const [occ,setOcc]=useState(DEFAULT_SETTINGS.defaultOccupancy);
  const [parcelSale,setParcelSale]=useState(2e6);
  const [tabR,setTabR]=useState("capitals");
  const [saveFlash,setSaveFlash]=useState(false);
  const saveTimer=useRef(null);

  const mult={"low":0,"mid":.5,"high":1}[scenario];
  const S=settings;

  // Sync body background with theme
  useEffect(()=>{
    document.body.style.background = isDark ? DARK.bg : LIGHT.bg;
  },[isDark]);

  // LOAD
  useEffect(()=>{(async()=>{
    const sv=await sGet(SK_SETTINGS,DEFAULT_SETTINGS);
    const ss=await sGet(SK_SESSION,null);
    const sc=await sGet(SK_SCENARIOS,[]);
    setSettings({...DEFAULT_SETTINGS,...sv});
    if(ss){
      try{
        if(ss.scenario)      setScenario(ss.scenario);
        if(ss.activePhases)  setActivePhases(ss.activePhases);
        if(ss.activeStreams)  setActiveStreams(ss.activeStreams);
        if(ss.purchasePrice) setPP(ss.purchasePrice);
        if(ss.hbu)           setHbu(ss.hbu);
        if(ss.buyerTax)      setBuyerTax(ss.buyerTax);
        if(ss.sellerNote)    setNote(ss.sellerNote);
        if(ss.unitTypes)     setUnitTypes(ss.unitTypes);
        if(ss.occ)           setOcc(ss.occ);
        if(ss.parcelSale)    setParcelSale(ss.parcelSale);
      }catch{}
    }
    setScenarios(sc);
    setLoaded(true);
  })();},[]);

  // AUTO-SAVE SESSION
  useEffect(()=>{
    if(!loaded)return;
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      sSet(SK_SESSION,{scenario,activePhases,activeStreams,purchasePrice,hbu,buyerTax,sellerNote,unitTypes,occ,parcelSale});
      setSaveFlash(true);setTimeout(()=>setSaveFlash(false),2000);
    },900);
  },[scenario,activePhases,activeStreams,purchasePrice,hbu,buyerTax,sellerNote,unitTypes,occ,parcelSale,loaded]);

  // AUTO-SAVE SETTINGS
  useEffect(()=>{if(loaded)sSet(SK_SETTINGS,settings);},[settings,loaded]);

  // COMPUTE
  const calc=useMemo(()=>{
    let gGross1=0,gGross3=0,gCapex=0;
    if(activePhases.p2){
      const{reno,namu_std,namu_prem}=unitTypes;
      const g=(u,yr)=>u.enabled?u.count*u.rate*365*occ*(yr===1?0.35:1)*S.glamRevSharePct:0;
      gGross1=g(reno,1)+g(namu_std,1)+g(namu_prem,1);
      gGross3=g(reno,3)+g(namu_std,3)+g(namu_prem,3);
      gCapex+=S.p2InfraFloor+S.p2PermittingCost;
      if(reno.enabled)      gCapex+=(reno.costPerUnit||100e3)*reno.count;
      if(namu_std.enabled)  gCapex+=S.namuStdUnitCost*namu_std.count;
      if(namu_prem.enabled) gCapex+=S.namuPremUnitCost*namu_prem.count;
    }
    let devCapex=gCapex,oneTimeRev=0;
    if(activePhases.p3) devCapex+=S.p3BaselineStudiesCost+S.p3PermittingCost+S.p3RestorationCapex;
    const rows=[];
    const deltas={Natural:0,Social:0,Cultural:0,Built:0,Financial:0};
    STREAM_DEFS.forEach(s=>{
      if(!activePhases[s.phase]||!activeStreams[s.id])return;
      const y1=sRev(s,mult,1),y3=sRev(s,mult,3);
      if(s.oneTime){if(s.id==="parcel")oneTimeRev+=parcelSale;}
      if(s.capexLo)devCapex+=(s.capexLo+s.capexHi)/2;
      Object.keys(deltas).forEach(k=>{deltas[k]+=(s.capDelta[k]||0);});
      rows.push({...s,y1,y3});
    });

    // Phase gross revenues
    const p1G=rows.filter(s=>s.phase==="p1"&&!s.oneTime).reduce((a,s)=>a+s.y3,0);
    const p2G=gGross3+rows.filter(s=>s.phase==="p2"&&!s.oneTime).reduce((a,s)=>a+s.y3,0);
    const p3G=rows.filter(s=>s.phase==="p3"&&!s.oneTime).reduce((a,s)=>a+s.y3,0);
    const totG3=p1G+p2G+p3G;
    const totG1=rows.filter(s=>!s.oneTime).reduce((a,s)=>a+s.y1,0)+gGross1;

    // NOI
    const p1NOI=p1G*(1-S.p1OpCostPct);
    const p2NOI=p2G*(1-S.p2OpCostPct);
    const p3NOI=p3G*(1-S.p3OpCostPct)-(activePhases.p3?S.p3MonitoringAnnual:0);
    const noi3=p1NOI+p2NOI+p3NOI;
    const maintCapex=activePhases.p1?S.p1AnnualMaintCapex:0;

    // Metrics — no silly ROI multiple; use payback and dev yield
    const baseNOI=activePhases.p1?p1NOI:0;
    const incrNOI=noi3-baseNOI;
    const devYield=devCapex>0&&incrNOI>0?incrNOI/devCapex:null;
    const payback=devCapex>0&&incrNOI>0?devCapex/incrNOI:null;
    const opYield=purchasePrice>0?noi3/purchasePrice:0;

    // Capitals
    const base={Natural:S.baseNatural,Social:S.baseSocial,Cultural:S.baseCultural,Built:S.baseBuilt,Financial:S.baseFinancial};
    const scores={};CAPITALS.forEach(c=>{scores[c.key]=clamp(base[c.key]+deltas[c.key],0,10);});

    // Roger
    const gain=Math.max(0,purchasePrice-S.costBasis);
    const cgTax=gain*(S.ltcgRate+S.niitRate);
    const cashClose=purchasePrice-sellerNote;
    const netCash=cashClose-cgTax;
    const noteNPV=sellerNote*0.96;
    const noteInc=sellerNote*S.noteInterestRate;
    const rogerNet=netCash+noteNPV+oneTimeRev;
    const rogerGain=rogerNet-S.costBasis;

    // Easement
    const easVal=Math.max(0,hbu-purchasePrice);
    const taxBen=Math.min(easVal*buyerTax*1.4,purchasePrice*buyerTax*1.5);
    const effCost=purchasePrice-taxBen;

    // Chart — show Gross and NOI side by side
    const cs=[];
    ["p1","p2","p3"].forEach(pid=>{
      if(!activePhases[pid])return;
      const ph=PHASE_META[pid];
      if(pid==="p2"&&(gGross1>0||gGross3>0))cs.push({name:"🛖 Eco-Lodge",y1:gGross1,y3:gGross3,color:ph.color});
      rows.filter(s=>s.phase===pid&&!s.oneTime).forEach(s=>cs.push({name:`${s.icon} ${s.name.split("(")[0].trim().slice(0,16)}`,y1:s.y1,y3:s.y3,color:ph.color}));
    });
    const chartData=[
      {name:"Yr1 Gross",...Object.fromEntries(cs.map(s=>[s.name,s.y1]))},
      {name:"Yr3 Gross",...Object.fromEntries(cs.map(s=>[s.name,s.y3]))},
      {name:"Yr3 NOI",...Object.fromEntries(cs.map(s=>[s.name,s.y3*(totG3>0?noi3/totG3:0)]))},
    ];

    return{totG1,totG3,noi3,devCapex,maintCapex,devYield,payback,opYield,incrNOI,
      scores,deltas,rogerNet,rogerGain,netCash,cashClose,cgTax,noteInc,noteNPV,oneTimeRev,
      easVal,taxBen,effCost,chartData,cs,rows,gGross1,gGross3,gCapex,
      phNOI:{p1:p1NOI,p2:p2NOI,p3:p3NOI},
      radarData:CAPITALS.map(c=>({subject:c.key,score:scores[c.key],fullMark:10}))};
  },[activePhases,activeStreams,scenario,purchasePrice,hbu,buyerTax,sellerNote,unitTypes,occ,parcelSale,mult,S]);

  const anyP=Object.values(activePhases).some(Boolean);
  const togglePhase=pid=>setActivePhases(p=>({...p,[pid]:!p[pid]}));
  const toggleStream=(id,v)=>setActiveStreams(p=>({...p,[id]:v}));

  // SCENARIO OPS
  const saveScenario=useCallback(name=>{
    const nl=[...scenarios,{name,timestamp:Date.now(),
      state:{scenario,activePhases,activeStreams,purchasePrice,hbu,buyerTax,sellerNote,unitTypes,occ,parcelSale},
      meta:{phases:Object.entries(activePhases).filter(([,v])=>v).map(([k])=>PHASE_META[k].label).join("+"),yr3:calc.totG3,noi3:calc.noi3}}];
    setScenarios(nl);sSet(SK_SCENARIOS,nl);
  },[scenarios,scenario,activePhases,activeStreams,purchasePrice,hbu,buyerTax,sellerNote,unitTypes,occ,parcelSale,calc]);

  const loadScenario=useCallback(sc=>{
    const ss=sc.state;
    if(ss.scenario)      setScenario(ss.scenario);
    if(ss.activePhases)  setActivePhases(ss.activePhases);
    if(ss.activeStreams)  setActiveStreams(ss.activeStreams);
    if(ss.purchasePrice) setPP(ss.purchasePrice);
    if(ss.hbu)           setHbu(ss.hbu);
    if(ss.buyerTax)      setBuyerTax(ss.buyerTax);
    if(ss.sellerNote)    setNote(ss.sellerNote);
    if(ss.unitTypes)     setUnitTypes(ss.unitTypes);
    if(ss.occ)           setOcc(ss.occ);
    if(ss.parcelSale)    setParcelSale(ss.parcelSale);
    setView("model");
  },[]);

  const delScenario=useCallback(i=>{const nl=scenarios.filter((_,j)=>j!==i);setScenarios(nl);sSet(SK_SCENARIOS,nl);},[scenarios]);

  return(<div style={{background:C.bg,minHeight:"100vh",fontFamily:sans,color:C.cream}}>

    {/* TOP BAR */}
    <div style={{background:C.bgMid,borderBottom:`1px solid ${C.border}`,padding:"10px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,marginBottom:1}}>RDC × Regenesis — Confidential</div>
          <div style={{fontSize:15,fontWeight:800,fontFamily:serif,letterSpacing:"-0.01em",color:C.cream}}>{S.projectName} · Phased ROI & Five Capitals</div>
        </div>
        <div style={{display:"flex",gap:2,background:C.bgLight,borderRadius:6,padding:3}}>
          {[["model","📊 Model"],["settings","⚙️ Settings"],["scenarios",`💾 Scenarios${scenarios.length>0?" ("+scenarios.length+")":""}`]].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)} style={{padding:"5px 11px",borderRadius:4,border:"none",cursor:"pointer",
              background:view===k?C.bgCard:"transparent",color:view===k?C.cream:C.creamDim,fontSize:11,fontWeight:view===k?700:400,whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        {view==="model"&&Object.entries({low:"Conservative",mid:"Base Case",high:"Upside"}).map(([k,l])=>(
          <button key={k} onClick={()=>setScenario(k)} style={{padding:"4px 10px",borderRadius:5,
            border:`1px solid ${scenario===k?C.gold:C.border}`,background:scenario===k?`${C.gold}20`:"transparent",
            color:scenario===k?C.gold:C.creamDim,fontSize:11,fontWeight:scenario===k?700:400,cursor:"pointer"}}>{l}</button>
        ))}
        <button onClick={toggleTheme} title="Toggle light/dark mode" style={{
          padding:"4px 9px",borderRadius:5,border:`1px solid ${C.border}`,
          background:C.bgLight,color:C.cream,cursor:"pointer",fontSize:13,lineHeight:1,
          transition:"all 0.2s"}}>
          {isDark?"☀️":"🌙"}
        </button>
        <span style={{fontSize:9,color:saveFlash?C.sage:C.creamDim,fontFamily:mono,transition:"color 0.5s",marginLeft:4}}>
          {saveFlash?"● saved":"○ auto-save"}
        </span>
      </div>
    </div>

    {view==="settings"&&<div style={{overflowY:"auto",height:"calc(100vh - 48px)"}}><SettingsPage settings={S} setSettings={setSettings} onClose={()=>setView("model")}/></div>}
    {view==="scenarios"&&<div style={{overflowY:"auto",height:"calc(100vh - 48px)"}}><ScenariosPage scenarios={scenarios} onSave={saveScenario} onLoad={loadScenario} onDelete={delScenario} onClose={()=>setView("model")}/></div>}

    {view==="model"&&<div style={{display:"grid",gridTemplateColumns:"282px 1fr 302px",minHeight:"calc(100vh - 48px)"}}>

      {/* COL 1 — INPUTS */}
      <div style={{borderRight:`1px solid ${C.border}`,padding:"14px 12px",overflowY:"auto"}}>
        {["p1","p2","p3"].map(pid=>{
          const ph=PHASE_META[pid];const on=activePhases[pid];
          return(<div key={pid} style={{marginBottom:10}}>
            <PhaseHeader pid={pid} active={on} onToggle={togglePhase} yr3noi={on?calc.phNOI[pid]:0}/>
            {on&&<div style={{paddingLeft:5,marginTop:5}}>
              {pid==="p2"&&<>
                <div style={{fontSize:9,color:C.teal,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:700}}>
                  Unit Type Builder
                  <span style={{fontSize:8,color:C.creamDim,fontWeight:400,textTransform:"none",marginLeft:6}}>+ {fD(S.p2InfraFloor+S.p2PermittingCost)} infra/permits always</span>
                </div>
                <GlampingBuilder unitTypes={unitTypes} setUnitTypes={setUnitTypes} globalOcc={occ} setGlobalOcc={setOcc} S={S}/>
                <div style={{height:1,background:C.border,margin:"8px 0 6px"}}/>
                <div style={{fontSize:9,color:C.teal,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5,fontWeight:700}}>Hospitality Add-ons</div>
              </>}
              {pid==="p3"&&<div style={{fontSize:9,color:C.sage,marginBottom:7,background:`${C.sage}10`,borderRadius:5,padding:"5px 8px",border:`1px solid ${C.sage}30`}}>
                Floor capex: {fD(S.p3BaselineStudiesCost+S.p3PermittingCost+S.p3RestorationCapex)} (studies + permits + restoration) · {fD(S.p3MonitoringAnnual)}/yr monitoring
              </div>}
              {STREAM_DEFS.filter(s=>s.phase===pid).map(s=>(
                <div key={s.id}>
                  <CheckRow id={s.id} label={s.name} icon={s.icon} checked={activeStreams[s.id]}
                    onChange={v=>toggleStream(s.id,v)} note={s.note} color={ph.color} oneTime={s.oneTime}/>
                  {s.id==="parcel"&&activeStreams.parcel&&activePhases.p3&&(
                    <div style={{paddingLeft:20,marginBottom:4}}>
                      <Slider label="Parcel Sale Proceeds" val={parcelSale} set={setParcelSale}
                        min={500e3} max={8e6} step={100e3} fmt={v=>fM(v,1)} color={C.amber}
                        sub="1–2 entitled parcels · retain conservation remainder"/>
                    </div>
                  )}
                </div>
              ))}
            </div>}
          </div>);
        })}
        <div style={{height:1,background:C.border,margin:"10px 0 12px"}}/>
        <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:11,fontWeight:600}}>Deal Parameters</div>
        {[
          {label:"Purchase Price",val:purchasePrice,set:setPP,min:55e6,max:75e6,step:500e3,fmt:v=>fM(v,1),sub:"Listed $65M · NCTC $62M"},
          {label:"Seller Finance Note",val:sellerNote,set:setNote,min:0,max:35e6,step:500e3,fmt:v=>fM(v,1),sub:"Roger carries note at close"},
          {label:"HBU Appraisal",val:hbu,set:setHbu,min:80e6,max:200e6,step:1e6,fmt:v=>fM(v,0),sub:"Highest & best use for easement"},
          {label:"Buyer Tax Rate",val:buyerTax,set:setBuyerTax,min:0.25,max:0.54,step:0.01,fmt:fP,sub:"Fed + CA marginal combined"},
        ].map(sl=><Slider key={sl.label} {...sl}/>)}
        <button onClick={()=>setView("settings")} style={{width:"100%",marginTop:8,padding:"7px",borderRadius:6,border:`1px solid ${C.border}`,background:"transparent",color:C.creamDim,cursor:"pointer",fontSize:11}}>⚙️ Edit project costs in Settings →</button>
        <button onClick={()=>setView("scenarios")} style={{width:"100%",marginTop:5,padding:"7px",borderRadius:6,border:`1px solid ${C.teal}30`,background:"transparent",color:C.teal,cursor:"pointer",fontSize:11}}>💾 Save this session as a scenario →</button>
      </div>

      {/* COL 2 — OUTPUTS */}
      <div style={{padding:"14px 16px",overflowY:"auto",borderRight:`1px solid ${C.border}`}}>

        {/* ROGER'S RETURN HERO */}
        <div style={{background:`linear-gradient(135deg,${C.gold}18,${C.gold}08)`,border:`2px solid ${C.gold}70`,borderRadius:12,padding:"14px 18px",marginBottom:12}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:"0.18em",textTransform:"uppercase",marginBottom:9,fontWeight:700}}>📊 Roger's Net Return</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:10}}>
            {[
              {l:"Cash at Close",    v:fM(calc.cashClose,1), s:"gross · before tax",         c:C.cream},
              {l:"Cap Gains Tax",    v:`(${fM(calc.cgTax,1)})`,s:`${fP(S.ltcgRate+S.niitRate)} on ${fM(purchasePrice-S.costBasis,1)} gain`,c:C.coral},
              {l:"Net Cash After Tax",v:fM(calc.netCash,1),  s:"",                            c:C.cream},
            ].map(({l,v,s,c})=><div key={l}><div style={{fontSize:9,color:C.creamDim,marginBottom:2}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c,fontFamily:mono,lineHeight:1}}>{v}</div>{s&&<div style={{fontSize:9,color:C.creamDim}}>{s}</div>}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.4fr",gap:10,paddingTop:9,borderTop:`1px solid ${C.gold}35`}}>
            <div>
              <div style={{fontSize:9,color:C.creamDim,marginBottom:2}}>+ Seller Note NPV</div>
              <div style={{fontSize:14,fontWeight:700,color:C.gold,fontFamily:mono}}>+{fM(calc.noteNPV,1)}</div>
              <div style={{fontSize:9,color:C.creamDim}}>{fP(S.noteInterestRate)} · {S.noteTerm}yr</div>
            </div>
            <div>
              <div style={{fontSize:9,color:C.amber,marginBottom:2}}>+ One-Time Rev</div>
              <div style={{fontSize:14,fontWeight:700,color:C.amber,fontFamily:mono}}>{calc.oneTimeRev>0?`+${fM(calc.oneTimeRev,1)}`:"—"}</div>
            </div>
            <div>
              <div style={{fontSize:9,color:C.gold,fontWeight:700,marginBottom:2}}>TOTAL NET RETURN</div>
              <div style={{fontSize:26,fontWeight:900,color:C.gold,fontFamily:mono,lineHeight:1}}>{fM(calc.rogerNet,1)}</div>
              <div style={{fontSize:10,color:calc.rogerGain>=0?C.sage:C.coral,marginTop:3,fontWeight:600}}>
                {calc.rogerGain>=0?`▲ +${fM(calc.rogerGain,1)} over ${fM(S.costBasis,0)} basis`:`▼ ${fM(calc.rogerGain,1)} vs ${fM(S.costBasis,0)} basis`}
              </div>
            </div>
          </div>
        </div>

        {/* OPERATING KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginBottom:8}}>
          <Kpi label="Yr 3 Gross Rev" value={anyP?fM(calc.totG3,2):"—"} accent={C.gold} sub="All active streams"/>
          <Kpi label="Yr 3 NOI" value={anyP?fM(calc.noi3,2):"—"} accent={C.teal}
            sub={anyP&&calc.totG3>0?`${fP(calc.noi3/calc.totG3)} margin`:""}/>
          <Kpi label="Dev Capex" value={calc.devCapex>0?fM(calc.devCapex,1):"—"} accent={C.coral}
            sub={calc.devCapex>0?`Incl. ${fD(S.p2InfraFloor+S.p2PermittingCost)} P2 floor`:"No dev capex"}/>
          <Kpi label="Dev Payback" value={calc.payback?fYr(calc.payback):"N/A"} accent={C.sage}
            sub={calc.devYield?`${fP(calc.devYield)} dev yield on capex`:"No incremental NOI yet"}
            warn={calc.payback&&calc.payback<0.5}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:8}}>
          <Kpi label="Op Yield on Purchase" value={anyP?fP(calc.opYield):"—"} accent={C.lavender}
            sub={`Yr3 NOI ÷ ${fM(purchasePrice,1)}`}/>
          <Kpi label="Note Income / yr" value={fD(calc.noteInc)} accent={C.gold}
            sub={`${fP(S.noteInterestRate)} on ${fM(sellerNote,1)} · ${fD(calc.noteInc/12)}/mo`}/>
          <Kpi label="Carry Cost" value={`${fD(S.monthlyCarryCost)}/mo`} accent={C.coral}
            sub={`${fM(S.monthlyCarryCost*12,2)}/yr · clock running`}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
          <Kpi label="Easement Value" value={fM(calc.easVal,1)} accent={C.lavender}
            sub={`HBU ${fM(hbu,0)} − ${fM(purchasePrice,1)}`}/>
          <Kpi label="Buyer Tax Benefit" value={fM(calc.taxBen,1)} accent={C.sage}
            sub={`${fP(buyerTax)} rate · IRC §170h · 16 yrs`}/>
          <Kpi label="Buyer Effective Cost" value={fM(calc.effCost,1)} accent={C.gold}
            sub={`${fD(calc.effCost/S.acres)}/acre effective`}/>
        </div>

        {/* CHART */}
        {anyP&&calc.cs.length>0&&<div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9,padding:"12px 10px 6px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,padding:"0 4px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.cream}}>Yr1 Gross / Yr3 Gross / Yr3 NOI</div>
            <div style={{display:"flex",gap:7}}>
              {["p1","p2","p3"].filter(p=>activePhases[p]).map(p=>(
                <div key={p} style={{display:"flex",alignItems:"center",gap:3}}>
                  <div style={{width:6,height:6,borderRadius:2,background:PHASE_META[p].color}}/>
                  <span style={{fontSize:9,color:C.creamDim}}>{PHASE_META[p].label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={calc.chartData} margin={{top:0,right:6,left:4,bottom:0}}>
              <XAxis dataKey="name" tick={{fill:C.creamDim,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tickFormatter={v=>`$${(v/1e6).toFixed(1)}M`} tick={{fill:C.creamDim,fontSize:9}} axisLine={false} tickLine={false} width={44}/>
              <Tooltip content={<TTip/>}/>
              {calc.cs.map((s,i)=><Bar key={s.name} dataKey={s.name} stackId="a" fill={s.color}
                fillOpacity={0.9-Math.floor(i/3)*0.08}
                radius={i===calc.cs.length-1?[3,3,0,0]:[0,0,0,0]}/>)}
            </BarChart>
          </ResponsiveContainer>
        </div>}

        {/* STREAM TABLE */}
        {anyP&&<div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:9,padding:"11px 11px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 60px 72px 66px",gap:4,padding:"0 7px 6px"}}>
            {["Stream","Yr 1","Yr 3 Gross","NOI"].map(h=><div key={h} style={{fontSize:8,color:C.creamDim,textTransform:"uppercase",letterSpacing:"0.1em",textAlign:h==="Stream"?"left":"right"}}>{h}</div>)}
          </div>
          {["p1","p2","p3"].map(pid=>{
            if(!activePhases[pid])return null;
            const ph=PHASE_META[pid];
            const prows=calc.rows.filter(s=>s.phase===pid);
            const opPct=pid==="p1"?S.p1OpCostPct:pid==="p2"?S.p2OpCostPct:S.p3OpCostPct;
            const hasG=pid==="p2"&&(calc.gGross1>0||calc.gGross3>0);
            if(prows.length===0&&!hasG)return null;
            return(<div key={pid} style={{marginBottom:8}}>
              <div style={{fontSize:8,color:ph.color,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",padding:"4px 7px 2px"}}>
                {ph.label} — {ph.sublabel} <span style={{fontWeight:400,color:C.creamDim}}>({fP(opPct)} op cost)</span>
              </div>
              {hasG&&<div style={{display:"grid",gridTemplateColumns:"1fr 60px 72px 66px",gap:4,padding:"4px 7px",borderRadius:4,background:C.bgMid,marginBottom:2,borderLeft:`3px solid ${ph.color}`}}>
                <div style={{fontSize:10,color:C.cream}}>🛖 Eco-Lodge</div>
                <div style={{fontSize:10,fontFamily:mono,color:C.creamDim,textAlign:"right"}}>{calc.gGross1>0?fD(calc.gGross1):"—"}</div>
                <div style={{fontSize:10,fontFamily:mono,color:ph.color,textAlign:"right",fontWeight:700}}>{calc.gGross3>0?fD(calc.gGross3):"—"}</div>
                <div style={{fontSize:10,fontFamily:mono,color:C.teal,textAlign:"right"}}>{calc.gGross3>0?fD(calc.gGross3*(1-S.p2OpCostPct)):"—"}</div>
              </div>}
              {prows.filter(s=>!s.oneTime).map(s=><div key={s.id} style={{display:"grid",gridTemplateColumns:"1fr 60px 72px 66px",gap:4,padding:"4px 7px",borderRadius:4,background:C.bgMid,marginBottom:2,borderLeft:`3px solid ${ph.color}`}}>
                <div style={{fontSize:10,color:C.cream,display:"flex",gap:3,alignItems:"center",overflow:"hidden"}}>
                  <span>{s.icon}</span><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name.split("(")[0].trim()}</span>
                </div>
                <div style={{fontSize:10,fontFamily:mono,color:s.y1>0?C.cream:C.creamDim,textAlign:"right"}}>{s.y1>0?fD(s.y1):"—"}</div>
                <div style={{fontSize:10,fontFamily:mono,color:s.y3>0?ph.color:C.creamDim,textAlign:"right",fontWeight:s.y3>0?700:400}}>{s.y3>0?fD(s.y3):"—"}</div>
                <div style={{fontSize:10,fontFamily:mono,color:s.y3>0?C.teal:C.creamDim,textAlign:"right"}}>{s.y3>0?fD(s.y3*(1-opPct)):"—"}</div>
              </div>)}
            </div>);
          })}
          <div style={{display:"grid",gridTemplateColumns:"1fr 60px 72px 66px",gap:4,padding:"8px 7px 2px",borderTop:`1px solid ${C.border}`,marginTop:3}}>
            <div style={{fontSize:11,fontWeight:700,color:C.cream}}>Total{calc.oneTimeRev>0&&<span style={{fontSize:8,color:C.amber,fontWeight:400,marginLeft:5}}>(+{fM(calc.oneTimeRev,1)} 1×)</span>}</div>
            <div style={{fontSize:11,fontWeight:800,fontFamily:mono,color:C.cream,textAlign:"right"}}>{fD(calc.totG1)}</div>
            <div style={{fontSize:11,fontWeight:800,fontFamily:mono,color:C.gold,textAlign:"right"}}>{fD(calc.totG3)}</div>
            <div style={{fontSize:11,fontWeight:800,fontFamily:mono,color:C.teal,textAlign:"right"}}>{fD(calc.noi3)}</div>
          </div>
        </div>}

        {!anyP&&<div style={{textAlign:"center",padding:"50px 20px",color:C.creamDim}}>
          <div style={{fontSize:26,marginBottom:8}}>☐</div>
          <div style={{fontSize:13}}>Select phases in the left panel to activate the model</div>
        </div>}
      </div>

      {/* COL 3 — FIVE CAPITALS */}
      <div style={{padding:"14px 13px",overflowY:"auto"}}>
        <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:9,fontWeight:600}}>Five Capitals Outputs</div>
        <div style={{display:"flex",gap:3,marginBottom:14,background:C.bgLight,borderRadius:6,padding:3}}>
          {[["capitals","Scores"],["radar","Radar"],["structure","Structure"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTabR(k)} style={{flex:1,padding:"5px 3px",borderRadius:4,border:"none",cursor:"pointer",
              background:tabR===k?C.bgCard:"transparent",color:tabR===k?C.cream:C.creamDim,fontSize:11,fontWeight:tabR===k?700:400}}>{l}</button>
          ))}
        </div>

        {tabR==="capitals"&&<div>
          {CAPITALS.map(cap=><CapBar key={cap.key} cap={cap} score={anyP?calc.scores[cap.key]:S[`base${cap.key}`]} delta={anyP?calc.deltas[cap.key]:0}/>)}
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px",marginTop:10}}>
            <div style={{fontSize:8,color:C.creamDim,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:9}}>Impact by Phase (active streams)</div>
            {["p1","p2","p3"].map(pid=>{
              const ph=PHASE_META[pid];
              const pd={Natural:0,Social:0,Cultural:0,Built:0,Financial:0};
              STREAM_DEFS.filter(s=>s.phase===pid&&activeStreams[s.id]&&activePhases[pid]).forEach(s=>Object.keys(pd).forEach(k=>{pd[k]+=(s.capDelta[k]||0);}));
              return(<div key={pid} style={{marginBottom:7,opacity:activePhases[pid]?1:0.35}}>
                <div style={{fontSize:9,color:ph.color,fontWeight:700,marginBottom:3}}>{ph.label}</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {CAPITALS.map(c=>{const d=pd[c.key];if(d===0)return null;return(
                    <span key={c.key} style={{fontSize:9,fontFamily:mono,padding:"1px 5px",borderRadius:3,
                      background:`${d>0?C.sage:C.coral}20`,color:d>0?C.sage:C.coral,border:`1px solid ${d>0?C.sage:C.coral}40`}}>
                      {c.icon}{d>0?"+":""}{d}</span>);
                  })}
                  {Object.values(pd).every(v=>v===0)&&<span style={{fontSize:9,color:C.creamDim}}>Baseline</span>}
                </div>
              </div>);
            })}
          </div>
          {anyP&&<div style={{background:`${C.gold}10`,border:`1px solid ${C.gold}40`,borderRadius:7,padding:"11px",marginTop:11,textAlign:"center"}}>
            <div style={{fontSize:8,color:C.gold,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>Aggregate Five Capitals Score</div>
            <div style={{fontSize:24,fontWeight:900,color:C.gold,fontFamily:mono}}>{(Object.values(calc.scores).reduce((a,b)=>a+b,0)/5).toFixed(1)}<span style={{fontSize:12,fontWeight:400}}>/10</span></div>
          </div>}
        </div>}

        {tabR==="radar"&&<div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={calc.radarData} margin={{top:8,right:18,left:18,bottom:8}}>
              <PolarGrid stroke={C.bgLight}/>
              <PolarAngleAxis dataKey="subject" tick={{fill:C.creamDim,fontSize:10}}/>
              <PolarRadiusAxis angle={90} domain={[0,10]} tick={{fill:C.creamDim,fontSize:8}} tickCount={5}/>
              <Radar name="Score" dataKey="score" stroke={C.gold} fill={C.gold} fillOpacity={0.18} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
          {CAPITALS.map(cap=><div key={cap.key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span>{cap.icon}</span>
              <div><div style={{fontSize:11,fontWeight:600,color:cap.color}}>{cap.key}</div><div style={{fontSize:9,color:C.creamDim}}>{cap.desc}</div></div>
            </div>
            <div style={{fontSize:14,fontWeight:800,fontFamily:mono,color:cap.color}}>{anyP?calc.scores[cap.key].toFixed(0):S[`base${cap.key}`]}</div>
          </div>)}
        </div>}

        {tabR==="structure"&&<div>
          <div style={{fontSize:11,fontWeight:700,color:C.cream,marginBottom:9}}>Triple Play Legal Structure</div>
          {[
            {title:"Dos Pueblos PBC",role:"For-profit operating engine",color:C.gold,icon:"⚙️",desc:"Holds operating leases from Trust. Runs farm, eco-lodge, film, education, ag. Raises investor capital. PRT-bound."},
            {title:"Stewardship Trust 501(c)3",role:"Land sovereign",color:C.teal,icon:"🏛",desc:"Holds fee title. Issues covenant lease to PBC. Grants conservation easement. Governs via Five Capitals + readiness gates."},
            {title:"Chumash Cultural Commons",role:"Multi-tribal co-management",color:C.lavender,icon:"🏺",desc:"Irrevocable access runs with land. Village sites, ceremonial zones, marine interface. Tribal veto on cultural decisions."},
          ].map((item,i)=><div key={i} style={{background:C.bgCard,borderRadius:7,padding:"11px 12px",marginBottom:7,border:`1px solid ${item.color}30`,borderLeft:`3px solid ${item.color}`}}>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:14}}>{item.icon}</span>
              <div><div style={{fontSize:11,fontWeight:800,color:item.color}}>{item.title}</div><div style={{fontSize:9,color:C.creamDim}}>{item.role}</div></div>
            </div>
            <div style={{fontSize:10,color:C.creamDim,lineHeight:1.55}}>{item.desc}</div>
          </div>)}
          <div style={{background:C.bgCard,borderRadius:7,padding:"11px 12px",border:`1px solid ${C.border}`,marginTop:10}}>
            <div style={{fontSize:10,fontWeight:700,color:C.cream,marginBottom:7}}>PRT Covenants — Run with the Land</div>
            {["Five Capitals annual reporting","Readiness gates for all expansion","Chumash priority access — irrevocable","Marine Sanctuary alignment required","Cultural capital triggers covenant review"].map((cov,i)=>(
              <div key={i} style={{display:"flex",gap:6,marginBottom:5,alignItems:"flex-start"}}>
                <div style={{width:3,height:3,borderRadius:"50%",background:C.gold,marginTop:5,flexShrink:0}}/>
                <div style={{fontSize:10,color:C.creamDim}}>{cov}</div>
              </div>
            ))}
          </div>
        </div>}
      </div>

    </div>}

    <div style={{borderTop:`1px solid ${C.border}`,padding:"6px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",background:C.bgMid}}>
      <div style={{fontSize:9,color:C.creamDim}}>DRAFT — CONFIDENTIAL — © 2026 Regenerative Development Corp · Not investment advice · Settings + scenarios stored locally</div>
      <div style={{fontSize:9,color:C.gold,fontStyle:"italic"}}>Life before Profits.</div>
    </div>
  </div>);
}
