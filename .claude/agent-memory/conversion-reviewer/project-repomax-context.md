---
name: project-repomax-context
description: RepoMax product context — target user, core value prop, tone rules, and what the landing page currently does
metadata:
  type: project
---

RepoMax is a no-auth, no-dashboard tool for CS students and new grads. User pastes a public GitHub URL and gets: a Repo Score (out of 100 across 6 categories), a fix list, and 3 resume bullets grounded in their actual repo.

**Why:** Students have decent projects but repos look weak — no screenshots, vague README, generic bullets. RepoMax makes strong projects look strong.

**How to apply:** Any copy/UI suggestion should be practical, recruiter-aware, and specific. Avoid generic AI SaaS language. The core brand line is "Recruiters judge your repo in 30 seconds." — this anchors all urgency framing.

Key landing page structure (as of 2026-06-08, after three conversion fixes):
- LandingHero: headline + subtext + HeroRepoForm (input + CTA) + HeroExampleLink + trust copy + HeroProductDemo (animated mock card)
- HomeInteractiveSection: 3-card output explainer + 6-category grid + second CTA
- Trust copy now in hero: "Free · No account needed · Only reads public repos" (below HeroExampleLink, text-xs, white/35 — low contrast)
- "See an example repo" links to bradtraversy/vanillawebprojects (a real, multi-project teaching repo — better than octocat, but still not a student's solo portfolio repo)
- Hero mock shows repo slug "user/ai-fitness-coach" with score 57/100 — good relatable context
- Hero mock bullet now shows full MOCK_BULLET_PREVIEW text with "+2 more bullets included" label below — bullet is long (one run-on sentence)
- ReposScoredNavBadge and SiteNav exist in components but are NOT imported anywhere in landing or generate pages — the live count badge is a dead component on landing
- The landing page nav (in LandingHero.tsx) is a bare wordmark only — no badge, no nav links
- Footer of generate page: "Only reads public repos. No data is stored."
- MOCK_BULLET_COUNT = 3, but label says "+2 more bullets included" (3-1=2, correct math)
