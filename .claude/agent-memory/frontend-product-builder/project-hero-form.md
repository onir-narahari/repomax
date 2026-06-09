---
name: project-hero-form
description: HeroRepoForm structure — unified pill input row, example link placement, what was removed
metadata:
  type: project
---

The hero input form (`components/hero/HeroRepoForm.tsx`) uses a single unified pill row: clipboard icon + URL input + submit button fused in one `rounded-full border border-white/10 bg-white/5 p-1.5 flex` container. No separate label above the input ("GITHUB REPO" label was removed). No separate Paste button above the input.

The "See an example repo" secondary button (`components/hero/HeroExampleLink.tsx`) was removed from `LandingHero.tsx`. Its navigation behavior (`router.push(buildGenerateHref(EXAMPLE_REPO_URL))`) was preserved as a small inline text link "or try an example →" in the trust line row below the pill, styled as `text-white/40 hover:text-white/60` with no button chrome.

`HeroExampleLink.tsx` still exists on disk but is no longer imported anywhere.

**Why:** Removing the secondary button eliminated a micro-decision competing with the primary CTA. The escape hatch was kept as a low-friction inline hint.

**How to apply:** If asked to add back a secondary CTA or modify the example link behavior, the existing inline link in `HeroRepoForm.tsx` is the place to edit — do not re-add `HeroExampleLink` to `LandingHero.tsx`.
