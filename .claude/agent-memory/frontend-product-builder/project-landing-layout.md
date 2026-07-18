---
name: project-landing-layout
description: Homepage assembly and section-by-section structure after the 2026-07 "two products" reframe (Repo Score + daily job matching)
metadata:
  type: project
---

RepoMax's homepage (`app/page.tsx`) assembly, current as of the two-product reframe:

1. `LandingHero` (`components/LandingHero.tsx`) — full `min-h-dvh` hero
2. `HomeReadmeLiveEdit` (`components/HomeReadmeLiveEdit.tsx`) — README/gaps/score demo, now scaled down as a supporting section (not hero-sized)
3. `HomePageSections` (`components/HomePageSections.tsx`) — daily job matching feature section (default export)
4. `TestimonialsCarousel` (named export from the same file)
5. Footer — inline in `app/page.tsx`

**Prior memory in this file (pre-2026-07) is stale and was overwritten** — it described a hero with a paste-link/Connect-GitHub toggle form, a "Cluely-mechanic 85vh hero," and a tabbed Startup-Outreach/Interview-Prep features section. All of that was removed in the reframe below. Always verify against the live file before trusting old memory — this codebase changes fast.

## Product reframe (2026-07-17)

RepoMax dropped Startup Outreach / Interview Prep / Social Post features. It now offers exactly two products:
1. **Repo Score** — paste/connect a GitHub repo → score, gaps, resume bullets, README suggestions.
2. **Daily job matching** — scans a user's 3 most recent GitHub repos, emails 3 matched job postings daily at 12pm.

This drove a full homepage rewrite. See [[project-hero-form]] for the hero/CTA details, [[project-readme-live-edit]] for the scaled-down demo section, and [[project-home-page-sections]] for the new daily-matching section + testimonials.

**How to apply:** If asked to touch the homepage, assume the two-product framing above is current truth unless the code shows otherwise (grep first — this file gets updated whenever the reframe evolves).
