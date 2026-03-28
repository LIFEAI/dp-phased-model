// =============================================================================
// PLAYERS.JS — Dos Pueblos Ranch Deal Parties
// =============================================================================
// EDIT THIS FILE to update player profiles, waterfall positions, or What-If
// defaults. This is the ONLY place you need to touch for player data.
//
// Each player has two sections:
//   - display: name, role, icon, tags, gets/puts/waterfall/position narrative
//   - whatif:  pre-loaded slider values for the What-If Analysis page
//
// WhatIf params that are null will use the What-If page's own defaults.
// Colors reference the app palette (C.*) but are stored as hex here so this
// file has zero imports and can be edited without loading the app.
//
// WATERFALL ORDER: tier property controls sort order in the waterfall strip.
// Non-financial players (Chumash, Stewardship) have tier:null.
// =============================================================================

export const PLAYERS = [
  // ── ROGER & ROBIN HIMOVITZ ─────────────────────────────────────────────────
  {
    id: "roger",
    icon: "🏡",
    name: "Roger & Robin Himovitz",
    role: "Seller / Conservation Sponsor",
    colorHex: "#C9A84C",          // C.gold
    tier: null,                   // paid at close, not a waterfall participant
    tierLabel: "At Close",
    tags: ["At Close", "Conservation Sponsor", "Installment Sale §453"],

    // Narrative — shown in expandable card
    position: "Exits with full consideration. Conservation legacy preserved.",
    gets: "~$49–50M total — $22M assumed debt relief + $20–25M investor cash at close + $2–3M carry-back note (IRC §453 installment sale). Roger's all-in basis ~$50–55M; structure delivers parity while permanently protecting the coast.",
    puts: "219 acres · 18 parcels · Gaviota Coast · $22M existing IO note · relationships with Chumash nations · Dos Pueblos Institute 501(c)(3)",
    waterfall: "Seller — paid at close. Not a waterfall participant post-close.",

    // What-If Analysis defaults — Roger's perspective: seller carry-back note analysis
    // He cares about: net proceeds, installment sale tax treatment, carry-back note yield
    whatif: {
      label: "Seller — §453 Installment Sale Analysis",
      description: "Roger's net proceeds after note assumption, carry-back, and capital gains at §453 installment rate.",
      invEquity: 22e6,            // his carry-back note principal
      agi: 8e6,                   // seller's estimated AGI (§453 spread over years)
      agiFactor: 0.60,
      irr: 0.035,                 // carry-back note rate 3.5%
      taxRate: 0.40,              // seller's blended fed+CA (ltcg + niit)
      noiFactor: 1.0,
      priorCFwd: 0,
      // Deal params — Roger's view: what does he net at different prices?
      purchasePrice: 62e6,
      hbu: 133e6,
      buyerTax: 0.37,
      sellerNote: 22e6,
    },
  },

  // ── INCOME TRUST ───────────────────────────────────────────────────────────
  {
    id: "trust",
    icon: "🏦",
    name: "Income Trust",
    role: "Senior Lender — Existing $22M First Mortgage",
    colorHex: "#D96845",          // C.coral
    tier: 1,
    tierLabel: "Tier 1",
    tags: ["Tier 1", "5% IO", "Note Assumption", "Senior Debt"],

    position: "Tier 1 — paid first, always, every year.",
    gets: "$1,100,000/yr interest-only at 5% on $22M balance. Note assumed by new PBC at close. Trust receives same IO stream with no disruption — preferred outcome over payoff.",
    puts: "$22M already deployed. No new capital required.",
    waterfall: "Tier 1 — senior to all equity. Pre-condition of every other distribution. Non-negotiable.",

    // What-If defaults — trust's perspective: can the deal service the note?
    whatif: {
      label: "Senior Lender — Debt Service Coverage",
      description: "Can the operating NOI always cover the $1.1M/yr IO obligation? Stress-test coverage ratio.",
      invEquity: 22e6,            // note principal
      agi: 22e6,                  // n/a for trust — set high so no AGI cap
      agiFactor: 1.0,
      irr: 0.05,                  // note rate — trust's required yield
      taxRate: 0.37,
      noiFactor: 0.70,            // stress-test at 70% of base NOI
      priorCFwd: 0,
      purchasePrice: 62e6,
      hbu: 133e6,
      buyerTax: 0.37,
      sellerNote: 22e6,
    },
  },

  // ── ANCHOR INVESTOR ────────────────────────────────────────────────────────
  {
    id: "investor",
    icon: "💎",
    name: "Anchor Investor",
    role: "Founding Equity — 60% PBC Units",
    colorHex: "#4A9CC8",          // C.sky
    tier: 6,
    tierLabel: "Tier 6–7",
    tags: ["Tier 6–7", "60% PBC", "12% Blended IRR", "§170(h)", "Senior to Community"],

    position: "Tier 6–7 — senior to community. Blended 12% IRR; tax savings credited first.",
    gets: "$57–59M in IRC §170(h) conservation easement tax savings over 16 years (at ~50% combined CA+Fed rate) + 60% of PBC NAV growth ($27–33M investor share at Year 7) + full 1× return of capital + 12% IRR cash distributions from Year 8+. Net cost of ownership negative before a single dollar of operations.",
    puts: "$20–25M equity at close. Must have California AGI sufficient to absorb ~$5–7M in deductions/year. Must hold title individually or as grantor trust (not LLC/irrevocable trust) for §170(h) qualification.",
    waterfall: "Tier 6 — blended 12% IRR (tax savings credited first; zero cash draw from PBC Years 1–7). Tier 7 — full 1× return of capital before community preferred begins.",

    // What-If defaults — investor's core analysis view
    whatif: {
      label: "Anchor Investor — §170(h) Tax + IRR Analysis",
      description: "16-year blended return: conservation easement tax savings (Tiers 1–5 already deducted) + Year 8+ cash distributions.",
      invEquity: 22e6,            // $20–25M range; 22M is base
      agi: 12e6,                  // high-net-worth CA investor AGI
      agiFactor: 0.60,            // standard §170(h) AGI cap
      irr: 0.12,                  // target blended IRR
      taxRate: 0.503,             // ~50.3% fed (37%) + CA (13.3%)
      noiFactor: 1.0,
      priorCFwd: 0,
      purchasePrice: 62e6,
      hbu: 133e6,
      buyerTax: 0.37,
      sellerNote: 22e6,
    },
  },

  // ── COMMUNITY MEMBERS ──────────────────────────────────────────────────────
  {
    id: "community",
    icon: "🤝",
    name: "Community Members (~200)",
    role: "Community Capital — 20% PBC Units",
    colorHex: "#8A7EC8",          // C.lavender
    tier: 8,
    tierLabel: "Tier 8",
    tags: ["Tier 8", "$50K/unit", "1.67× Preferred", "§170(b)", "Subordinated"],

    position: "Tier 8 — subordinated to investor. 1.67× preferred return on equity component.",
    gets: "$10,060 in immediate Year 1 tax savings per member ($20K charitable component × ~50% rate). 1.67× preferred return on $30K equity = $50K/unit returned before residual distributions. Service credits (glamping nights, farm tours, cultural programs). Ongoing 20% residual distributions post-preferred.",
    puts: "$50,000/unit — split $30K equity (PBC units) + $20K charitable contribution (Stewardship Trust, non-refundable, qualifies as IRC §170(b) deduction).",
    waterfall: "Tier 8 — subordinated to Tiers 1–7. Begins after investor full 1× + IRR satisfied (~Year 7–9). $10M total preferred pool across 200 members.",

    // What-If defaults — single community member's $50K unit analysis
    whatif: {
      label: "Community Member — $50K Unit Analysis",
      description: "Single unit: $10K immediate §170(b) tax savings + 1.67× preferred return on $30K equity component over hold period.",
      invEquity: 30e3,            // equity component of one $50K unit (not the $20K charitable)
      agi: 250e3,                 // typical community member AGI
      agiFactor: 0.60,
      irr: 0.08,                  // subordinated — lower IRR expectation
      taxRate: 0.45,              // combined fed+CA for $250K earner
      noiFactor: 1.0,
      priorCFwd: 0,
      purchasePrice: 62e6,
      hbu: 133e6,
      buyerTax: 0.37,
      sellerNote: 22e6,
    },
  },

  // ── CHUMASH NATIONS ────────────────────────────────────────────────────────
  {
    id: "chumash",
    icon: "🏺",
    name: "Chumash Nations",
    role: "Cultural Commons — Multi-Tribal Co-Management",
    colorHex: "#7BAE7F",          // C.sage
    tier: null,                   // co-sovereign — not a financial waterfall participant
    tierLabel: "Co-Sovereign",
    tags: ["Co-Sovereign", "Cultural Commons", "TEK", "Irrevocable", "PRT Covenant"],

    position: "Co-sovereign. Not a financial investor. Governance rights run with the land in perpetuity.",
    gets: "Return of Mikiw and Kuyamu village sites (BIA Land Buy-Back / CA tribal grants, Year 1–2). Irrevocable co-management rights over cultural zones. Chumash Cultural Commons governance seats. Revenue share from Chumash Kitchen, cultural programs, NOAA sanctuary grants. TEK documentation program. Marine interface access.",
    puts: "Co-management expertise · Traditional Ecological Knowledge · Cultural authority and legitimacy that no buyer can purchase or replicate.",
    waterfall: "PRT Covenant recipient — 5% of gross PBC revenue flows to Stewardship Trust, which funds cultural programs. Governance rights are not subordinated to any financial tier.",

    // What-If defaults — cultural revenue streams model
    // Chumash perspective: what does the cultural programming generate?
    whatif: {
      label: "Cultural Commons — Revenue Contribution Analysis",
      description: "Cultural Kitchen + NOAA grants + TEK programs — contribution to PBC NOI over 16 years.",
      invEquity: 4e6,             // grants + contributions at close (BIA + tribal)
      agi: 2e6,                   // tribal grant income (non-taxable but modeled for comparison)
      agiFactor: 1.0,
      irr: 0.05,                  // cultural capital — not financial return, but modeled
      taxRate: 0.00,              // tribal entities exempt
      noiFactor: 1.0,
      priorCFwd: 0,
      purchasePrice: 62e6,
      hbu: 133e6,
      buyerTax: 0.37,
      sellerNote: 22e6,
    },
  },

  // ── RDC + REGENESIS ────────────────────────────────────────────────────────
  {
    id: "rdc",
    icon: "⚙️",
    name: "RDC + Regenesis Group",
    role: "Deal Architect · Manager · Consultant",
    colorHex: "#E8A030",          // C.amber
    tier: 3,
    tierLabel: "Tier 3 + 9",
    tags: ["Tier 3", "Tier 9", "20% Promote", "20% Equity", "Back-Loaded", "Deal Architect"],

    position: "Tier 3 (management fee, operating priority) + Tier 9 (promote and equity, back-loaded).",
    gets: "$20K retainer at signing + $500K Transaction Completion Advisory Fee at close + $500K/yr management fee (Years 1–7, stepping down to $350K/yr and $250K/yr at stabilization gates) + 4% development fee on new capital projects ($250K minimum) + 20% carried interest (promote) above hurdle + 20% PBC founding equity on sale. Total estimated economics: $2–6M over 8-year hold, back-loaded.",
    puts: "All work product — financial models, Triple Play structure, conservation easement design, Five Capitals framework, community raise architecture, PRT governance, this application. 7-year management commitment post-close.",
    waterfall: "Tier 3 (management fee — operating priority, pre-equity). Tier 9 (promote + 20% equity residual — earned only after investor and community are whole).",

    // What-If defaults — RDC economics model
    whatif: {
      label: "RDC — Management Fee + Promote Economics",
      description: "$500K/yr fee (Tier 3) + 20% promote after investor/community whole (Tier 9). NOI coverage test.",
      invEquity: 500e3,           // annual management fee as proxy capital commitment
      agi: 3e6,                   // RDC operating income
      agiFactor: 0.60,
      irr: 0.20,                  // promote target — back-loaded
      taxRate: 0.42,              // CA pass-through entity rate
      noiFactor: 1.0,
      priorCFwd: 0,
      purchasePrice: 62e6,
      hbu: 133e6,
      buyerTax: 0.37,
      sellerNote: 22e6,
    },
  },

  // ── STEWARDSHIP TRUST ──────────────────────────────────────────────────────
  {
    id: "stewardship",
    icon: "🌿",
    name: "Stewardship Trust (501c3)",
    role: "Land Sovereign · Conservation Easement Holder",
    colorHex: "#29AFA0",          // C.teal
    tier: 5,
    tierLabel: "Tier 5",
    tags: ["Tier 5", "501(c)(3)", "PRT Covenant", "Conservation Easement", "Land Sovereign"],

    position: "PRT Covenant recipient. Holds fee title. Issues conservation easement to LTSBC. Non-financial party — mission holder.",
    gets: "$4–5M from community charitable contributions at close ($20K × 200 members). 5% of gross PBC revenue annually (PRT Covenant — non-waivable). Holds perpetual conservation easement and fee title. Governs via Five Capitals readiness gates.",
    puts: "Conservation easement to Land Trust for Santa Barbara County (LTSBC). Governance covenants. Mission accountability.",
    waterfall: "Tier 5 — 5% PRT Covenant on gross revenue. Paid before any equity distributions. Funded at close from community raise charitable component.",

    // What-If defaults — trust's 5% covenant stream analysis
    whatif: {
      label: "Stewardship Trust — 5% PRT Covenant Stream",
      description: "Annual 5% gross revenue covenant to trust — 16-year cumulative conservation funding analysis.",
      invEquity: 4e6,             // charitable contributions at close
      agi: 4e6,                   // annual 5% covenant income at scale
      agiFactor: 1.0,             // 501c3 — no AGI cap
      irr: 0.05,                  // mission yield — not financial
      taxRate: 0.00,              // 501(c)(3) exempt
      noiFactor: 1.0,
      priorCFwd: 0,
      purchasePrice: 62e6,
      hbu: 133e6,
      buyerTax: 0.37,
      sellerNote: 22e6,
    },
  },
];

// =============================================================================
// WATERFALL STRIP DATA
// Edit tiers here to change the waterfall display on the What-If page.
// =============================================================================
export const WATERFALL_TIERS = [
  { tier: "1", label: "$22M Income Trust — Note IO",       amt: "$1.1M/yr",   colorHex: "#D96845", note: "Senior debt · 5% IO · paid first always" },
  { tier: "2", label: "Senior Conservation Loan (if any)", amt: "Scenario A",  colorHex: "#555555", note: "Scenario C carries no new senior debt" },
  { tier: "3", label: "RDC Management Fee",                amt: "$500K/yr",   colorHex: "#E8A030", note: "Operating priority · pre-equity" },
  { tier: "4", label: "Roger Carry-Back Interest",         amt: "$88K/yr",    colorHex: "#C9A84C", note: "3.5% IO · retired Year 1–2 from Chumash parcel sale" },
  { tier: "5", label: "Stewardship Trust — PRT Covenant",  amt: "5% gross",   colorHex: "#29AFA0", note: "Non-waivable · funds conservation + cultural programs" },
  { tier: "6", label: "Investor — Blended 12% IRR",        amt: "~$0 Yr 1–7", colorHex: "#4A9CC8", note: "Tax savings credited first · zero cash draw Years 1–7" },
  { tier: "7", label: "Investor — Return of Capital",      amt: "$20–25M",    colorHex: "#4A9CC8", note: "Full 1× before community preferred begins" },
  { tier: "8", label: "Community — 1.67× Preferred",       amt: "$50K/unit",  colorHex: "#8A7EC8", note: "200 members · subordinated to Tiers 6–7 · ~Year 7–9" },
  { tier: "9", label: "RDC Promote + Residual 60/20/20",   amt: "20% then ÷", colorHex: "#E8A030", note: "After community preferred · Inv 60% / Comm 20% / RDC 20%" },
];
