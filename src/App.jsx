import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const DARK = {
  bg:"#0A1520",bgMid:"#0F1E2E",bgCard:"#13243A",bgLight:"#1A3050",
  border:"#1E3A54",gold:"#C9A84C",goldDim:"#8B6834",goldPale:"#F0DFA0",
  teal:"#29AFA0",tealDim:"#1A7068",sage:"#7BAE7F",sageDim:"#4A7050",
  coral:"#D96845",sky:"#4A9CC8",lavender:"#8A7EC8",amber:"#E8A030",
  cream:"#EAE4D6",creamDim:"#9A9080",
  mist:"#C8D8CC",lemon:"#E8E0A0",
  p1:"#C9A84C",p2:"#29AFA0",p3:"#7BAE7F",
  forest:"#2D6A4F",navy:"#1A3A6A",
};
const LIGHT = {
  bg:"#F4F1EB",bgMid:"#EAE5D8",bgCard:"#FFFFFF",bgLight:"#E0D9CC",
  border:"#C8BFA8",gold:"#8B6228",goldDim:"#C9A84C",goldPale:"#5C3D0E",
  teal:"#1A7068",tealDim:"#29AFA0",sage:"#3D6B40",sageDim:"#7BAE7F",
  coral:"#B84E2A",sky:"#2A6B96",lavender:"#5A4FA0",amber:"#B06010",
  cream:"#1A1208",creamDim:"#5C4A30",
  mist:"#2A3828",lemon:"#4A3800",
  p1:"#8B6228",p2:"#1A7068",p3:"#3D6B40",
  forest:"#1A4A30",navy:"#0F2A54",
};
// C is resolved dynamically in App based on theme state
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

const SK_SETTINGS   ="prt:settings:v1";
const SK_SESSION    ="prt:session:dos-pueblos:v1";
const SK_SCENARIOS  ="prt:scenarios:dos-pueblos:v1";
const SK_LAST_MODEL ="prt:last-model:v1";
const SK_USER_PRESETS="prt:user-presets:v1";

// Storage layer — localStorage for deployed app (window.storage is Claude-artifact-only)
async function sGet(key,fb){
  try{
    const v=localStorage.getItem(key);
    return v?JSON.parse(v):fb;
  }catch{return fb;}
}
async function sSet(key,val){
  try{localStorage.setItem(key,JSON.stringify(val));}catch{}
}

const sRev=(s,m,yr)=>{const lo=yr===1?s.yr1Lo:s.yr3Lo,hi=yr===1?s.yr1Hi:s.yr3Hi;return lo+(hi-lo)*m;};

// ─── CANONICAL MODELS ─────────────────────────────────────────────────────────
// These are the shared named model presets. Anyone can load them.
// To add a new canonical model: add an entry here and redeploy.
// Personal saved scenarios live in localStorage per-browser.
const CANONICAL_MODELS=[
  {
    id:"base",
    name:"Base Case",
    description:"Mid-point assumptions. All P1 streams active. No development capex.",
    badge:"●",badgeColor:"#C9A84C",
    state:{
      scenario:"mid",
      activePhases:{p1:true,p2:false,p3:false},
      activeStreams:Object.fromEntries(STREAM_DEFS.map(s=>[s.id,s.on])),
      purchasePrice:62e6,hbu:133e6,buyerTax:0.37,sellerNote:22e6,
      occ:0.65,parcelSale:2e6,
      unitTypes:{reno:{enabled:false,count:3,rate:250,costPerUnit:100e3},namu_std:{enabled:false,count:8,rate:320},namu_prem:{enabled:false,count:4,rate:520}},
    },
  },
  {
    id:"conservative",
    name:"Conservative",
    description:"Low-end revenue assumptions. P1 only. Stress-test scenario for lenders.",
    badge:"▼",badgeColor:"#D96845",
    state:{
      scenario:"low",
      activePhases:{p1:true,p2:false,p3:false},
      activeStreams:Object.fromEntries(STREAM_DEFS.map(s=>[s.id,s.on])),
      purchasePrice:65e6,hbu:120e6,buyerTax:0.37,sellerNote:22e6,
      occ:0.55,parcelSale:2e6,
      unitTypes:{reno:{enabled:false,count:3,rate:250,costPerUnit:100e3},namu_std:{enabled:false,count:8,rate:320},namu_prem:{enabled:false,count:4,rate:520}},
    },
  },
  {
    id:"full-build",
    name:"Full Build — P1+P2+P3",
    description:"All three phases active. Eco-lodge + conservation finance stacked.",
    badge:"▲",badgeColor:"#29AFA0",
    state:{
      scenario:"mid",
      activePhases:{p1:true,p2:true,p3:true},
      activeStreams:Object.fromEntries(STREAM_DEFS.map(s=>[s.id,true])),
      purchasePrice:62e6,hbu:133e6,buyerTax:0.37,sellerNote:22e6,
      occ:0.70,parcelSale:3e6,
      unitTypes:{reno:{enabled:true,count:4,rate:275,costPerUnit:100e3},namu_std:{enabled:true,count:10,rate:320},namu_prem:{enabled:true,count:4,rate:550}},
    },
  },
  {
    id:"roger-ask",
    name:"Roger Ask — $65M",
    description:"Seller's listed price. Conservative on easement. P1 only.",
    badge:"R",badgeColor:"#8A7EC8",
    state:{
      scenario:"mid",
      activePhases:{p1:true,p2:false,p3:false},
      activeStreams:Object.fromEntries(STREAM_DEFS.map(s=>[s.id,s.on])),
      purchasePrice:65e6,hbu:115e6,buyerTax:0.37,sellerNote:22e6,
      occ:0.65,parcelSale:2e6,
      unitTypes:{reno:{enabled:false,count:3,rate:250,costPerUnit:100e3},namu_std:{enabled:false,count:8,rate:320},namu_prem:{enabled:false,count:4,rate:520}},
    },
  },
  {
    id:"nctc-offer",
    name:"NCTC Offer — $62M",
    description:"NCTC negotiated price. HBU at $133M. Full easement deduction stack.",
    badge:"N",badgeColor:"#7BAE7F",
    state:{
      scenario:"high",
      activePhases:{p1:true,p2:false,p3:true},
      activeStreams:Object.fromEntries(STREAM_DEFS.map(s=>[s.id,s.on||s.phase==="p3"])),
      purchasePrice:62e6,hbu:133e6,buyerTax:0.37,sellerNote:22e6,
      occ:0.65,parcelSale:3e6,
      unitTypes:{reno:{enabled:false,count:3,rate:250,costPerUnit:100e3},namu_std:{enabled:false,count:8,rate:320},namu_prem:{enabled:false,count:4,rate:520}},
    },
  },
];

function Slider({label,val,set,min,max,step,fmt,sub,color=C.gold,disabled}){
  const pct=((val-min)/(max-min))*100;
  return(<div style={{marginBottom:13,opacity:disabled?0.4:1}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
      <span style={{fontSize:11,color:C.mist}}>{label}</span>
      <span style={{fontSize:12,fontWeight:700,color,fontFamily:mono}}>{fmt(val)}</span>
    </div>
    {sub&&<div style={{fontSize:10,color:C.mist,opacity:.9,marginBottom:3}}>{sub}</div>}
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
    <div style={{fontSize:10,color:C.mist,marginBottom:3}}>{label}</div>
    {note&&<div style={{fontSize:9,color:C.creamDim,opacity:.7,marginBottom:3}}>{note}</div>}
    <div style={{display:"flex",alignItems:"center",background:C.bgLight,borderRadius:5,border:`1px solid ${C.border}`,overflow:"hidden"}}>
      {prefix&&<span style={{fontSize:11,color:C.mist,padding:"0 8px"}}>{prefix}</span>}
      <input type="number" value={val} onChange={e=>set(Number(e.target.value)||0)}
        style={{flex:1,background:"transparent",border:"none",outline:"none",color:C.cream,fontFamily:mono,fontSize:12,padding:"6px 4px 6px 0"}}/>
      {suffix&&<span style={{fontSize:11,color:C.mist,padding:"0 8px"}}>{suffix}</span>}
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
      <div style={{fontSize:9,color:C.mist}}>{p.desc}</div>
    </div>
    {active&&yr3noi>0&&<div style={{fontSize:10,fontWeight:700,color:p.color,fontFamily:mono,flexShrink:0,textAlign:"right"}}>{fD(yr3noi)}<span style={{fontSize:9,fontWeight:500,color:C.mist}}><br/>Yr3 NOI</span></div>}
  </button>);
}

function Kpi({label,value,sub,accent,size=15,warn}){
  return(<div style={{background:C.bgCard,border:`1px solid ${warn?`${C.coral}60`:accent?`${accent}40`:C.border}`,borderRadius:8,padding:"10px 12px"}}>
    <div style={{fontSize:9,color:C.mist,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:4}}>{label}</div>
    <div style={{fontSize:size,fontWeight:800,color:warn?C.coral:accent||C.cream,fontFamily:mono,lineHeight:1.1}}>{value}</div>
    {sub&&<div style={{fontSize:10,color:C.mist,marginTop:4,lineHeight:1.4}}>{sub}</div>}
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
    <div style={{fontSize:10,color:C.mist,marginTop:2}}>{cap.desc}</div>
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

function SettingsPage({settings:S,setSettings,onClose,onApply}){
  const set=(k,v)=>setSettings(p=>({...p,[k]:v}));
  const saveAndReturn=()=>{if(onApply)onApply(S);onClose();};
  return(<div style={{padding:"20px 24px",maxWidth:900,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div>
        <div style={{fontSize:9,color:C.gold,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:3}}>PRT Project Configuration</div>
        <div style={{fontSize:18,fontWeight:800,fontFamily:serif,color:C.cream}}>Settings — {S.projectName}</div>
        <div style={{fontSize:11,color:C.creamDim,marginTop:3}}>Saved locally · reusable across PRT project artifacts</div>
      </div>
      <button onClick={saveAndReturn} style={{padding:"8px 18px",borderRadius:7,border:`1px solid ${C.gold}`,background:`${C.gold}20`,color:C.gold,cursor:"pointer",fontWeight:700,fontSize:12}}>← Back to Model</button>
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
        <button onClick={saveAndReturn} style={{padding:"7px 18px",borderRadius:6,border:`1px solid ${C.gold}`,background:`${C.gold}20`,color:C.gold,cursor:"pointer",fontWeight:700,fontSize:12}}>Save & Return</button>
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

// ═══ COVER PAGE ══════════════════════════════════════════════════════════════
function CoverPage({onEnter,onLoadModel,lastModelId,userPresets,onDeletePreset}){
  const [selectedModel,setSelectedModel]=useState(lastModelId||"base");
  const allModels=[...CANONICAL_MODELS,...(userPresets||[])];

  const PLAYERS=[
    {
      id:"roger",
      color:C.gold,
      icon:"🏡",
      name:"Roger & Robin Himovitz",
      role:"Seller / Conservation Sponsor",
      position:"Exits with full consideration. Conservation legacy preserved.",
      gets:"~$49–50M total — $22M assumed debt relief + $20–25M investor cash at close + $2–3M carry-back note (IRC §453 installment sale). Roger's all-in basis ~$50–55M; structure delivers parity while permanently protecting the coast.",
      puts:"219 acres · 18 parcels · Gaviota Coast · $22M existing IO note · relationships with Chumash nations · Dos Pueblos Institute 501(c)(3)",
      waterfall:"Seller — paid at close. Not a waterfall participant post-close.",
      tags:["At Close","Conservation Sponsor","Installment Sale §453"],
    },
    {
      id:"trust",
      color:C.coral,
      icon:"🏦",
      name:"Income Trust",
      role:"Senior Lender — Existing $22M First Mortgage",
      position:"Tier 1 — paid first, always, every year.",
      gets:"$1,100,000/yr interest-only at 5% on $22M balance. Note assumed by new PBC at close. Trust receives same IO stream with no disruption — preferred outcome over payoff.",
      puts:"$22M already deployed. No new capital required.",
      waterfall:"Tier 1 — senior to all equity. Pre-condition of every other distribution. Non-negotiable.",
      tags:["Tier 1","5% IO","Note Assumption","Senior Debt"],
    },
    {
      id:"investor",
      color:C.sky,
      icon:"💎",
      name:"Anchor Investor",
      role:"Founding Equity — 60% PBC Units",
      position:"Tier 6–7 — senior to community. Blended 12% IRR; tax savings credited first.",
      gets:"$57–59M in IRC §170(h) conservation easement tax savings over 16 years (at ~50% combined CA+Fed rate) + 60% of PBC NAV growth ($27–33M investor share at Year 7) + full 1× return of capital + 12% IRR cash distributions from Year 8+. Net cost of ownership negative before a single dollar of operations.",
      puts:"$20–25M equity at close. Must have California AGI sufficient to absorb ~$5–7M in deductions/year. Must hold title individually or as grantor trust (not LLC/irrevocable trust) for §170(h) qualification.",
      waterfall:"Tier 6 — blended 12% IRR (tax savings credited first; zero cash draw from PBC Years 1–7). Tier 7 — full 1× return of capital before community preferred begins.",
      tags:["Tier 6–7","60% PBC","12% Blended IRR","§170(h)","Senior to Community"],
    },
    {
      id:"community",
      color:C.lavender,
      icon:"🤝",
      name:"Community Members (~200)",
      role:"Community Capital — 20% PBC Units",
      position:"Tier 8 — subordinated to investor. 1.67× preferred return on equity component.",
      gets:"$10,060 in immediate Year 1 tax savings per member ($20K charitable component × ~50% rate). 1.67× preferred return on $30K equity = $50K/unit returned before residual distributions. Service credits (glamping nights, farm tours, cultural programs). Ongoing 20% residual distributions post-preferred.",
      puts:"$50,000/unit — split $30K equity (PBC units) + $20K charitable contribution (Stewardship Trust, non-refundable, qualifies as IRC §170(b) deduction).",
      waterfall:"Tier 8 — subordinated to Tiers 1–7. Begins after investor full 1× + IRR satisfied (~Year 7–9). $10M total preferred pool across 200 members.",
      tags:["Tier 8","$50K/unit","1.67× Preferred","§170(b)","Subordinated"],
    },
    {
      id:"chumash",
      color:C.sage,
      icon:"🏺",
      name:"Chumash Nations",
      role:"Cultural Commons — Multi-Tribal Co-Management",
      position:"Co-sovereign. Not a financial investor. Governance rights run with the land in perpetuity.",
      gets:"Return of Mikiw and Kuyamu village sites (BIA Land Buy-Back / CA tribal grants, Year 1–2). Irrevocable co-management rights over cultural zones. Chumash Cultural Commons governance seats. Revenue share from Chumash Kitchen, cultural programs, NOAA sanctuary grants. TEK documentation program. Marine interface access.",
      puts:"Co-management expertise · Traditional Ecological Knowledge · Cultural authority and legitimacy that no buyer can purchase or replicate.",
      waterfall:"PRT Covenant recipient — 5% of gross PBC revenue flows to Stewardship Trust, which funds cultural programs. Governance rights are not subordinated to any financial tier.",
      tags:["Co-Sovereign","Cultural Commons","TEK","Irrevocable","PRT Covenant"],
    },
    {
      id:"rdc",
      color:C.amber,
      icon:"⚙️",
      name:"RDC + Regenesis Group",
      role:"Deal Architect · Manager · Consultant",
      position:"Tier 3 (management fee, operating priority) + Tier 9 (promote and equity, back-loaded).",
      gets:"$20K retainer at signing + $500K Transaction Completion Advisory Fee at close + $500K/yr management fee (Years 1–7, stepping down to $350K/yr and $250K/yr at stabilization gates) + 4% development fee on new capital projects ($250K minimum) + 20% carried interest (promote) above hurdle + 20% PBC founding equity on sale. Total estimated economics: $2–6M over 8-year hold, back-loaded.",
      puts:"All work product — financial models, Triple Play structure, conservation easement design, Five Capitals framework, community raise architecture, PRT governance, this application. 7-year management commitment post-close.",
      waterfall:"Tier 3 (management fee — operating priority, pre-equity). Tier 9 (promote + 20% equity residual — earned only after investor and community are whole).",
      tags:["Tier 3","Tier 9","20% Promote","20% Equity","Back-Loaded","Deal Architect"],
    },
    {
      id:"stewardship",
      color:C.teal,
      icon:"🌿",
      name:"Stewardship Trust  (501c3)",
      role:"Land Sovereign · Conservation Easement Holder",
      position:"PRT Covenant recipient. Holds fee title. Issues conservation easement to LTSBC. Non-financial party — mission holder.",
      gets:"$4–5M from community charitable contributions at close ($20K × 200 members). 5% of gross PBC revenue annually (PRT Covenant — non-waivable). Holds perpetual conservation easement and fee title. Governs via Five Capitals readiness gates.",
      puts:"Conservation easement to Land Trust for Santa Barbara County (LTSBC). Governance covenants. Mission accountability.",
      waterfall:"Tier 5 — 5% PRT Covenant on gross revenue. Paid before any equity distributions. Funded at close from community raise charitable component.",
      tags:["Tier 5","501(c)(3)","PRT Covenant","Conservation Easement","Land Sovereign"],
    },
  ];

  const STACK=[
    {tier:"1",label:"$22M Income Trust — Note IO",        amt:"$1.1M/yr",  color:C.coral,   note:"Senior debt · 5% IO · paid first always"},
    {tier:"2",label:"Senior Conservation Loan (if any)",  amt:"Scenario A",color:"#555",    note:"Scenario C carries no new senior debt"},
    {tier:"3",label:"RDC Management Fee",                 amt:"$500K/yr",  color:C.amber,   note:"Operating priority · pre-equity"},
    {tier:"4",label:"Roger Carry-Back Interest",          amt:"$88K/yr",   color:C.gold,    note:"3.5% IO · retired Year 1–2 from Chumash parcel sale"},
    {tier:"5",label:"Stewardship Trust — PRT Covenant",   amt:"5% gross",  color:C.teal,    note:"Non-waivable · funds conservation + cultural programs"},
    {tier:"6",label:"Investor — Blended 12% IRR",         amt:"~$0 Yr 1–7",color:C.sky,     note:"Tax savings credited first · zero cash draw Years 1–7"},
    {tier:"7",label:"Investor — Return of Capital",       amt:"$20–25M",   color:C.sky,     note:"Full 1× before community preferred begins"},
    {tier:"8",label:"Community — 1.67× Preferred",        amt:"$50K/unit", color:C.lavender,note:"200 members · subordinated to Tiers 6–7 · ~Year 7–9"},
    {tier:"9",label:"RDC Promote + Residual 60/20/20",    amt:"20% then ÷",color:C.amber,   note:"After community preferred · Inv 60% / Comm 20% / RDC 20%"},
  ];

  return(
    <div style={{overflowY:"auto",height:"calc(100vh - 48px)"}}>

      {/* HERO — Full-bleed aerial */}
      <div style={{position:"relative",width:"100%",height:360,overflow:"hidden",marginBottom:0}}>
        <img src="https://pub-ff9788cd4f1f494db0491a197025a94c.r2.dev/dos-pueblos/aerial_overview/aerial_overview_01.jpg"
          alt="Dos Pueblos Ranch aerial — Gaviota Coast"
          style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 40%"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(10,21,32,0.15) 0%,rgba(10,21,32,0.6) 60%,rgba(10,21,32,0.95) 100%)"}}/>
        <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"32px 40px 28px",textAlign:"center"}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:"0.3em",textTransform:"uppercase",marginBottom:8}}>
            Regenerative Development Corp  ·  Regenesis Group  ·  Confidential  ·  March 2026
          </div>
          <div style={{fontSize:36,fontWeight:800,fontFamily:serif,color:"#fff",letterSpacing:"-0.02em",marginBottom:6,textShadow:"0 2px 16px rgba(0,0,0,0.5)"}}>
            Dos Pueblos Ranch
          </div>
          <div style={{fontSize:14,color:C.teal,fontWeight:600,marginBottom:4}}>
            Triple Play Conservation-Regenerative Acquisition  ·  219 Acres  ·  Gaviota Coast, California
          </div>
          <div style={{fontSize:12,color:"#c8d8cc",maxWidth:640,margin:"0 auto",lineHeight:1.7}}>
            A Place Regenerative Trust structure integrating a Public Benefit Corporation, a Stewardship Trust, and a Chumash Cultural Commons — financed through a blended conservation easement and community capital raise.
          </div>
        </div>
      </div>

      <div style={{padding:"0 32px 28px",maxWidth:1200,margin:"0 auto"}}>

      {/* KEY METRICS */}
      <div style={{marginTop:20,marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
          {[["$50M","Acquisition Price"],["$133M","HBU Appraisal"],["$115–118M","Easement Deduction"],
            ["$57–59M","Tax Savings / 16yr"],["~200","Community Members"],["219 ac","Gaviota Coast"]
          ].map(([v,l])=>(
            <div key={l} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,
              padding:"10px 16px",textAlign:"center",minWidth:90}}>
              <div style={{fontSize:15,fontWeight:800,color:C.gold,fontFamily:mono}}>{v}</div>
              <div style={{fontSize:10,color:C.mist,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* NAV ROW — Project Website + Institute */}
      <div style={{display:"flex",gap:10,marginBottom:28}}>
        <a href="https://dospueblos.dev.place.fund" target="_blank" rel="noopener noreferrer"
          style={{flex:1,display:"flex",alignItems:"center",gap:12,background:`linear-gradient(135deg,${C.gold}12,${C.navy}15)`,
            border:`1px solid ${C.gold}35`,borderRadius:10,padding:"12px 18px",textDecoration:"none",
            cursor:"pointer",transition:"border-color 0.2s"}}>
          <span style={{fontSize:20}}>🏡</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.gold}}>Project Website →</div>
            <div style={{fontSize:10,color:C.mist,marginTop:1}}>Conservation vision & stewardship framework</div>
          </div>
        </a>
        <a href="https://www.dospueblosinstitute.org/" target="_blank" rel="noopener noreferrer"
          style={{flex:1,display:"flex",alignItems:"center",gap:12,background:`linear-gradient(135deg,${C.forest}20,${C.teal}10)`,
            border:`1px solid ${C.teal}35`,borderRadius:10,padding:"12px 18px",textDecoration:"none",
            cursor:"pointer",transition:"border-color 0.2s"}}>
          <div style={{width:36,height:36,borderRadius:7,overflow:"hidden",flexShrink:0,border:`1px solid ${C.teal}30`}}>
            <img src="https://pub-ff9788cd4f1f494db0491a197025a94c.r2.dev/dos-pueblos/conservation_landscape/conservation_landscape_01.jpg"
              alt="Conservation landscape" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:C.teal}}>Dos Pueblos Institute →</div>
            <div style={{fontSize:10,color:C.mist,marginTop:1}}>Marine science, Chumash culture & conservation</div>
          </div>
        </a>
      </div>

      {/* COASTAL IMAGE STRIP */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:28,borderRadius:10,overflow:"hidden"}}>
        {["coastal_bluffs_ocean/coastal_bluffs_ocean_01.jpg","abalone_farm/abalone_farm_01.jpg",
          "barns_stables/barns_stables_01.jpg","conservation_landscape/conservation_landscape_04.jpg"].map((p,i)=>(
          <div key={i} style={{height:100,overflow:"hidden"}}>
            <img src={`https://pub-ff9788cd4f1f494db0491a197025a94c.r2.dev/dos-pueblos/${p}`}
              alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          </div>
        ))}
      </div>

      {/* WATERFALL STRIP */}
      <div style={{marginBottom:28}}>
        <div style={{fontSize:10,color:C.mist,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>
          Distribution Waterfall — Nine Tiers — Sequence Governs All Distributions
        </div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {STACK.map(s=>(
            <div key={s.tier} style={{flex:"1 1 auto",minWidth:80,background:C.bgCard,
              borderRadius:7,border:`1px solid ${s.color}40`,borderTop:`3px solid ${s.color}`,
              padding:"8px 10px"}}>
              <div style={{display:"flex",alignItems:"baseline",gap:5,marginBottom:3}}>
                <span style={{fontSize:10,fontWeight:800,color:s.color,fontFamily:mono}}>{s.tier}</span>
                <span style={{fontSize:11,fontWeight:700,color:C.cream,lineHeight:1.2}}>{s.label}</span>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:s.color,fontFamily:mono,marginBottom:3}}>{s.amt}</div>
              <div style={{fontSize:10,color:C.mist,lineHeight:1.4}}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PLAYER CARDS */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,color:C.mist,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,fontWeight:700}}>
          The Players — Who They Are · What They Put In · What They Get Back · Where They Sit in the Waterfall
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
          {PLAYERS.map(p=>(
            <div key={p.id} style={{background:C.bgCard,borderRadius:10,
              border:`1px solid ${p.color}35`,borderLeft:`4px solid ${p.color}`,
              padding:"14px 16px"}}>
              {/* name row */}
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <span style={{fontSize:20,lineHeight:1}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:800,color:p.color,lineHeight:1.2}}>{p.name}</div>
                  <div style={{fontSize:10,color:C.mist,marginTop:2}}>{p.role}</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:5}}>
                    {p.tags.map(t=>(
                      <span key={t} style={{fontSize:8,padding:"2px 6px",borderRadius:3,
                        background:`${p.color}18`,color:p.color,border:`1px solid ${p.color}40`,
                        fontFamily:mono,fontWeight:600}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* position */}
              <div style={{background:`${p.color}10`,borderRadius:6,padding:"7px 10px",marginBottom:8,
                border:`1px solid ${p.color}25`}}>
                <div style={{fontSize:9,color:p.color,fontWeight:700,letterSpacing:"0.08em",
                  textTransform:"uppercase",marginBottom:3}}>Position</div>
                <div style={{fontSize:11,color:C.cream,lineHeight:1.6}}>{p.position}</div>
              </div>
              {/* puts in / gets back */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:7}}>
                <div>
                  <div style={{fontSize:9,color:C.lemon,textTransform:"uppercase",letterSpacing:"0.08em",
                    marginBottom:3,fontWeight:700}}>Puts In</div>
                  <div style={{fontSize:11,color:C.lemon,lineHeight:1.6}}>{p.puts}</div>
                </div>
                <div>
                  <div style={{fontSize:9,color:p.color,textTransform:"uppercase",letterSpacing:"0.08em",
                    marginBottom:3,fontWeight:700}}>Gets Back</div>
                  <div style={{fontSize:11,color:C.cream,lineHeight:1.6}}>{p.gets}</div>
                </div>
              </div>
              {/* waterfall */}
              <div style={{borderTop:`1px solid ${C.border}`,paddingTop:6}}>
                <div style={{fontSize:8,color:C.mist,textTransform:"uppercase",letterSpacing:"0.08em",
                  marginBottom:2,fontWeight:700}}>Waterfall</div>
                <div style={{fontSize:10,color:C.mist,lineHeight:1.5,fontStyle:"italic"}}>{p.waterfall}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* THREE ENTITIES */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:10,color:C.mist,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10,fontWeight:700}}>
          The Three Entities — One Purpose — PRT Covenants Bind All Three
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {color:C.gold,  icon:"⚙️", name:"Public Benefit Corp (PBC)",   sub:"Revenue Engine",
              items:["Holds all operating revenue streams","60% investor + 20% community + 20% RDC","Nine-tier waterfall governs all distributions","Glamping · farm · film · cultural programs","Five Capitals dashboard reporting"]},
            {color:C.teal,  icon:"🏛", name:"Stewardship Trust  501(c)(3)", sub:"Land Sovereign",
              items:["Holds fee title in perpetuity","Issues conservation easement to LTSBC","Receives 5% PRT Covenant on gross revenue","Funded $4–5M from community raise at close","Governs via Five Capitals readiness gates"]},
            {color:C.sage,  icon:"🏺", name:"Chumash Cultural Commons",     sub:"Multi-Tribal Co-Management",
              items:["Irrevocable — runs with the land forever","Village sites Mikiw + Kuyamu returned Yr 1–2","TEK documentation + cultural program governance","Chumash Kitchen · NOAA sanctuary grants","Marine interface · ceremonial zone protection"]},
          ].map((e,i)=>(
            <div key={i} style={{background:C.bgCard,borderRadius:9,border:`1px solid ${e.color}40`,overflow:"hidden"}}>
              <div style={{background:`${e.color}18`,borderBottom:`1px solid ${e.color}40`,
                padding:"11px 14px",display:"flex",gap:9,alignItems:"center"}}>
                <span style={{fontSize:18}}>{e.icon}</span>
                <div>
                  <div style={{fontSize:12,fontWeight:800,color:e.color}}>{e.name}</div>
                  <div style={{fontSize:10,color:C.mist}}>{e.sub}</div>
                </div>
              </div>
              <div style={{padding:"10px 14px"}}>
                {e.items.map((item,j)=>(
                  <div key={j} style={{display:"flex",gap:7,alignItems:"flex-start",marginBottom:5}}>
                    <span style={{color:e.color,fontSize:10,marginTop:1,flexShrink:0}}>›</span>
                    <span style={{fontSize:11,color:C.mist,lineHeight:1.5}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{background:`${C.forest}18`,border:`1px solid ${C.gold}30`,borderRadius:7,
          padding:"9px 14px",marginTop:8,textAlign:"center"}}>
          <span style={{fontSize:10,color:C.gold,fontWeight:700}}>PRT Covenant: </span>
          <span style={{fontSize:11,color:C.mist}}>5% of gross PBC revenue flows to Stewardship Trust perpetually · Five Capitals reporting is non-waivable · No entity may act against conservation mission · All expansion requires Five Capitals readiness gate</span>
        </div>
      </div>

      {/* MODEL PICKER */}
      <div style={{paddingTop:20,borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.mist,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:12,fontWeight:700}}>
          Load a Model — Select a canonical scenario or continue where you left off
        </div>
        {/* Canonical model cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:userPresets?.length>0?10:16}}>
          {CANONICAL_MODELS.map(m=>{
            const sel=selectedModel===m.id;
            return(
              <button key={m.id} onClick={()=>setSelectedModel(m.id)}
                style={{background:sel?`${m.badgeColor}15`:C.bgCard,border:`2px solid ${sel?m.badgeColor:C.border}`,
                  borderRadius:9,padding:"11px 12px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:6}}>
                  <div style={{width:22,height:22,borderRadius:5,background:`${m.badgeColor}25`,border:`1px solid ${m.badgeColor}60`,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:m.badgeColor,flexShrink:0}}>
                    {m.badge}
                  </div>
                  <div style={{fontSize:11,fontWeight:sel?800:600,color:sel?m.badgeColor:C.cream,lineHeight:1.2}}>{m.name}</div>
                </div>
                <div style={{fontSize:10,color:C.creamDim,lineHeight:1.5}}>{m.description}</div>
                {/* quick tags */}
                <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:6}}>
                  {Object.entries(m.state.activePhases).filter(([,v])=>v).map(([k])=>(
                    <span key={k} style={{fontSize:8,padding:"1px 5px",borderRadius:3,
                      background:`${m.badgeColor}20`,color:m.badgeColor,border:`1px solid ${m.badgeColor}40`,fontFamily:mono}}>
                      {k.toUpperCase()}
                    </span>
                  ))}
                  <span style={{fontSize:8,padding:"1px 5px",borderRadius:3,
                    background:`${C.gold}15`,color:C.gold,border:`1px solid ${C.gold}30`,fontFamily:mono}}>
                    {{low:"Conservative",mid:"Base Case",high:"Upside"}[m.state.scenario]}
                  </span>
                  <span style={{fontSize:8,padding:"1px 5px",borderRadius:3,
                    background:`${C.teal}15`,color:C.teal,border:`1px solid ${C.teal}30`,fontFamily:mono}}>
                    ${(m.state.purchasePrice/1e6).toFixed(0)}M
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        {/* User-saved presets */}
        {userPresets?.length>0&&<div style={{marginBottom:16}}>
          <div style={{fontSize:9,color:C.lavender,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:8}}>
            ★ My Saved Presets — from What-If
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
            {userPresets.map(m=>{
              const sel=selectedModel===m.id;
              return(
                <button key={m.id} onClick={()=>setSelectedModel(m.id)}
                  style={{background:sel?`${m.badgeColor}15`:C.bgCard,border:`2px solid ${sel?m.badgeColor:C.border}`,
                    borderRadius:9,padding:"10px 12px",cursor:"pointer",textAlign:"left",transition:"all 0.15s",position:"relative"}}>
                  <button
                    onClick={e=>{e.stopPropagation();onDeletePreset(m.id);if(selectedModel===m.id)setSelectedModel("base");}}
                    style={{position:"absolute",top:5,right:6,background:"transparent",border:"none",
                      color:C.coral,cursor:"pointer",fontSize:11,lineHeight:1,padding:2}}>✕</button>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                    <div style={{width:18,height:18,borderRadius:4,background:`${m.badgeColor}25`,border:`1px solid ${m.badgeColor}60`,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:m.badgeColor,flexShrink:0}}>★</div>
                    <div style={{fontSize:11,fontWeight:sel?800:600,color:sel?m.badgeColor:C.cream,lineHeight:1.2,paddingRight:14}}>{m.name}</div>
                  </div>
                  <div style={{fontSize:9,color:C.creamDim,lineHeight:1.4,marginBottom:4}}>{m.description}</div>
                  {m.savedAt&&<div style={{fontSize:8,color:C.mist,fontFamily:mono}}>Saved {m.savedAt}</div>}
                  <div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>
                    <span style={{fontSize:8,padding:"1px 5px",borderRadius:3,
                      background:`${C.lavender}20`,color:C.lavender,border:`1px solid ${C.lavender}40`,fontFamily:mono}}>What-If</span>
                    <span style={{fontSize:8,padding:"1px 5px",borderRadius:3,
                      background:`${C.gold}15`,color:C.gold,border:`1px solid ${C.gold}30`,fontFamily:mono}}>
                      ${(m.state.purchasePrice/1e6).toFixed(0)}M
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>}
        {/* Action row */}
        <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
          <button
            onClick={()=>{
              const m=allModels.find(x=>x.id===selectedModel)||CANONICAL_MODELS[0];
              onLoadModel(m);
            }}
            style={{padding:"12px 32px",borderRadius:9,border:`2px solid ${C.gold}`,
              background:`${C.gold}20`,color:C.gold,fontSize:13,fontWeight:700,cursor:"pointer",
              fontFamily:sans,letterSpacing:"0.05em"}}>
            Load "{allModels.find(m=>m.id===selectedModel)?.name||"Base Case"}" →
          </button>
          <button onClick={()=>onEnter("model")}
            style={{padding:"12px 20px",borderRadius:9,border:`1px solid ${C.border}`,
              background:"transparent",color:C.creamDim,fontSize:12,cursor:"pointer",fontFamily:sans}}>
            Continue last session →
          </button>
        </div>
        <div style={{textAlign:"center",fontSize:10,color:C.mist,marginTop:10}}>
          DRAFT · CONFIDENTIAL · © 2026 Regenerative Development Corp · Not investment advice
        </div>
      </div>

      </div>{/* close inner padded div */}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// CAPITAL STACK PAGE — Sources & Uses → Phase 1 → Phase 2 → Phase 3
// ═══════════════════════════════════════════════════════════════════════════════
function CapitalStackPage({purchasePrice,hbu,buyerTax,sellerNote,settings:S,calc,activePhases,activeStreams,unitTypes,occ}){
  const box={background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,padding:"20px 24px",marginBottom:16};
  const hdr=(t,sub,col)=>(<div style={{marginBottom:14}}>
    <div style={{fontSize:18,fontWeight:800,fontFamily:serif,color:col||C.cream,letterSpacing:"-0.01em"}}>{t}</div>
    {sub&&<div style={{fontSize:11,color:C.creamDim,marginTop:2}}>{sub}</div>}
  </div>);
  const row=(label,amt,color,sub,bold)=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"6px 0",borderBottom:`1px solid ${C.border}30`}}>
    <div><div style={{fontSize:12,color:color||C.cream,fontWeight:bold?700:400}}>{label}</div>{sub&&<div style={{fontSize:10,color:C.creamDim}}>{sub}</div>}</div>
    <div style={{fontSize:13,fontWeight:700,fontFamily:mono,color:color||C.cream,whiteSpace:"nowrap"}}>{amt}</div>
  </div>);
  const totRow=(label,amt,color)=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`2px solid ${color||C.gold}40`,marginTop:4}}>
    <div style={{fontSize:13,fontWeight:800,color:color||C.gold}}>{label}</div>
    <div style={{fontSize:15,fontWeight:800,fontFamily:mono,color:color||C.gold}}>{amt}</div>
  </div>);
  const phaseBar=(label,sublabel,color,pct)=>(<div style={{marginBottom:6}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:3}}>
      <span style={{fontSize:11,fontWeight:700,color}}>{label}</span>
      <span style={{fontSize:10,color:C.creamDim}}>{sublabel}</span>
    </div>
    <div style={{height:8,background:C.bgLight,borderRadius:4,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:`linear-gradient(90deg,${color}90,${color})`,borderRadius:4,transition:"width 0.4s"}}/>
    </div>
  </div>);

  // ── SOURCES (where the money comes from) ──
  const cashAtClose=purchasePrice-sellerNote;
  const easVal=Math.max(0,hbu-purchasePrice);
  const taxBen=Math.min(easVal*buyerTax*1.4,purchasePrice*buyerTax*1.5);
  const communityRaise=10e6; // 200 × $50K
  const communityEquity=6e6; // 200 × $30K
  const communityCharitable=4e6; // 200 × $20K
  const investorEquity=cashAtClose; // anchor covers the cash-at-close gap
  const totalSources=investorEquity+communityRaise+sellerNote;

  // ── USES (where the money goes) ──
  const totalUses=purchasePrice;

  // ── PHASE 2 CAPEX ──
  const{reno,namu_std,namu_prem}=unitTypes;
  let p2Capex=0;
  if(activePhases.p2){
    p2Capex+=S.p2InfraFloor+S.p2PermittingCost;
    if(reno.enabled) p2Capex+=(reno.costPerUnit||100e3)*reno.count;
    if(namu_std.enabled) p2Capex+=S.namuStdUnitCost*namu_std.count;
    if(namu_prem.enabled) p2Capex+=S.namuPremUnitCost*namu_prem.count;
  }

  // ── PHASE 3 CAPEX ──
  let p3Capex=0;
  if(activePhases.p3){
    p3Capex+=S.p3BaselineStudiesCost+S.p3PermittingCost+S.p3RestorationCapex;
    STREAM_DEFS.filter(s=>s.phase==="p3"&&activeStreams[s.id]&&s.capexLo).forEach(s=>{p3Capex+=(s.capexLo+s.capexHi)/2;});
  }

  // ── PHASE REVENUES ──
  const p1Streams=calc.rows.filter(s=>s.phase==="p1"&&!s.oneTime);
  const p2Streams=calc.rows.filter(s=>s.phase==="p2"&&!s.oneTime);
  const p3Streams=calc.rows.filter(s=>s.phase==="p3"&&!s.oneTime);
  const p1Rev=p1Streams.reduce((a,s)=>a+s.y3,0);
  const p2Rev=calc.gGross3+p2Streams.reduce((a,s)=>a+s.y3,0);
  const p3Rev=p3Streams.reduce((a,s)=>a+s.y3,0);
  const totalRev=p1Rev+p2Rev+p3Rev;
  const maxPhaseRev=Math.max(p1Rev,p2Rev,p3Rev,1);

  // ── DEBT SERVICE ──
  const debtService=sellerNote*S.noteInterestRate;
  const mgmtFee=500e3;
  const prtCovenant=totalRev*0.05;

  return(<div style={{overflowY:"auto",height:"calc(100vh - 48px)",padding:"24px 32px",maxWidth:960,margin:"0 auto"}}>

    {/* ── HEADER ── */}
    <div style={{textAlign:"center",marginBottom:24}}>
      <div style={{fontSize:9,letterSpacing:"0.3em",textTransform:"uppercase",color:C.gold}}>Dos Pueblos Ranch</div>
      <div style={{fontSize:28,fontWeight:800,fontFamily:serif,color:C.cream,marginTop:4}}>Capital Stack & Phased Deployment</div>
      <div style={{fontSize:12,color:C.creamDim,marginTop:4}}>Sources → Uses → Phase 1 → Phase 2 → Phase 3</div>
    </div>

    {/* ── ROW 1: SOURCES & USES ── */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 48px 1fr",gap:0,alignItems:"start",marginBottom:20}}>

      {/* SOURCES */}
      <div style={box}>
        {hdr("Sources of Capital","Where the money comes from",C.teal)}
        {row("Anchor Investor Equity",fM(investorEquity,1),C.sky,"60% PBC units · §170(h) conservation easement deduction")}
        {row("Community Members (~200)",fM(communityRaise,1),C.lavender,`$50K/unit: ${fM(communityEquity,1)} equity + ${fM(communityCharitable,1)} charitable`)}
        {row("Seller Finance Note (Assumed)",fM(sellerNote,1),C.coral,"Existing $22M IO note at 5% · assumed by PBC at close")}
        <div style={{height:8}}/>
        {totRow("Total Sources",fM(totalSources,1),C.teal)}
        <div style={{marginTop:10}}>
          <div style={{fontSize:10,color:C.mist,fontStyle:"italic"}}>Tax benefit to investor (not a source, but offsets effective cost):</div>
          {row("§170(h) Easement Tax Savings",`(${fM(taxBen,1)})`,C.sage,`Easement value ${fM(easVal,1)} × ${fP(buyerTax)} rate × 1.4 cap`)}
          {row("Effective Net Cost of Acquisition",fM(purchasePrice-taxBen,1),C.gold,"Purchase price minus tax benefit",true)}
        </div>
      </div>

      {/* ARROW */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",paddingTop:60}}>
        <div style={{fontSize:28,color:C.gold}}>→</div>
      </div>

      {/* USES */}
      <div style={box}>
        {hdr("Uses of Capital","Where the money goes",C.coral)}
        {row("Cash to Seller at Close",fM(cashAtClose,1),C.gold,"Roger & Robin Himovitz · net of note assumption")}
        {row("Assumed Seller Note",fM(sellerNote,1),C.coral,"Income Trust · 5% IO · assumed in place")}
        <div style={{height:8}}/>
        {totRow("Total Uses (Acquisition)",fM(totalUses,1),C.coral)}
        {activePhases.p2&&<><div style={{height:12}}/>{row("Phase 2 Development CapEx",fM(p2Capex,0),C.p2,"Infrastructure + eco-lodge units · funded from operations")}</>}
        {activePhases.p3&&<><div style={{height:4}}/>{row("Phase 3 Conservation CapEx",fM(p3Capex,0),C.p3,"Baseline studies + restoration · funded from grants/operations")}</>}
        {(activePhases.p2||activePhases.p3)&&<>{totRow("Total All-In Capital",fM(totalUses+p2Capex+p3Capex,1),C.coral)}</>}
      </div>
    </div>

    {/* ── FLOW ARROW ── */}
    <div style={{textAlign:"center",margin:"8px 0 20px",fontSize:11,color:C.creamDim}}>
      <div style={{fontSize:22,color:C.gold,marginBottom:2}}>▼</div>
      Revenue deployment by phase — capital flows downward into operations
    </div>

    {/* ── PHASE CARDS ── */}
    <div style={{display:"grid",gridTemplateColumns:activePhases.p2&&activePhases.p3?"1fr 1fr 1fr":activePhases.p2||activePhases.p3?"1fr 1fr":"1fr",gap:14}}>

      {/* PHASE 1 */}
      {activePhases.p1&&<div style={{...box,borderTop:`3px solid ${C.p1}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <div>
            <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.p1,fontWeight:700}}>Phase I</div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:serif,color:C.cream}}>Existing Operations</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:C.creamDim}}>Yr 3 Gross</div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:mono,color:C.p1}}>{fM(p1Rev,1)}</div>
          </div>
        </div>
        <div style={{fontSize:10,color:C.mist,margin:"6px 0 10px"}}>Zero development capex. Revenue from currently-operating assets.</div>
        <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:6,fontWeight:600}}>Revenue Streams</div>
        {p1Streams.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}20`}}>
          <span style={{fontSize:11,color:C.cream}}>{s.icon} {s.name.split("(")[0].trim()}</span>
          <span style={{fontSize:11,fontFamily:mono,color:C.p1}}>{fK(s.y3)}/yr</span>
        </div>)}
        <div style={{marginTop:10}}>
          {phaseBar("NOI",`${fP(1-S.p1OpCostPct)} margin`,C.p1,p1Rev>0?100*(p1Rev*(1-S.p1OpCostPct))/p1Rev:0)}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
            <span style={{color:C.creamDim}}>Phase 1 NOI</span>
            <span style={{fontWeight:700,fontFamily:mono,color:C.p1}}>{fM(calc.phNOI.p1,2)}/yr</span>
          </div>
        </div>
        <div style={{marginTop:10,padding:"8px 10px",background:`${C.p1}10`,borderRadius:6,fontSize:10,color:C.mist}}>
          <strong>Capital needed:</strong> $0 — all streams already operational. Maintenance CapEx {fK(S.p1AnnualMaintCapex)}/yr from cash flow.
        </div>
      </div>}

      {/* PHASE 2 */}
      {activePhases.p2&&<div style={{...box,borderTop:`3px solid ${C.p2}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <div>
            <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.p2,fontWeight:700}}>Phase II</div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:serif,color:C.cream}}>Eco-Lodge + Hospitality</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:C.creamDim}}>Yr 3 Gross</div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:mono,color:C.p2}}>{fM(p2Rev,1)}</div>
          </div>
        </div>
        <div style={{fontSize:10,color:C.mist,margin:"6px 0 10px"}}>Glamping units + hospitality programming under AEO. Funded from Phase 1 cash flow + community raise.</div>
        <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:6,fontWeight:600}}>Development Capital</div>
        {reno.enabled&&row("Reno Units (×"+reno.count+")",fM(reno.count*(reno.costPerUnit||100e3),2),C.p2)}
        {namu_std.enabled&&row("Namu Standard (×"+namu_std.count+")",fM(namu_std.count*S.namuStdUnitCost,2),C.p2)}
        {namu_prem.enabled&&row("Namu Premium (×"+namu_prem.count+")",fM(namu_prem.count*S.namuPremUnitCost,2),C.p2)}
        {row("Infrastructure + Permitting",fM(S.p2InfraFloor+S.p2PermittingCost,2),C.creamDim)}
        {totRow("Phase 2 CapEx",fM(p2Capex,1),C.p2)}
        <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:6,marginTop:10,fontWeight:600}}>Revenue Streams</div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}20`}}>
          <span style={{fontSize:11,color:C.cream}}>🛖 Eco-Lodge ({(reno.enabled?reno.count:0)+(namu_std.enabled?namu_std.count:0)+(namu_prem.enabled?namu_prem.count:0)} units)</span>
          <span style={{fontSize:11,fontFamily:mono,color:C.p2}}>{fM(calc.gGross3,2)}/yr</span>
        </div>
        {p2Streams.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}20`}}>
          <span style={{fontSize:11,color:C.cream}}>{s.icon} {s.name.split("(")[0].trim()}</span>
          <span style={{fontSize:11,fontFamily:mono,color:C.p2}}>{fK(s.y3)}/yr</span>
        </div>)}
        <div style={{marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
            <span style={{color:C.creamDim}}>Phase 2 NOI</span>
            <span style={{fontWeight:700,fontFamily:mono,color:C.p2}}>{fM(calc.phNOI.p2,2)}/yr</span>
          </div>
          {p2Capex>0&&calc.phNOI.p2>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:2}}>
            <span style={{color:C.creamDim}}>Dev Yield on CapEx</span>
            <span style={{fontWeight:700,fontFamily:mono,color:C.p2}}>{fP(calc.phNOI.p2/p2Capex)}</span>
          </div>}
          {p2Capex>0&&calc.phNOI.p2>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginTop:2}}>
            <span style={{color:C.creamDim}}>Payback Period</span>
            <span style={{fontWeight:700,fontFamily:mono,color:C.p2}}>{fYr(p2Capex/calc.phNOI.p2)}</span>
          </div>}
        </div>
      </div>}

      {/* PHASE 3 */}
      {activePhases.p3&&<div style={{...box,borderTop:`3px solid ${C.p3}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
          <div>
            <div style={{fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase",color:C.p3,fontWeight:700}}>Phase III</div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:serif,color:C.cream}}>Conservation Finance</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:C.creamDim}}>Yr 3 Gross</div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:mono,color:C.p3}}>{fM(p3Rev,1)}</div>
          </div>
        </div>
        <div style={{fontSize:10,color:C.mist,margin:"6px 0 10px"}}>Stack public + private conservation revenue streams. Grants, credits, and government payments.</div>
        {p3Capex>0&&<>
          <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:6,fontWeight:600}}>Conservation Capital</div>
          {row("Baseline Studies + Permitting",fM(S.p3BaselineStudiesCost+S.p3PermittingCost,2),C.creamDim)}
          {row("Restoration CapEx",fM(S.p3RestorationCapex,2),C.creamDim)}
          {totRow("Phase 3 CapEx",fM(p3Capex,1),C.p3)}
        </>}
        <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:6,marginTop:10,fontWeight:600}}>Revenue Streams</div>
        {p3Streams.map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${C.border}20`}}>
          <span style={{fontSize:11,color:C.cream}}>{s.icon} {s.name.split("(")[0].trim()}</span>
          <span style={{fontSize:11,fontFamily:mono,color:C.p3}}>{s.oneTime?"One-time":`${fK(s.y3)}/yr`}</span>
        </div>)}
        <div style={{marginTop:10}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
            <span style={{color:C.creamDim}}>Phase 3 NOI</span>
            <span style={{fontWeight:700,fontFamily:mono,color:C.p3}}>{fM(calc.phNOI.p3,2)}/yr</span>
          </div>
        </div>
      </div>}
    </div>

    {/* ── COMBINED SUMMARY ── */}
    <div style={{...box,borderTop:`3px solid ${C.gold}`,marginTop:8}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          {hdr("Combined Operating Summary","All active phases · Year 3 stabilized",C.gold)}
          {row("Total Gross Revenue",fM(totalRev,1),C.cream,null,true)}
          {row("Total NOI",fM(calc.noi3,1),C.gold,null,true)}
          {row("Operating Yield on Purchase",fP(calc.opYield),C.cream)}
          {calc.devCapex>0&&row("Total Development CapEx",fM(calc.devCapex,1),C.coral)}
          {calc.devYield&&row("Development Yield",fP(calc.devYield),C.teal)}
          {calc.payback&&row("Payback Period",fYr(calc.payback),C.teal)}
        </div>
        <div>
          {hdr("Annual Obligations (Pre-Equity)","Paid before any equity distributions",C.coral)}
          {row("Tier 1 — Income Trust IO",fM(debtService,2),C.coral,`${fP(S.noteInterestRate)} on ${fM(sellerNote,1)}`)}
          {row("Tier 3 — RDC Management Fee",fM(mgmtFee,2),C.amber)}
          {row("Tier 5 — PRT Covenant (5% gross)",fM(prtCovenant,2),C.teal)}
          {totRow("Total Pre-Equity Obligations",fM(debtService+mgmtFee+prtCovenant,1),C.coral)}
          <div style={{height:8}}/>
          {row("Residual to Equity (NOI − Obligations)",fM(Math.max(0,calc.noi3-debtService-mgmtFee-prtCovenant),1),C.gold,null,true)}
        </div>
      </div>

      {/* STACKED BAR VISUAL */}
      <div style={{marginTop:16}}>
        <div style={{fontSize:9,letterSpacing:"0.15em",textTransform:"uppercase",color:C.creamDim,marginBottom:6,fontWeight:600}}>Revenue by Phase — Year 3</div>
        <div style={{display:"flex",height:28,borderRadius:6,overflow:"hidden",background:C.bgLight}}>
          {totalRev>0&&p1Rev>0&&<div style={{width:`${p1Rev/totalRev*100}%`,background:C.p1,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:9,fontWeight:700,color:"#fff"}}>P1 {fP(p1Rev/totalRev)}</span>
          </div>}
          {totalRev>0&&p2Rev>0&&<div style={{width:`${p2Rev/totalRev*100}%`,background:C.p2,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:9,fontWeight:700,color:"#fff"}}>P2 {fP(p2Rev/totalRev)}</span>
          </div>}
          {totalRev>0&&p3Rev>0&&<div style={{width:`${p3Rev/totalRev*100}%`,background:C.p3,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:9,fontWeight:700,color:"#fff"}}>P3 {fP(p3Rev/totalRev)}</span>
          </div>}
        </div>
      </div>
    </div>

    <div style={{textAlign:"center",fontSize:10,color:C.creamDim,padding:"12px 0 24px"}}>
      RDC × Regenesis · Draft Framework · {S.projectName} · Capital stack reflects current model settings
    </div>
  </div>);
}

function WhatIfPage({purchasePrice,hbu,buyerTax,sellerNote,settings:WS,modelNoi,onSavePreset,modelResetKey}){
  // ── ISOLATED DEAL PARAMS — changes here never touch the Model/Program page ──
  const [wiPP,     setWiPP]    = useState(purchasePrice);
  const [wiHbu,    setWiHbu]   = useState(hbu);
  const [wiBuyerTax,setWiBT]   = useState(buyerTax);
  const [wiNote,   setWiNote]  = useState(sellerNote||22e6);

  // ── WHAT-IF ANALYSIS PARAMS ────────────────────────────────────────────────
  const [agi,       setAgi]    = useState(10e6);
  const [invEquity, setInvEq]  = useState(sellerNote||22e6);
  const [irr,       setIrr]    = useState(0.12);
  const [taxRate,   setTax]    = useState(Math.min((buyerTax||0.37)+0.133, 0.58));
  const [noiFactor, setNoi]    = useState(1.0);
  const [priorCFwd, setPrior]  = useState(0);
  const [agiFactor, setAgiFac] = useState(0.60);
  const [saveMsg,   setSaveMsg]= useState("");
  const [presetName,setPresetName]=useState("");
  const YEARS=16;

  // Reset ALL What-If local state when a new model is loaded (modelResetKey changes)
  useEffect(()=>{
    setWiPP(purchasePrice);
    setWiHbu(hbu);
    setWiBT(buyerTax);
    setWiNote(sellerNote||22e6);
    setInvEq(sellerNote||22e6);
    setTax(Math.min((buyerTax||0.37)+0.133, 0.58));
    setNoi(1.0);
    setPrior(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[modelResetKey]);

  // Anchor NOI from model if available, else fall back
  const anchorNoi = modelNoi && modelNoi > 0 ? modelNoi : 2.2e6;

  const model=useMemo(()=>{
    // Use local isolated deal params — these are What-If-only, never affect Model page
    const noteRate = WS?.noteInterestRate || 0.055;
    const notePmt   = wiNote*noteRate;
    const rdcMgmt   = 500e3;
    const carryPmt  = wiNote*0.035;
    const commPref  = 200*50e3;
    const easVal    = Math.max(0,wiHbu-wiPP);
    const annualDed = easVal/YEARS;
    const agiCap    = agi*agiFactor;
    const irrTarget = invEquity*irr;

    // NOI schedule anchored to the model's actual Yr3 NOI, not hardcoded values
    // Yr1 ≈ 23% of Yr3, Yr2 ≈ 55%, Yr3 = 100%, ramps to ~2.8× by Yr16
    const baseNOI=yr=>{
      const a=anchorNoi;
      const b=yr===1?a*0.23:yr===2?a*0.55:yr===3?a:yr===4?a*1.36:yr===5?a*1.73:
              yr<=8?a*2.05+(yr-5)*a*0.14:yr<=12?a*2.45+(yr-8)*a*0.09:a*2.82+(yr-12)*a*0.068;
      return b*noiFactor;
    };

    let rows=[],cumInvTax=0,cumInvCash=0,cumComm=0,cumRDC=0,dedCarry=priorCFwd;

    for(let yr=1;yr<=YEARS;yr++){
      const gross  = baseNOI(yr);
      const t15    = notePmt+rdcMgmt+(yr<=2?carryPmt:0)+gross*0.05;
      const surplus= Math.max(0,gross-t15);

      // tax deduction
      const dedAvail = annualDed+dedCarry;
      const dedUsed  = Math.min(dedAvail,agiCap);
      dedCarry       = Math.max(0,dedAvail-dedUsed);
      const taxSave  = dedUsed*taxRate;
      cumInvTax     += taxSave;

      // investor cash — zero Yrs 1-7; fills gap from Yr 8+
      const cashNeeded = Math.max(0,irrTarget-taxSave);
      const invCash    = yr<=7?0:Math.min(cashNeeded,surplus);
      cumInvCash      += invCash;
      const blendPct   = (taxSave+invCash)/invEquity;
      const irrGap     = irrTarget-taxSave-invCash;

      // community — starts Yr 8 or when investor is whole (simplified)
      const commOn   = yr>=8;
      const commCash = commOn?Math.min((surplus-invCash)*0.20,Math.max(0,commPref-cumComm)):0;
      cumComm       += commCash;

      // RDC
      const rdcPromote = (cumComm>=commPref)?(surplus-invCash-commCash)*0.20:0;
      cumRDC          += rdcMgmt+rdcPromote;

      rows.push({yr,gross,t15,surplus,dedUsed,dedCarry,taxSave,
        invCash,blendPct,irrGap,cumInvTax,cumInvCash,
        trustDist:notePmt,rdcMgmt,stewTrust:gross*0.05,
        commCash,cumComm,rdcPromote});
    }

    const tot=rows.reduce((a,r)=>({gross:a.gross+r.gross,taxSave:a.taxSave+r.taxSave,
      invCash:a.invCash+r.invCash,trustDist:a.trustDist+r.trustDist,
      rdcMgmt:a.rdcMgmt+r.rdcMgmt,stewTrust:a.stewTrust+r.stewTrust,
      commCash:a.commCash+r.commCash,rdcPromote:a.rdcPromote+r.rdcPromote}),
      {gross:0,taxSave:0,invCash:0,trustDist:0,rdcMgmt:0,stewTrust:0,commCash:0,rdcPromote:0});

    return{rows,tot,easVal,annualDed,agiCap,irrTarget,
      impliedIRR:(tot.taxSave+tot.invCash)/(invEquity*YEARS)};
  },[agi,invEquity,irr,taxRate,noiFactor,priorCFwd,agiFactor,wiPP,wiHbu,wiNote,anchorNoi,WS]);

  const {rows,tot,easVal,annualDed,agiCap,irrTarget,impliedIRR}=model;

  const TH=({ch,w,c=C.gold})=>(
    <th style={{padding:"6px 8px",textAlign:"right",fontSize:9,letterSpacing:"0.07em",
      textTransform:"uppercase",color:c,borderBottom:`2px solid ${C.border}`,
      whiteSpace:"nowrap",background:C.bgMid,minWidth:w,fontFamily:mono,fontWeight:700}}>{ch}</th>);

  const TD=({v,c=C.cream,bg,b})=>(
    <td style={{padding:"5px 8px",textAlign:"right",fontSize:11,color:c,fontFamily:mono,
      background:bg||"transparent",fontWeight:b?700:400,
      borderBottom:`1px solid ${C.border}22`}}>{v}</td>);

  const colGroups=[
    {lbl:"OPERATIONS",cols:3,c:C.creamDim},
    {lbl:"§170(h) TAX DEDUCTION",cols:3,c:C.teal},
    {lbl:"INCOME TRUST",cols:1,c:C.coral},
    {lbl:"INVESTOR",cols:3,c:C.sky},
    {lbl:"RDC",cols:2,c:C.amber},
    {lbl:"STEWARDSHIP",cols:1,c:C.sage},
    {lbl:"COMMUNITY",cols:2,c:C.lavender},
  ];

  const negYrs=rows.filter(r=>r.surplus<0).map(r=>`Yr ${r.yr}`);

  return(
    <div style={{padding:"18px 22px",overflowY:"auto",height:"calc(100vh - 48px)"}}>
      {/* header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:9,color:C.gold,letterSpacing:"0.2em",textTransform:"uppercase",marginBottom:2}}>What-If Analysis — Isolated Sandbox</div>
          <div style={{fontSize:17,fontWeight:800,fontFamily:serif,color:C.cream,marginBottom:3}}>
            Tax Deductions · Cash Flows · Returns to All Parties — Year 1 to {YEARS}
          </div>
          <div style={{fontSize:11,color:C.mist}}>
            Changes here <strong style={{color:C.teal}}>never affect the Program/Model page</strong>. Deal params below are What-If-only copies.{" "}
            <span style={{color:C.teal,fontFamily:mono}}>NOI basis: {fM(anchorNoi,2)} (Yr3 from Model{modelNoi>0?" — live":""})</span>
          </div>
        </div>
        {/* SAVE PRESET */}
        <div style={{flexShrink:0,marginLeft:16,background:C.bgCard,border:`1px solid ${C.gold}50`,borderRadius:9,padding:"10px 14px",minWidth:240}}>
          <div style={{fontSize:9,color:C.gold,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:7}}>💾 Save as Preset</div>
          <input
            value={presetName}
            onChange={e=>setPresetName(e.target.value)}
            placeholder='e.g. "Roger Ask — Conservative"'
            style={{width:"100%",background:C.bgLight,border:`1px solid ${C.border}`,borderRadius:5,
              color:C.cream,fontFamily:mono,fontSize:11,padding:"5px 8px",outline:"none",marginBottom:7,boxSizing:"border-box"}}
          />
          <button
            onClick={()=>{
              if(!presetName.trim())return;
              const preset={
                id:`user-${Date.now()}`,
                name:presetName.trim(),
                description:`What-If save — PP $${(wiPP/1e6).toFixed(0)}M · HBU $${(wiHbu/1e6).toFixed(0)}M · NOI ${(noiFactor*100).toFixed(0)}% · IRR ${(irr*100).toFixed(1)}%`,
                badge:"★",badgeColor:C.lavender,
                isUserSaved:true,
                savedAt:new Date().toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),
                state:{
                  scenario:"mid",
                  activePhases:{p1:true,p2:false,p3:false},
                  activeStreams:Object.fromEntries(STREAM_DEFS.map(s=>[s.id,s.on])),
                  purchasePrice:wiPP,hbu:wiHbu,buyerTax:wiBuyerTax,sellerNote:wiNote,
                  occ:0.65,parcelSale:2e6,
                  unitTypes:{reno:{enabled:false,count:3,rate:250,costPerUnit:100e3},namu_std:{enabled:false,count:8,rate:320},namu_prem:{enabled:false,count:4,rate:520}},
                  whatif:{agi,invEquity,irr,taxRate,noiFactor,priorCFwd,agiFactor},
                },
              };
              onSavePreset(preset);
              setPresetName("");
              setSaveMsg("✓ Saved!");
              setTimeout(()=>setSaveMsg(""),2500);
            }}
            style={{width:"100%",padding:"6px",borderRadius:5,border:`1px solid ${C.gold}`,
              background:`${C.gold}20`,color:C.gold,cursor:"pointer",fontWeight:700,fontSize:11}}>
            {saveMsg||"Save Preset →"}
          </button>
        </div>
      </div>

      {/* DEAL PARAMS — isolated copies, won't affect Model page */}
      <div style={{background:`${C.coral}08`,border:`1px solid ${C.coral}30`,borderRadius:8,padding:"11px 14px",marginBottom:10}}>
        <div style={{fontSize:9,color:C.coral,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:9}}>
          Deal Parameters — What-If Only · Program page unaffected
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9}}>
          {[
            {label:"Purchase Price",  val:wiPP,      set:setWiPP,  min:50e6,max:80e6, step:500e3,fmt:v=>fM(v,1), color:C.coral,  sub:"What-if deal price"},
            {label:"HBU Appraisal",   val:wiHbu,     set:setWiHbu, min:90e6,max:200e6,step:1e6,  fmt:v=>fM(v,0), color:C.lavender,sub:"Highest & best use"},
            {label:"Seller Note",     val:wiNote,    set:setWiNote,min:0,   max:35e6, step:500e3,fmt:v=>fM(v,1), color:C.amber,  sub:"Carried at close"},
            {label:"Buyer Tax Rate",  val:wiBuyerTax,set:setWiBT,  min:.25, max:.54,  step:.01,  fmt:fP,          color:C.sky,    sub:"Fed + CA marginal"},
          ].map(sl=>(
            <div key={sl.label} style={{background:C.bgCard,borderRadius:7,padding:"8px 10px",border:`1px solid ${C.border}`}}>
              <Slider {...sl}/>
            </div>
          ))}
        </div>
      </div>

      {/* ANALYSIS SLIDERS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:14}}>
        {[
          {label:"Investor Equity",    val:invEquity, set:setInvEq,  min:15e6,max:30e6, step:5e5, fmt:v=>fM(v,1), color:C.sky,     sub:"PBC founding units (60%)"},
          {label:"Investor CA AGI",    val:agi,       set:setAgi,    min:3e6, max:20e6,  step:5e5, fmt:v=>fM(v,1), color:C.teal,    sub:"Annual California AGI"},
          {label:"AGI Limit",          val:agiFactor, set:setAgiFac, min:.3,  max:1.0,   step:.05, fmt:fP,          color:C.sage,    sub:"60% standard · 100% farmer"},
          {label:"Blended IRR",        val:irr,       set:setIrr,    min:.08, max:.20,   step:.005,fmt:fP,          color:C.gold,    sub:"Tax savings credited first"},
          {label:"Tax Rate",           val:taxRate,   set:setTax,    min:.35, max:.58,   step:.005,fmt:fP,          color:C.amber,   sub:"Fed + CA combined marginal"},
          {label:"Prior Carryforward", val:priorCFwd, set:setPrior,  min:0,   max:20e6,  step:5e5, fmt:v=>fM(v,1), color:C.coral,   sub:"§170(h) existing carryforward"},
          {label:"NOI Scenario",       val:noiFactor, set:setNoi,    min:.5,  max:1.5,   step:.05, fmt:v=>`${(v*100).toFixed(0)}%`,color:C.lavender,sub:"% of model Yr3 NOI"},
        ].map(sl=>(
          <div key={sl.label} style={{background:C.bgCard,borderRadius:8,padding:"9px 11px",border:`1px solid ${C.border}`}}>
            <Slider {...sl}/>
          </div>
        ))}
        {/* easement KPIs */}
        <div style={{background:C.bgCard,borderRadius:8,padding:"9px 11px",border:`1px solid ${C.gold}40`}}>
          <div style={{fontSize:9,color:C.gold,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6,fontWeight:700}}>Easement</div>
          {[
            ["Value",fM(easVal,1),C.cream],
            ["Ann. Deduction",fM(annualDed,1),C.teal],
            ["AGI Cap /yr",fM(agiCap,1),C.teal],
            ["IRR Target /yr",fM(irrTarget,2),C.gold],
            ["16yr Implied IRR",fP(impliedIRR),impliedIRR>=irr?C.sage:C.coral],
          ].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:10,color:C.mist}}>{l}</span>
              <span style={{fontSize:10,fontFamily:mono,fontWeight:700,color:c}}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* warning */}
      {negYrs.length>0&&(
        <div style={{background:`${C.coral}15`,border:`1px solid ${C.coral}50`,borderRadius:7,
          padding:"8px 13px",marginBottom:11,fontSize:10,color:C.coral}}>
          ⚠️ NOI below Tier 1–5 obligations in {negYrs.join(", ")} at {(noiFactor*100).toFixed(0)}% of base case — equity distributions suspend, obligations accrue.
        </div>
      )}

      {/* table */}
      <div style={{overflowX:"auto",borderRadius:9,border:`1px solid ${C.border}`}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            {/* group row */}
            <tr style={{background:C.bgLight}}>
              <td style={{padding:"3px 10px",fontSize:8,borderBottom:`1px solid ${C.border}`,background:C.bgMid}}/>
              {colGroups.map(({lbl,cols,c},i)=>(
                <td key={i} colSpan={cols} style={{padding:"3px 6px",fontSize:8,color:c,textAlign:"center",
                  fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",
                  borderBottom:`1px solid ${C.border}`,borderLeft:`1px solid ${C.border}33`,background:C.bgLight}}>{lbl}</td>
              ))}
            </tr>
            {/* header row */}
            <tr>
              <TH ch="YR" w={38} c={C.gold}/>
              <TH ch="Gross NOI" w={80} c={C.creamDim}/><TH ch="T1–5" w={78} c={C.creamDim}/><TH ch="Surplus" w={74} c={C.sage}/>
              <TH ch="Ded Used" w={78} c={C.teal}/><TH ch="Carry→" w={72} c={C.teal}/><TH ch="Tax Save" w={78} c={C.teal}/>
              <TH ch="Note IO" w={74} c={C.coral}/>
              <TH ch="Inv Cash" w={74} c={C.sky}/><TH ch="Blend%" w={68} c={C.sky}/><TH ch="vs Target" w={80} c={C.sky}/>
              <TH ch="Mgmt Fee" w={74} c={C.amber}/><TH ch="Promote" w={72} c={C.amber}/>
              <TH ch="5% Trust" w={74} c={C.sage}/>
              <TH ch="Comm Dist" w={78} c={C.lavender}/><TH ch="Cum Comm" w={78} c={C.lavender}/>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>{
              const rowBg=r.surplus<0?`${C.coral}10`:r.yr<=7?`${C.teal}07`:"transparent";
              const yrCol=r.yr<=7?C.teal:C.gold;
              const sCol=r.surplus<0?C.coral:r.surplus>5e5?C.sage:C.cream;
              const bCol=r.blendPct>=irr?C.sage:r.blendPct>=irr*0.75?C.amber:C.coral;
              const gCol=r.irrGap<500?C.sage:r.irrGap<irrTarget*0.5?C.amber:C.coral;
              const gStr=r.irrGap<500?"✓ on target":r.irrGap>0?`(${fD(r.irrGap)})`:`+${fD(Math.abs(r.irrGap))}`;
              return(
                <tr key={r.yr}>
                  <td style={{padding:"5px 10px",fontSize:11,fontWeight:700,color:yrCol,fontFamily:mono,
                    background:rowBg,borderBottom:`1px solid ${C.border}22`,textAlign:"center"}}>
                    {r.yr}{r.yr<=7&&<span style={{fontSize:7,marginLeft:2}}>●</span>}
                  </td>
                  <TD v={fD(r.gross)}    c={C.cream}    bg={rowBg}/>
                  <TD v={fD(r.t15)}     c={C.creamDim} bg={rowBg}/>
                  <TD v={fD(r.surplus)} c={sCol}       bg={rowBg} b={r.surplus<0}/>
                  <TD v={fD(r.dedUsed)} c={C.teal}     bg={rowBg}/>
                  <TD v={r.dedCarry>1e3?fD(r.dedCarry):"—"} c={C.creamDim} bg={rowBg}/>
                  <TD v={fD(r.taxSave)} c={C.teal}     bg={rowBg} b/>
                  <TD v={fD(r.trustDist)} c={C.coral}  bg={rowBg}/>
                  <TD v={r.invCash>0?fD(r.invCash):"—"} c={C.sky} bg={rowBg}/>
                  <TD v={fP(r.blendPct)} c={bCol}      bg={rowBg} b/>
                  <TD v={gStr}           c={gCol}       bg={rowBg}/>
                  <TD v={fD(r.rdcMgmt)} c={C.amber}    bg={rowBg}/>
                  <TD v={r.rdcPromote>0?fD(r.rdcPromote):"—"} c={C.amber} bg={rowBg}/>
                  <TD v={fD(r.stewTrust)} c={C.sage}   bg={rowBg}/>
                  <TD v={r.commCash>0?fD(r.commCash):"—"} c={C.lavender} bg={rowBg}/>
                  <TD v={fD(r.cumComm)} c={r.cumComm>=10e6?C.sage:C.lavender} bg={rowBg}/>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{background:C.bgMid,borderTop:`2px solid ${C.gold}60`}}>
              <td style={{padding:"6px 10px",fontSize:10,fontWeight:700,color:C.gold,fontFamily:mono,textAlign:"center"}}>TOT</td>
              <TD v={fM(tot.gross,1)}     c={C.cream}    bg={C.bgMid} b/>
              <TD v=""                    c={C.creamDim} bg={C.bgMid}/>
              <TD v=""                    c={C.sage}     bg={C.bgMid}/>
              <TD v=""                    c={C.teal}     bg={C.bgMid}/>
              <TD v=""                    c={C.creamDim} bg={C.bgMid}/>
              <TD v={fM(tot.taxSave,1)}   c={C.teal}     bg={C.bgMid} b/>
              <TD v={fM(tot.trustDist,1)} c={C.coral}    bg={C.bgMid} b/>
              <TD v={fM(tot.invCash,1)}   c={C.sky}      bg={C.bgMid} b/>
              <TD v={fP(impliedIRR)}      c={impliedIRR>=irr?C.sage:C.coral} bg={C.bgMid} b/>
              <TD v=""                    c={C.sky}      bg={C.bgMid}/>
              <TD v={fM(tot.rdcMgmt,1)}   c={C.amber}    bg={C.bgMid} b/>
              <TD v={tot.rdcPromote>0?fM(tot.rdcPromote,1):"—"} c={C.amber} bg={C.bgMid} b/>
              <TD v={fM(tot.stewTrust,1)} c={C.sage}     bg={C.bgMid} b/>
              <TD v={fM(tot.commCash,1)}  c={C.lavender} bg={C.bgMid} b/>
              <TD v={fM(tot.commCash,1)}  c={tot.commCash>=10e6?C.sage:C.lavender} bg={C.bgMid} b/>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* legend */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:12}}>
        {[
          [C.teal,    "Yrs 1–7 ●",     "Cash-protected. Investor draws zero from PBC regardless of NOI. Tax savings alone satisfy IRR in most scenarios."],
          [C.sky,     "Blend %",        "Combined return (tax savings + cash) ÷ invested equity. Green = at/above target IRR. Amber = within 75%. Red = below."],
          [C.coral,   "vs Target",      "Gap vs IRR target. Parentheses = shortfall. Shortfall accrues — does not trigger default or note acceleration."],
          [C.lavender,"Community",      "Begins Yr 8 or when investor is whole. 1.67× preferred = $50K/unit × 200 members = $10M total before residual splits."],
        ].map(([c,l,d],i)=>(
          <div key={i} style={{background:C.bgCard,borderRadius:7,padding:"8px 10px",border:`1px solid ${c}30`,borderLeft:`3px solid ${c}`}}>
            <div style={{fontSize:10,fontWeight:700,color:c,marginBottom:2}}>{l}</div>
            <div style={{fontSize:10,color:C.mist,lineHeight:1.5}}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:9,fontSize:10,color:C.mist,fontStyle:"italic"}}>
        Tier 1–5 obligations = $22M note IO + $500K RDC mgmt + carry-back interest (Yr 1–2 only) + 5% PRT covenant on gross revenue. NOI base case drawn from Phased Model — use NOI Scenario slider to stress-test. All figures illustrative only.
      </div>
    </div>
  );
}

// ═══ MAIN APP ═════════════════════════════════════════════════════════════════
export default function App(){
  const [view,setView]=useState("cover");
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

  // THEME
  const [isDark,setIsDark]=useState(()=>{try{return localStorage.getItem("prt:theme")!=="light";}catch{return true;}});
  C = isDark ? DARK : LIGHT;
  const toggleTheme=()=>{const next=!isDark;setIsDark(next);try{localStorage.setItem("prt:theme",next?"dark":"light");}catch{}};
  useEffect(()=>{document.body.style.background=isDark?DARK.bg:LIGHT.bg;},[isDark]);

  const mult={"low":0,"mid":.5,"high":1}[scenario];
  const S=settings;
  const anyP=Object.values(activePhases).some(Boolean);

  // LOAD
  useEffect(()=>{(async()=>{
    const sv=await sGet(SK_SETTINGS,DEFAULT_SETTINGS);
    const ss=await sGet(SK_SESSION,null);
    const sc=await sGet(SK_SCENARIOS,[]);
    const lm=await sGet(SK_LAST_MODEL,"base");
    const up=await sGet(SK_USER_PRESETS,[]);
    setSettings({...DEFAULT_SETTINGS,...sv});
    setLastModelId(lm||"base");
    setUserPresets(up||[]);
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

  const [lastModelId,setLastModelId]=useState("base");
  const [userPresets,setUserPresets]=useState([]);
  const [modelResetKey,setModelResetKey]=useState(0); // increments on every canonical model load → resets WhatIf state

  // ── SYNC: when Settings saves, push deal params back into model slider state ──
  const applySettingsToModel = useCallback((s)=>{
    setPP(s.defaultPurchasePrice);
    setHbu(s.defaultHBU);
    setBuyerTax(s.defaultBuyerTaxRate);
    setNote(s.defaultSellerFinance);
  },[]);

  // ── LOAD CANONICAL MODEL ───────────────────────────────────────────────────
  const loadCanonicalModel = useCallback((m)=>{
    const ss=m.state;
    setScenario(ss.scenario);
    setActivePhases(ss.activePhases);
    setActiveStreams(ss.activeStreams);
    setPP(ss.purchasePrice);
    setHbu(ss.hbu);
    setBuyerTax(ss.buyerTax);
    setNote(ss.sellerNote);
    setUnitTypes(ss.unitTypes);
    setOcc(ss.occ);
    setParcelSale(ss.parcelSale);
    setLastModelId(m.id);
    sSet(SK_LAST_MODEL,m.id);
    setModelResetKey(k=>k+1); // signal WhatIfPage to reset its isolated state
    setView("model");
  },[]);

  // ── USER PRESET MANAGEMENT ────────────────────────────────────────────────
  const saveUserPreset = useCallback((preset)=>{
    setUserPresets(prev=>{
      const next=[...prev,preset];
      sSet(SK_USER_PRESETS,next);
      return next;
    });
  },[]);

  const deleteUserPreset = useCallback((id)=>{
    setUserPresets(prev=>{
      const next=prev.filter(p=>p.id!==id);
      sSet(SK_USER_PRESETS,next);
      return next;
    });
  },[]);
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
    <div style={{background:`linear-gradient(180deg,${C.bgLight},${C.bgMid})`,borderBottom:`1px solid ${C.gold}30`,padding:"10px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <div>
          <div style={{fontSize:9,letterSpacing:"0.22em",textTransform:"uppercase",color:C.gold,marginBottom:1}}>RDC × Regenesis — Confidential</div>
          <div style={{fontSize:15,fontWeight:800,fontFamily:serif,letterSpacing:"-0.01em",color:C.cream}}>{S.projectName} · Phased ROI & Five Capitals</div>
        </div>
        <div style={{display:"flex",gap:2,background:C.bgLight,borderRadius:6,padding:3}}>
          {[["cover","🏛 Overview"],["capstack","🏗 Capital Stack"],["model","📊 Model"],["whatif","🔬 What-If"],["settings","⚙️ Settings"],["scenarios",`💾 Scenarios${scenarios.length>0?" ("+scenarios.length+")":""}`]].map(([k,l])=>(
            <button key={k} onClick={()=>setView(k)} style={{padding:"5px 11px",borderRadius:4,border:"none",cursor:"pointer",
              background:view===k?C.gold:"transparent",color:view===k?C.bg:C.creamDim,fontSize:11,fontWeight:view===k?700:400,whiteSpace:"nowrap"}}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:5,alignItems:"center"}}>
        {view==="model"&&Object.entries({low:"Conservative",mid:"Base Case",high:"Upside"}).map(([k,l])=>(
          <button key={k} onClick={()=>setScenario(k)} style={{padding:"4px 10px",borderRadius:5,
            border:`1px solid ${scenario===k?C.gold:C.border}`,background:scenario===k?`${C.gold}20`:"transparent",
            color:scenario===k?C.gold:C.creamDim,fontSize:11,fontWeight:scenario===k?700:400,cursor:"pointer"}}>{l}</button>
        ))}
        <span style={{fontSize:9,color:saveFlash?C.sage:C.creamDim,fontFamily:mono,transition:"color 0.5s",marginLeft:4}}>
          {saveFlash?"● saved":"○ auto-save"}
        </span>
        <button onClick={toggleTheme} title="Toggle light/dark mode" style={{
          padding:"4px 9px",borderRadius:5,border:`1px solid ${C.border}`,
          background:C.bgLight,color:C.cream,cursor:"pointer",fontSize:13,lineHeight:1,
          transition:"all 0.2s",marginLeft:4}}>
          {isDark?"☀️":"🌙"}
        </button>
      </div>
    </div>

    {view==="cover"&&<CoverPage onEnter={(v)=>setView(v||"model")} onLoadModel={loadCanonicalModel} lastModelId={lastModelId} userPresets={userPresets} onDeletePreset={deleteUserPreset}/>}
    {view==="capstack"&&<CapitalStackPage purchasePrice={purchasePrice} hbu={hbu} buyerTax={buyerTax} sellerNote={sellerNote} settings={S} calc={calc} activePhases={activePhases} activeStreams={activeStreams} unitTypes={unitTypes} occ={occ}/>}
    {view==="settings"&&<div style={{overflowY:"auto",height:"calc(100vh - 48px)"}}><SettingsPage settings={S} setSettings={setSettings} onClose={()=>setView("model")} onApply={applySettingsToModel}/></div>}
    {view==="scenarios"&&<div style={{overflowY:"auto",height:"calc(100vh - 48px)"}}><ScenariosPage scenarios={scenarios} onSave={saveScenario} onLoad={loadScenario} onDelete={delScenario} onClose={()=>setView("model")}/></div>}
    {view==="whatif"&&<WhatIfPage purchasePrice={purchasePrice} hbu={hbu} buyerTax={buyerTax} sellerNote={sellerNote} settings={S} modelNoi={calc.noi3} onSavePreset={saveUserPreset} modelResetKey={modelResetKey}/>}

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
                  <span style={{fontSize:9,color:C.mist,fontWeight:400,textTransform:"none",marginLeft:6}}>+ {fD(S.p2InfraFloor+S.p2PermittingCost)} infra/permits always</span>
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
        <div style={{fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",color:C.mist,marginBottom:11,fontWeight:700}}>Deal Parameters</div>
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
            ].map(({l,v,s,c})=><div key={l}><div style={{fontSize:10,color:C.mist,marginBottom:2}}>{l}</div><div style={{fontSize:18,fontWeight:800,color:c,fontFamily:mono,lineHeight:1}}>{v}</div>{s&&<div style={{fontSize:10,color:C.mist}}>{s}</div>}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1.4fr",gap:10,paddingTop:9,borderTop:`1px solid ${C.gold}35`}}>
            <div>
              <div style={{fontSize:9,color:C.creamDim,marginBottom:2}}>+ Seller Note NPV</div>
              <div style={{fontSize:14,fontWeight:700,color:C.gold,fontFamily:mono}}>+{fM(calc.noteNPV,1)}</div>
              <div style={{fontSize:10,color:C.mist}}>{fP(S.noteInterestRate)} · {S.noteTerm}yr</div>
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
                  <span style={{fontSize:10,color:C.mist}}>{PHASE_META[p].label}</span>
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
            {["Stream","Yr 1","Yr 3 Gross","NOI"].map(h=><div key={h} style={{fontSize:10,color:C.mist,textTransform:"uppercase",letterSpacing:"0.08em",textAlign:h==="Stream"?"left":"right"}}>{h}</div>)}
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
        <div style={{fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase",color:C.mist,marginBottom:9,fontWeight:700}}>Five Capitals Outputs</div>
        <div style={{display:"flex",gap:3,marginBottom:14,background:C.bgLight,borderRadius:6,padding:3}}>
          {[["capitals","Scores"],["radar","Radar"],["structure","Structure"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTabR(k)} style={{flex:1,padding:"5px 3px",borderRadius:4,border:"none",cursor:"pointer",
              background:tabR===k?C.bgCard:"transparent",color:tabR===k?C.cream:C.creamDim,fontSize:11,fontWeight:tabR===k?700:400}}>{l}</button>
          ))}
        </div>

        {tabR==="capitals"&&<div>
          {CAPITALS.map(cap=><CapBar key={cap.key} cap={cap} score={anyP?calc.scores[cap.key]:S[`base${cap.key}`]} delta={anyP?calc.deltas[cap.key]:0}/>)}
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px",marginTop:10}}>
            <div style={{fontSize:10,color:C.mist,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:9}}>Impact by Phase (active streams)</div>
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
              <div><div style={{fontSize:11,fontWeight:600,color:cap.color}}>{cap.key}</div><div style={{fontSize:10,color:C.mist}}>{cap.desc}</div></div>
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
              <div><div style={{fontSize:11,fontWeight:800,color:item.color}}>{item.title}</div><div style={{fontSize:10,color:C.mist}}>{item.role}</div></div>
            </div>
            <div style={{fontSize:10,color:C.mist,lineHeight:1.55}}>{item.desc}</div>
          </div>)}
          <div style={{background:C.bgCard,borderRadius:7,padding:"11px 12px",border:`1px solid ${C.border}`,marginTop:10}}>
            <div style={{fontSize:10,fontWeight:700,color:C.cream,marginBottom:7}}>PRT Covenants — Run with the Land</div>
            {["Five Capitals annual reporting","Readiness gates for all expansion","Chumash priority access — irrevocable","Marine Sanctuary alignment required","Cultural capital triggers covenant review"].map((cov,i)=>(
              <div key={i} style={{display:"flex",gap:6,marginBottom:5,alignItems:"flex-start"}}>
                <div style={{width:3,height:3,borderRadius:"50%",background:C.gold,marginTop:5,flexShrink:0}}/>
                <div style={{fontSize:10,color:C.mist}}>{cov}</div>
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

    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700;800&family=DM+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap');
      *{box-sizing:border-box;}
      ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#0A1520;} ::-webkit-scrollbar-thumb{background:#1E3A54;border-radius:4px;}
      input[type=range]{-webkit-appearance:none;width:100%;background:transparent;}
      input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#C9A84C;cursor:pointer;margin-top:-4px;}
      input[type=range]::-webkit-slider-runnable-track{height:4px;background:transparent;}
      input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:#C9A84C;cursor:pointer;border:none;}
    `}</style>
  </div>);
}
