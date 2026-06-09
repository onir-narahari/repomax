---
name: project-repomax-context
description: RepoMax product context — target user, landing page structure, current component state, and key conversion gaps as of 2026-06-08
metadata:
  type: project
---

RepoMax is a no-auth, no-dashboard tool for CS students and new grads. Visitor pastes a public GitHub URL and gets a Repo Score (0–100 across 6 categories), a ranked fix list, and 3 resume bullets grounded in the actual repo.

**Why:** Students have decent projects but repos look weak — no screenshots, vague README, generic bullets. RepoMax makes strong projects look strong. Core brand line: "Recruiters judge your repo in 30 seconds."

**How to apply:** All suggestions must be practical, recruiter-aware, specific. Avoid generic AI SaaS language. The fear/curiosity/proof emotional triangle is the main conversion driver for this audience.

## Landing page structure (as of 2026-06-08)

### app/page.tsx
Two sections stacked: LandingHero → HomeInteractiveSection. Nothing else.

### LandingHero (components/LandingHero.tsx)
- bg-[#0a1020], two-column grid (left copy + form, right demo card)
- Nav: Wordmark + ReposScoredNavBadge (fetches /api/stats, renders live count — IS NOW IMPORTED in LandingHero)
- Headline: "You have 30 seconds to impress a recruiter. / Test your repo."
- Subheadline: "Your commits deserve more than a GitHub link. Get a Repo Score, feedback, and resume bullets in seconds."
- HeroScoreTicker: rotating 3-entry fake "recent audits" ticker (slug + score badge + verdict)
- HeroRepoForm: URL input + "Paste" clipboard button + "Get your Repo Score" CTA + trust copy
- Trust line: "Free · No account needed · Only reads public repos"
- HeroExampleLink: "See an example repo" → bradtraversy/vanillawebprojects (teaching repo, not a student portfolio)
- HeroProductDemo (right column): animated mock card (fake typing → loading bar → result panel with score ring, 3 category bars, 2 fix items, resume bullet preview)

### HomeInteractiveSection (components/HomeInteractiveSection.tsx)
- bg-[#070a12], border-t
- 3 output cards: Repo Score / Fix list / Resume bullets (icon + title + description)
- 6-category grid showing each scoring category + max pts
- Second CTA: "Try it on your repo" → /#top

## Mock data (lib/score-mock.ts)
- MOCK_REPO_SLUG: 'user/ai-fitness-coach'
- MOCK_SCORE: total 57/100, label 'Weak Signal'
- MOCK_FIXES: 3 specific fixes (screenshot, install steps, README opener)
- MOCK_BULLET_PREVIEW: 'Engineered a full-stack fitness coaching app using React, Express, and the OpenAI API; implemented JWT auth, RESTful endpoints, and a real-time progress dashboard.'
- MOCK_BULLET_COUNT: 3 (card shows "+2 more bullets included")
- EXAMPLE_REPO_URL: bradtraversy/vanillawebprojects

## Key conversion gaps identified

1. **BulletTransformSection never built** — ranked #1 concept from prior session, implementation prompt exists in memory, zero code exists. Highest priority carry-over.
2. No before/after proof anywhere on page — visitor sees a mock card but nothing shows the transformation from bad → good
3. HeroScoreTicker shows fake "recent audits" — adds some social proof but the entries are clearly fake slugs
4. The example repo (bradtraversy/vanillawebprojects) is a multi-project teaching repo, not a single student CS project — poor match for the target user
5. HomeInteractiveSection describes outputs with text cards but never shows the actual output quality
6. No "what your repo might be missing" diagnostic hook to trigger fear/curiosity before the CTA
7. No differentiation between a 40-score repo and an 85-score repo shown on the page

[[top-concept-bullet-transform]]
