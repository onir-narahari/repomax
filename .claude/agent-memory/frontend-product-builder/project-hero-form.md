---
name: project-hero-form
description: Current hero (LandingHero.tsx) — left-aligned, near-black bg, pink accent, dense ghosted product-UI collage. Directly modeled on resumax.ai's hero at the user's explicit request. Supersedes all prior hero designs including an earlier centered/cyan version from the same day.
metadata:
  type: project
---

As of 2026-07-17, `LandingHero.tsx` went through **three** design passes in one session — worth knowing so you don't reuse a stale intermediate version:
1. Original: `HeroRepoForm.tsx` pill input + toggle (paste-link vs. connect-GitHub), centered, navy/cyan.
2. First rewrite: GitHub-only CTA, still centered, still navy(#131929)/cyan(#38D9FF)/red-400 — user rejected this as looking bad.
3. Second rewrite: centered but huge type scale + `HeroUiCollage` ghost background — still navy/cyan, still centered.
4. **Final (current)**: user explicitly said to copy resumax.ai's actual visual treatment and to stop looking like "AI slop." Screenshotted resumax.ai directly via Playwright (WebFetch's text summary of it was unreliable/wrong about bg color — always screenshot a reference site rather than trusting a text-based fetch summary for visual details). Rebuilt hero to match: **left-aligned** (not centered), near-black bg, dense ghosted UI-collage background, one accent color used for one headline word + all primary CTAs.

**Current structure:**
- Layout: left-aligned. Nav and hero body share the same `mx-auto max-w-7xl px-6 sm:px-8 lg:px-12` wrapper so the hero text's left edge lines up with the wordmark. Text column capped at `max-w-3xl`. Vertically the content sits in a `flex-1 justify-center` column with `pb-20 sm:pb-28` to bias the visual center slightly upward (same technique as the original pre-rewrite hero).
- Headline: `text-[2.5rem] sm:text-[3.25rem] lg:text-[4.25rem] xl:text-[5rem]`, `tracking-[-0.03em] leading-[0.95]`. Copy stayed RepoMax's own ("Make your GitHub / get you hired.") rather than literally cloning resumax's tagline text — only the visual treatment (scale, weight, one accent word) was copied, not the words themselves.
- Subheadline: one sentence, `text-[#A0A5B0]`, `max-w-lg`, left-aligned under the headline.
- CTA: `components/hero/HeroGithubCta.tsx`, `size="lg"`, positioned directly under the subheadline (left-aligned, not centered). Now includes a trailing `ArrowRight` icon (lucide-react) to match resumax's "Start free →" convention.
- Background: `components/hero/HeroUiCollage.tsx` — expanded to ~26 fragments (was ~18) for resumax-level density, spread edge-to-edge including behind/near the nav. `HeroBackground.tsx` dropped the old purple/cyan radial-gradient blooms entirely (that gradient-blob treatment was part of what read as "AI slop") — now just flat near-black + collage + top/bottom fade + subtle noise grain.

**Color scheme (site-wide token change, not just hero)** — see `lib/landing-layout.ts`:
- `navyBase` / section backgrounds: `#131929` family → near-black `#0A0A0F` / `#0D0D12` / `#08080B` / `#050506` ladder.
- `landingAccent` and every CTA/link accent: cyan `#38D9FF` → pink `#EC4899` (hover `#F472B6`).
- Borders/dividers: `#3d4a66`-style navy borders → `border-white/[0.06-0.08]`.
- This was a deliberate reversal of an earlier note ("don't invent a new brand color like pink") — the user's later, more explicit message ("fully change the colors entirely... looks like AI slop... copy resumax.ai exactly") overrides that earlier constraint. If a future instruction references "the cyan CTA" or "#38D9FF," check the file first — it's gone from all landing-page files.
- **Scope boundary**: this color change was applied to landing-page-only files (`LandingHero.tsx`, `HeroBackground.tsx`, `HeroUiCollage.tsx`, `HeroGithubCta.tsx`, `HomeReadmeLiveEdit.tsx`, `HomePageSections.tsx`, `app/page.tsx`, `lib/landing-layout.ts`). Cyan (`#38D9FF`) and navy (`#131929`) are still used throughout the rest of the app (`/generate`, `/profile`, `/privacy`, `/terms`, `OutputTabs`, `RepoScoreCard`, `ErrorBanner`, etc.) — those were intentionally left alone as out of scope for a landing-page conversion pass. `ProfileButton.tsx` was also left alone — it already uses its own separate near-black palette (`#0D111C` dropdown, green `#22C55E` avatar accent) that was never part of the cyan/navy landing scheme, so it happens to already fit.
- Score-grade colors in `HomeReadmeLiveEdit.tsx` (WEAK=red, FAIR=amber, GOOD=blue, STRONG=emerald) are semantic, not brand accent — left unchanged.

`components/hero/HeroRepoForm.tsx`, `HeroExampleLink.tsx`, and `ContributionGrid.tsx` remain unused on disk (see [[score-ticker-component]] for the similarly-unused `HeroScoreTicker.tsx`).

**Why:** Direct, repeated user feedback that centered-hero + navy/cyan read as generic/flat "AI slop." A live screenshot of resumax.ai (the named reference) showed a left-aligned, near-black, single-accent-color, dense-ghost-collage hero — that became the template.

**How to apply:** Treat this as current ground truth for the hero and its color system. If the hero needs to change again, re-screenshot the current live page first (things moved fast this session) rather than trusting this memory's exact pixel values blindly — verify hex codes against the actual files.

Related: [[project-landing-layout]], [[project-readme-live-edit]], [[project-home-page-sections]], [[score-ticker-component]]
