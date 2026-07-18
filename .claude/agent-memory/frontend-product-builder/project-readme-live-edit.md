---
name: project-readme-live-edit
description: HomeReadmeLiveEdit section — same demo mechanics as before, but scaled down (~0.78x) as a supporting section with a new heading, not a hero-sized centerpiece
metadata:
  type: project
---

`components/HomeReadmeLiveEdit.tsx` sits between `<LandingHero />` and `<HomePageSections />` in `app/page.tsx`. As of the 2026-07-17 reframe it carries a new section heading — "See your repo the way recruiters do." — rendered above the demo, wrapped in `sectionMax`/`sectionX` from `lib/landing-layout.ts` (this file now imports `cn` and those two tokens; it didn't before).

**All demo mechanics are unchanged**: GitHub-chrome README mock, IntersectionObserver-triggered score animation (0→64 via rAF ease-out over 900ms), 4-card overlay (Gaps Flagged / Score+category breakdown / What we found / CTA) on desktop, stacked simplified cards on mobile.

**What changed is purely sizing** — every constant and font-size literal was scaled down by roughly 0.78x so the section reads as a supporting proof point rather than a second hero:
- `STAGE_W` 1320→1056, `README_W` 780→624, `CARD_W` 248→200, `WIDE_CARD_W` 264→212, `CTA_CARD_W` 288→230
- `ScoreRing` call sites: desktop 136→108, mobile 80→64
- All `text-[Npx]` literals throughout `GitHubChrome`, `ReadmeDoc`, and the four overlay cards scaled down proportionally (e.g. 17px→14px, 16px→13px, 13px→11px, 9px→8px floor)
- Section overlap margin trimmed slightly: `-mt-24/-28/-32` → `-mt-20/-24/-28`, `pb-10/12` → `pb-8/10`

There's a pre-existing unused variable `gradeColor` (destructured from `grade(displayScore)` but never read) — this predates the reframe, not a regression from this pass, left as-is.

**Color pass (same day, later)**: the section's outer bg went `#131929` → near-black `#0A0A0F`, and the two cyan (`#38D9FF`) CTA buttons ("See my full breakdown →", mobile "Score my repo →") went pink (`#EC4899`, hover `#F472B6`, `text-white` instead of `text-[#07111F]`). Score-grade colors (WEAK/FAIR/GOOD/STRONG ring + label) and the red "Find your repo's gaps →" warning CTA are semantic, not brand accent — untouched. See [[project-hero-form]] for the full site color-scheme rationale.

**Why:** The plan explicitly called for "scale down proportionally" rather than a content/logic rewrite, to keep this as a supporting section under the new oversized hero (see [[project-hero-form]]) instead of competing with it for visual weight.

**How to apply:** If asked to resize this section again, scale all the literals together (font sizes, the five width constants, ScoreRing sizes, paddings/gaps) rather than adjusting just one — they were tuned as a set to keep the four overlay cards clearing the README document's edges by ~16-22px.

Related: [[project-landing-layout]], [[project-hero-form]]
