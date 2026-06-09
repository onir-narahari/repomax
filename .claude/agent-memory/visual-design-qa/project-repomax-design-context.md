---
name: project-repomax-design-context
description: RepoMax landing page structure, color system, component map, and brand positioning for visual design QA sessions
metadata:
  type: project
---

RepoMax is a SaaS tool for CS students — paste a GitHub repo URL, receive a Repo Score, resume bullets, README improvements, and recruiter-facing suggestions.

**Core positioning line:** "Recruiters judge your repo in 30 seconds."

**Brand tone:** Practical, sharp, recruiter-aware, student-focused. NOT corporate, vague, or generic AI SaaS.

**Landing page structure (as of 2026-06-09):**
- `app/page.tsx` — root, renders `<LandingHero />` then `<HomePageSections />`
- `components/LandingHero.tsx` — hero section with nav, headline, subheadline, `HeroRepoForm`, `HeroDemoPreview` (before/after panel bleeds below fold)
- `components/hero/HeroRepoForm.tsx` — repo URL input pill (rounded-full, blue border) with clipboard paste button, "Score My Repo" CTA (blue pill), microcopy + "See a real result first →" link
- `components/hero/HeroDemoPreview.tsx` — browser-chrome card showing side-by-side Before/After README (31/100 → 87/100). Static content. No animation. Bleeds below fold via rounded-top/no-bottom-border treatment.
- `components/HeroBackground.tsx` — flat #16161D bg + faint blue radial glow anchored at bottom (108%) + grain noise. NO canvas or contribution grid in current build.
- `components/HomePageSections.tsx` — two sections: (1) 6-card grid "Your repo gets 30 seconds. Here's what's failing it." (red/amber dot cards), (2) final CTA repeat with "See what your repo is hiding."

**Color system (inline Tailwind in components, NOT using --rs- vars in hero):**
- Background: `#16161D` (used inline, not --rs-page-bg #070A12)
- Demo panel bg: `rgba(12,14,8,0.97)`
- CTA button: `bg-[#0066FF]`, hover `bg-[#2979FF]`
- Headline gradient: `from-[#0066FF] to-[#3385FF]` on "losing"
- Text primary: `#F0EDE8` (warm white)
- Text muted: `text-white/50`, `text-white/40`, `text-white/30` (opacity layers)
- Nav badges: `border-white/15`, `text-white/50`
- Cards: `border-white/[0.07]`, `bg-white/[0.03]`

**Font system:**
- `--font-sans: Instrument Sans` (body, nav, CTA)
- `--font-mono: JetBrains Mono` (demo panel code)
- `--font-heading: Fraunces` (NOT used in landing page — heading uses Instrument Sans bold)

**Key visual details (observed 2026-06-09):**
- Hero h1: `text-[3.25rem]` at lg, `font-bold`, `tracking-[-0.03em]`, `leading-[0.88]`
- "losing" word uses blue-to-blue gradient text (subtle — not high contrast)
- Input pill: `rounded-full border border-[#0066FF]/30 bg-white/[0.06]` — border is very faint
- CTA button glow on hover: `hover:shadow-[0_0_28px_rgba(0,102,255,0.45)]`
- Background has NO dominant visual anchor (no product illustration, no network graph currently)
- HeroDemoPreview is the main product visual — bleeds below fold, rounded-top browser chrome
- Demo panel: static (no animation), 300–340px fixed height, font size 11px (very small on desktop)
- Cards in HomePageSections use minimal borders, very low contrast with page bg

**Page issues (observed 2026-06-09):**
- Entire page is same background color #16161D — no section contrast
- No section separators, no color shift between hero and features section
- Hero feels vertically cramped — form, headline, and demo are close
- No score number displayed prominently in hero
- "losing" gradient is blue-on-blue — barely visible as an accent
- Cards in features grid are nearly invisible against background (bg-white/[0.03])
- Final CTA section is text + form repeat with no visual differentiation from rest of page
- Mobile: demo panel content is readable at 390px but very dense; "R" divider badge is visible
- No social proof elements (testimonials, real user count) beyond nav badge "100+ repos scored"

**Why:** This context is needed for all visual design QA sessions to avoid recommending changes that break the brand or require backend changes.

**How to apply:** Always verify current component state before making recommendations — this inventory was accurate as of the session date but may drift as the engineer implements fixes.
