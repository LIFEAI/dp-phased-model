# dp-phased-model — CLAUDE.md
> Read this first. It will save you 500 tokens every session.

## What This Is
Single-file Vite + React financial model for **Dos Pueblos Ranch** (219 acres, Gaviota Coast, CA).  
Deployed at: **https://capital-flows.dev.place.fund**
Repo: `github.com/LIFEAI/dp-phased-model` (private)
Stack: Vite, React 18, Recharts — **no backend, no auth, no API calls**

---

## File Map — Where to Edit What

| What you want to change | File | Key identifier |
|---|---|---|
| Deal party profiles (names, gets/puts/waterfall) | `src/App.jsx` | `const PLAYERS=[` |
| What-If defaults per player (sliders) | `src/App.jsx` | each player's `whatif:{...}` object |
| Waterfall tier labels/amounts | `src/App.jsx` | `const WATERFALL_TIERS=[` |
| Revenue streams (Abalone, Urchin, etc.) | `src/App.jsx` | `const STREAM_DEFS=[` |
| Phase metadata | `src/App.jsx` | `const PHASE_META=` |
| Canonical named models (Base Case, Conservative…) | `src/App.jsx` | `const CANONICAL_MODELS=[` |
| Default settings (purchase price, HBU, note rate…) | `src/App.jsx` | `const DEFAULT_SETTINGS=` |
| Color palette | `src/App.jsx` | `const DARK={` and `const LIGHT={` |
| Cover page hero stats | `src/App.jsx` | inside `function CoverPage` — `["$50M","Acquisition Price"]` array |
| What-If page sliders / analysis logic | `src/App.jsx` | `function WhatIfPage` |
| Model page (left col inputs, center charts, right KPIs) | `src/App.jsx` | `{view==="model"&&...}` in App return |
| Settings page | `src/App.jsx` | `function SettingsPage` |

**Everything is in one file: `src/App.jsx`** (~1750 lines). There are no separate component files.

---

## Architecture — 5 Views

```
cover    → landing page: hero stats + model picker (canonical + user presets)
model    → main 3-col layout: inputs | charts | KPIs  ← "Program page" (locked deal params)
whatif   → isolated sandbox: player selector + waterfall + deal param sliders (never affects model)
settings → deal configuration (pushes back to model on save)
scenarios→ saved scenario manager
```

**Critical separation:** `model` page uses App-level state (`purchasePrice`, `hbu`, etc.).  
`whatif` page has its own **isolated copies** (`wiPP`, `wiHbu`, `wiNote`, `wiBuyerTax`).  
Changes on What-If page **never** affect the model. This is intentional.

---

## Storage — localStorage Keys

| Key | Contents |
|---|---|
| `prt:settings:v1` | Project settings object |
| `prt:session:dos-pueblos:v1` | Last model state (auto-saved) |
| `prt:scenarios:dos-pueblos:v1` | User-saved named scenarios |
| `prt:last-model:v1` | ID of last canonical model loaded |
| `prt:user-presets:v1` | What-If presets saved by user |

`window.storage` is **Claude artifact API only** — does not work in deployed apps.
Always use `localStorage` here.

---

## Players + Waterfall — How to Edit

**`const PLAYERS=[]`** (line ~87 in App.jsx, after PHASE_META):  
Each entry has:
- `id`, `icon`, `name`, `role`, `colorHex`, `tier`, `tierLabel`, `tags`
- `position`, `gets`, `puts`, `waterfall` — narrative shown in What-If detail band
- `whatif: { invEquity, agi, agiFactor, irr, taxRate, noiFactor, priorCFwd, purchasePrice, hbu, buyerTax, sellerNote }` — what loads into sliders when user clicks that player tab

**`const WATERFALL_TIERS=[]`** — nine entries, purely display. Edit `label`, `amt`, `note` freely.

The reference copy with full comments lives at `src/players.js` (not imported — it's the edit-and-repaste source of truth).

---

## Canonical Models — How to Add One

In `const CANONICAL_MODELS=[]`, add an entry:
```js
{
  id: "my-scenario",          // unique, used in localStorage
  name: "My Scenario",
  description: "One line description shown on cover page card.",
  badge: "M", badgeColor: "#4A9CC8",
  state: {
    scenario: "mid",          // "low" | "mid" | "high"
    activePhases: {p1:true, p2:false, p3:false},
    activeStreams: Object.fromEntries(STREAM_DEFS.map(s=>[s.id, s.on])),
    purchasePrice: 62e6, hbu: 133e6, buyerTax: 0.37, sellerNote: 22e6,
    occ: 0.65, parcelSale: 2e6,
    unitTypes: {reno:{enabled:false,count:3,rate:250,costPerUnit:100e3}, ...},
  },
}
```

---

## Deploy

Coolify app: `dos-pueblos-model` → https://capital-flows.dev.place.fund
Auto-deploys from `main` branch on GitHub (`LIFEAI/dp-phased-model`).

To push a change:
1. Edit `src/App.jsx`
2. Push to main
3. Coolify deploys automatically via webhook

---

## Known Patterns From Prior Sessions

- **`anyP`** = `Object.values(activePhases).some(Boolean)` — declared in App component body near `const S=settings`. If it disappears, the model page goes blank with `ReferenceError: anyP is not defined`.
- **GitHub SHA** must be current before push — fetch it fresh each session.
- **`C.lemon` / `C.mist`** — these are theme-aware. `lemon` = dark amber tone in dark mode. `mist` = soft gray.
- **Slider bounds**: `min`/`max` in What-If sliders may need widening if deal params change significantly.
- **STREAM_DEFS.map(s=>[s.id, s.on])** — canonical model `activeStreams` pattern. `s.on` is the default enabled state per stream.
