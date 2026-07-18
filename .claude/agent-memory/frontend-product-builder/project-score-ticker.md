---
name: score-ticker-component
description: HeroScoreTicker.tsx exists on disk but is currently unused/unwired — do not assume it's live in the hero
metadata:
  type: project
---

`components/hero/HeroScoreTicker.tsx` (a rotating "recent audits" strip cycling three hardcoded entries every 4s) exists on disk but as of the 2026-07-17 hero rewrite (see [[project-hero-form]]) is **not imported anywhere** — verified via grep, only self-reference. An earlier memory claimed it was wired into `HeroRepoForm.tsx`; that's no longer true (and `HeroRepoForm.tsx` itself is no longer used on the homepage at all).

If reviving this component, note the current hero (`LandingHero.tsx`) has no room for a ticker strip in its current minimal GitHub-only-CTA layout — it would need deliberate placement, e.g. below the subheadline or above the CTA.

**How to apply:** Don't reference this component as "already live" — grep for its import before making claims about current hero behavior. If asked to add social-proof back to the hero, this file is a ready-made starting point, but check its content is still accurate to current design tokens before reusing.
