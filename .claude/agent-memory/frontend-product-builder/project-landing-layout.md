---
name: project-landing-layout
description: Landing page layout — full-height hero (no demo card), GitHub README live-edit section, diagnostic cards section with bottom CTA
metadata:
  type: project
---

The landing page (`app/page.tsx`) is composed of three sections:

1. `LandingHero` — full-height hero
2. `HomeReadmeLiveEdit` — GitHub README document with cycling annotations
3. `HomePageSections` — diagnostic cards + bottom CTA

**Hero section** (`LandingHero.tsx`):
- `min-h-dvh flex-col overflow-visible bg-[#131929]`
- **No HeroDemoPreview** — removed. Hero ends after the form CTA. `heroOverlap` is NOT imported or used.
- Content: wordmark nav + headline ("Your repo is losing you interviews.") + subtext + `HeroRepoForm`
- Headline: two `<span>` lines, `text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem]`, `leading-[0.88] tracking-[-0.03em]`
- Nav: wordmark left + `ReposScoredNavBadge` + "Free — no account needed" badge right
- No stat pills, no bounce arrow, no product peek card

**HomeReadmeLiveEdit** (`components/HomeReadmeLiveEdit.tsx`):
- `bg-[#131929] border-t border-[#303A55] py-20 sm:py-28`
- Full GitHub-styled README document (white bg) with real GitHub chrome
- See [[project-readme-live-edit]] for complete details

**HomePageSections** (`components/HomePageSections.tsx`):
- `bg-[#202941] border-t border-[#303A55] pt-20 pb-20 sm:pt-24 sm:pb-28`
- `pt-20 sm:pt-24` (no hero overlap pad needed — HeroDemoPreview is gone)
- 2×3 grid of diagnostic cards + radial glow final CTA with second `HeroRepoForm`

**HeroBackground** (`HeroBackground.tsx`):
- Dark base `bg-[#131929]`
- Layered CSS gradient aurora: purple ellipse from bottom, left/right depth accents, top fade, noise texture overlay
- No canvas, no imported sub-components

**CTA button text**: "Score My Repo"

**Why:** HeroDemoPreview (before/after split card) removed to eliminate the hero overlap complexity and replace with a more impactful full-document GitHub README section.

**How to apply:** Do not re-add `heroOverlap` to `LandingHero`. Do not re-add `heroOverlapPad` to `HomeReadmeLiveEdit`. The `HomePageSections` padding is `pt-20 sm:pt-24` because there's no card bleed-down anymore.

Related: [[project-hero-form]], [[project-score-ticker]], [[project-readme-live-edit]]
