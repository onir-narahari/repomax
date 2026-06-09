---
name: project-landing-layout
description: Landing page layout — 90vh hero with aurora background, product peek card bleeding into demo section, no divider
metadata:
  type: project
---

The landing page (`app/page.tsx`) is composed of two sections that feel continuous — no hard dividing line.

**Hero section** (`LandingHero.tsx`):
- `min-h-[90vh]` — updated from 85vh to accommodate product peek card bleed
- `overflow-visible` — required so the product peek card can bleed below the hero boundary
- `bg-[#0a1020]` background (HeroBackground renders over this)
- `max-w-5xl` centered content column
- Headline: "Make your repo / as strong as your code." — two `<span className="block">` lines at `text-[2.75rem] sm:text-[4rem] lg:text-[6.5rem]`, `leading-[0.92] tracking-[-0.03em]`
- Sub-copy: "Paste your GitHub repo. Get a Repo Score, specific gaps, and resume bullets — based on what's actually in your code."
- Content div padding: `pt-24 pb-56 sm:pt-28 sm:pb-64 lg:pt-32 lg:pb-72` (tall bottom padding to keep content above the card)
- Nav: wordmark left + "Free — no account needed" badge right
- No bounce arrow (removed in favor of product peek card)
- Stat pills row below form: 3 `rounded-full border border-white/10` spans

**Product peek card** (static, inside `LandingHero.tsx`):
- `absolute bottom-0 left-1/2 z-20 -translate-x-1/2 translate-y-[40%]`
- `hidden sm:block` — hidden on mobile, visible sm+
- `max-w-2xl`, glass-morphism card: `bg-[#0d1530]/90 backdrop-blur-md border border-white/10 rounded-2xl`
- Header: blue score badge `64/100` + `alexchen/portfolio-site` mono slug + amber "Needs work" pill
- Two gap items with colored dots (red = no demo link, amber = missing install instructions)
- Resume bullet preview section at bottom
- Creates Cluely-style "product peeking from hero" depth effect

**HeroBackground** (`HeroBackground.tsx`):
- Replaced contribution grid with layered CSS gradient aurora scene
- Base: `bg-[#060a18]` deep navy
- Aurora horizon: blue elliptical radial gradient rising from `50% 105%`
- Left/right depth accents: indigo/blue radial gradients at bottom corners
- Top fade (h-32) for nav readability; bottom fade (h-48) to blend into product peek
- No canvas elements, no imported sub-components — pure CSS gradients

**HomePageSections** (`HomePageSections.tsx`) — 4 sections, all `bg-[#060a18]`:
1. `WhatRepoMaxCatches` — `pt-[320px] sm:pt-[360px]` to clear the HeroDemoPreview card bleed. "Most repos fail the 30-second scan." headline. 2×3 grid of dark diagnostic cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`), each with colored dot (red/amber), bold label, 1-sentence body. Uses `whileInView` scroll-triggered motion.
2. `HowItWorks` — `py-24 sm:py-32`. "How it works" mono label. 3 numbered step cards (`grid-cols-1 sm:grid-cols-3`), step number in mono 0x format, bold label, short body. Hover state on each card.
3. `RecruiterReality` — `py-24 sm:py-32`. "Recruiters don't run your code." headline. Single wide card (`max-w-3xl`) with two-column table layout: "What they check" (left, white/60) vs "If it's missing" (right, red/60 italic). 5 rows staggered-in with `whileInView`. Closing line: "RepoMax fixes all of this."
4. `FinalCTA` — `py-32 sm:py-40`. Blue radial glow aurora. "Test your repo before recruiters do." bold headline, sub-copy, `HeroRepoForm` centered at `max-w-[420px]`.

**HeroDemoPreview** (static side-by-side, no animation):
- Left panel: "Before RepoMax" red header, score 31/100, vague README content, 4 gap items
- Right panel: "After RepoMax" green header, score 87/100, improved README, tech badges, resume bullet
- Center "R" medallion at 50% vertical
- Glow div uses `inset-x-0` (NOT `-inset-x-8`) to prevent mobile horizontal overflow
- Right spacer in title bar is `hidden sm:block` to prevent mobile overflow

**CTA button text**: "Score My Repo" (updated from "See what a recruiter sees")

**Why:** Redesigned to match Cluely.com premium feel — dimensional layered hero with product visible before user scrolls.

**How to apply:** Do not re-introduce `border-t` between hero and demo. Do not revert to `overflow-hidden` on the section or the card will be clipped. Do not revert `min-h` to 85vh without also removing the peek card. Do not re-add the bounce arrow. The demo section is `HomeReadmeDemo`, not `HomeInteractiveSection`.

Related: [[project-hero-form]], [[project-score-ticker]]
