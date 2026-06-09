---
name: top-concept-bullet-transform
description: Highest-priority conversion concept — Before/After Resume Bullet Transformer section. Ranked #1 in two consecutive sessions (2026-06-08). Not yet built.
metadata:
  type: project
  status: ready-to-build
  last-analyzed: 2026-06-08
---

## Concept: Before/After Resume Bullet Transformer

**Ranking:** #1 of 7 in both the conversion-reviewer analysis (2026-06-08) and this session's re-analysis (2026-06-08).

**Status:** NOT BUILT as of 2026-06-08. Implementation prompt is ready. No code exists.

**Why it keeps ranking first:**
- Resume bullets are the most universally relatable output for every CS student applying to jobs — 100% audience coverage
- Before/after format is the highest-signal conversion mechanic — shows the exact transformation from known pain to desired outcome in one glance, no explanation needed
- Works on first-time visitors who have never heard of RepoMax — no context required
- The "after" bullet content already exists in the codebase (MOCK_BULLET_PREVIEW in lib/score-mock.ts) — currently buried in a small animated demo card that most visitors scroll past
- The "before" bullet is universally recognizable: every CS student has written "Built a web app using React and Node.js with user authentication."
- Targets Relief + Proof + Specificity emotions simultaneously

**Files to create/modify:**
- Create: components/BulletTransformSection.tsx
- Edit: app/page.tsx (insert between LandingHero and HomeInteractiveSection)

**Section heading:** "Your project bullet is selling you short."
**Subtext:** "RepoMax writes bullets from your actual stack and features. Not templates."

**Left card (before):**
- Label: "What most students write"
- Badge: "Weak" (red)
- Bullet: "Built a web app using React and Node.js with user authentication."
- Note: "Generic. Could describe 10,000 repos. Recruiter skips."

**Right card (after):**
- Label: "What RepoMax generates for you"
- Badge: "Recruiter-ready" (emerald)
- Bullet: MOCK_BULLET_PREVIEW imported from @/lib/score-mock (do not hardcode)
- Note: "Grounded in your actual stack. Specific enough to ask about in an interview."

**Trust line:** "RepoMax reads your README, code files, and repo structure. It never invents users, revenue, or percentages."

**CTA:** "Get bullets for your repo" → /#top (same blue rounded-full style as HomeInteractiveSection)

**Design spec:**
- bg-[#070a12] (matches HomeInteractiveSection)
- border-white/8, text-white/85 headings, text-[#8B9DC3] body
- Left card: border-red-500/20 bg-red-500/5
- Right card: border-emerald-500/20 bg-emerald-500/5
- No new dependencies

**Success metrics:** CTA click rate increase, repo submissions increase, scroll depth past hero

[[project-repomax-context]]
