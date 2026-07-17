---
name: project-home-page-sections
description: HomePageSections.tsx post-reframe — full replace of the tabbed Startup-Outreach/Interview-Prep demo with a single "daily job matching" section; TestimonialsCarousel kept, copy replaced
metadata:
  type: project
---

`components/HomePageSections.tsx` was fully rewritten on 2026-07-17 as part of the two-product reframe (see [[project-landing-layout]]). The entire old tabbed-simulation system (typewriter effect, `useSimulationTimeline`, `SimulationCard`/`RepoUrlRow`/`SimulationColumns`, `StartupOutreachSimulation`, `InterviewPrepSimulation`, `FeatureTabs`, the `FEATURES` array) is gone — none of it was referenced anywhere else in the codebase (verified via grep before deleting), so it was safe to remove outright rather than deprecate in place.

**New default export (`HomePageSections`)**: a two-column "Find roles that are tailored to you" section.
- Left: `sectionLabel` eyebrow ("Daily job matching"), h2 headline, then a 3-item bullet list (`BULLETS` const) directly under the headline — **no supporting paragraph**. An explanatory paragraph existed briefly but the user explicitly said to cut it ("take this shit away") and make the bullets themselves carry the explanation, tightly. Current bullets (mechanism-first, in this order): "Matches 3 open roles to your GitHub" → "Delivered to your inbox every day at noon" → "700+ companies tracked, refreshed daily". If asked to touch this copy again, keep that mechanism-first ordering — the user's stated bar is "just make it clear what it does," not scene-setting prose.
- Right: `TodaysMatchCard` — a `landingSurface`-styled card with a "Today's Match" mono header and 3 rows (`MATCHES` const: company, role, location, match score 0-100). Company names (Vercel, Datadog, Ramp) intentionally match the ghost fragments in the hero's `HeroUiCollage` (see [[project-hero-form]]) for cross-page cohesion — if one changes, consider updating the other. Match score color is the site's pink accent (`#EC4899`), not the old cyan.
- Section wrapper reuses `featuresSectionBg`/`featuresSectionBorder`/`sectionYCompact`/`sectionMax`/`sectionX` from `lib/landing-layout.ts` — same tokens the old tabbed section used, so the visual rhythm with adjacent sections didn't change even though the content did.

**`TestimonialsCarousel` (named export, same file)**: copy content unchanged from the initial rewrite (3 quotes, `feature: 'Repo Score'` x2 / `'Daily Job Match'` x1, concrete-but-individual anecdotal detail like a score going from 54→89 rather than invented aggregate stats). Visual treatment was redone in the resumax-matching color/style pass: feature-label dot and text now pink (`#EC4899`) instead of cyan; arrow-button hover color pink; and — the one structural change — bottom pagination was replaced. It used to be a row of small pill/dot buttons; it's now a resumax-style "01 —●——— 03" layout: a muted mono "01" and "03" flanking a row of thin segments (`h-[2px]`, active segment `w-8 bg-[#EC4899]`, inactive `w-4 bg-white/15`). This was a direct visual reference from screenshotting resumax.ai's own testimonial section (see [[project-hero-form]] for why WebFetch's text summary wasn't trusted for this — used Playwright screenshots instead).

`lib/landing-layout.ts`'s exported `FeatureKey` type (`'outreach' | 'interview'`) is now dead — nothing imports it anymore post-rewrite. Left in place since removing it wasn't in scope and it's harmless.

**Why:** Startup Outreach / Interview Prep / Social Post no longer exist as product features; the tabbed demo built around them had to go entirely rather than be patched. The later copy trim and color/pagination rework were direct user feedback passes on top of that rewrite, not a separate initiative.

**How to apply:** Treat the old simulation-primitive code as gone for good — don't try to resurrect `useTypewriter`/`SimulationCard` patterns from git history for new sections without checking they still make sense for the current two-product framing. For copy in this section specifically, default to short/mechanism-first bullets over paragraphs unless told otherwise.

Related: [[project-landing-layout]], [[project-hero-form]], [[project-readme-live-edit]]
