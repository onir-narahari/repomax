---
name: top-concept-bullet-transform
description: Highest-priority conversion concept for RepoMax landing page — the Before/After Resume Bullet Transformer section
metadata:
  type: conversion-concept
  session-date: 2026-06-08
  status: ready-to-build
---

## Concept: Before/After Resume Bullet Transformer

**Ranking:** #1 of 7 concepts from conversion analysis session 2026-06-08

**Core idea:**
A new section placed between LandingHero and HomeInteractiveSection. Shows a side-by-side comparison of a weak, generic resume bullet (left) versus the specific, grounded bullet RepoMax generates (right). The "after" bullet uses the existing MOCK_BULLET_PREVIEW from lib/score-mock.ts.

**Why it was ranked first:**
- Resume bullets are the most universally relatable output for every CS student applying to jobs
- Before/after format is the most proven conversion mechanism — shows transformation from known pain to desired outcome in one glance
- Requires zero prior knowledge of RepoMax or its scoring system
- The "after" bullet content already exists in the codebase (MOCK_BULLET_PREVIEW in score-mock.ts) — the page currently buries it in a small animated demo card
- Works on students who have never heard of RepoMax before

**Target emotions:** Relief + Proof + Specificity

**Files to create/modify:**
- Create: components/BulletTransformSection.tsx
- Edit: app/page.tsx (insert between LandingHero and HomeInteractiveSection)

**Key design rules:**
- Weak card: border-red-500/20 bg-red-500/5 accent, badge "Weak" in red
- Strong card: border-emerald-500/20 bg-emerald-500/5 accent, badge "Recruiter-ready" in emerald
- Import MOCK_BULLET_PREVIEW from @/lib/score-mock — do not hardcode it separately
- Trust line: "RepoMax reads your README, code files, and repo structure. It never invents users, revenue, or percentages."
- CTA: "Get bullets for your repo" pointing to /#top

**Success metrics:** CTA click rate increase, repo submissions increase, scroll depth past hero

**Section heading:**
"Your project bullet is selling you short."
Subtext: "RepoMax writes bullets from your actual stack and features. Not templates."

**Left card (before):**
Label: "What most students write"
Bullet: "Built a web app using React and Node.js with user authentication."
Note below: "Generic. Could describe 10,000 repos. Recruiter skips."

**Right card (after):**
Label: "What RepoMax generates for you"
Bullet: MOCK_BULLET_PREVIEW (imported from lib/score-mock.ts)
Note below: "Grounded in your actual stack. Specific enough to ask about in an interview."

## Implementation prompt (exact text for frontend-product-builder agent)

Build a new BulletTransformSection component for the RepoMax landing page at /Users/onirnarahari/Documents/repomax.

What to build:
A new full-width section that goes between LandingHero and HomeInteractiveSection in app/page.tsx. Shows a before/after resume bullet transformation.

Layout:
- Dark background consistent with the page (bg-[#070a12] or bg-[#0A0F1E])
- Centered section heading
- Two side-by-side cards on desktop, stacked on mobile
- CTA below pointing to /#top

Section heading: "Your project bullet is selling you short."
Subtext: "RepoMax writes bullets from your actual stack and features. Not templates."

Left card: Label "What most students write", Badge "Weak" (red), Bullet "Built a web app using React and Node.js with user authentication.", Note "Generic. Could describe 10,000 repos. Recruiter skips."

Right card: Label "What RepoMax generates for you", Badge "Recruiter-ready" (emerald), Bullet = MOCK_BULLET_PREVIEW imported from @/lib/score-mock, Note "Grounded in your actual stack. Specific enough to ask about in an interview."

Trust line: "RepoMax reads your README, code files, and repo structure. It never invents users, revenue, or percentages."

CTA: Blue rounded-full button, same style as HomeInteractiveSection. Text "Get bullets for your repo". href="/#top".

Design rules: Use bg-[#0A0F1E], border-white/8, text-white/85 for headings, text-[#8B9DC3] for body. No new dependencies. Do not touch HeroRepoForm, HeroProductDemo, or score-mock.ts values.

Files: Create components/BulletTransformSection.tsx. Edit app/page.tsx to insert it between LandingHero and HomeInteractiveSection. Run build after.
