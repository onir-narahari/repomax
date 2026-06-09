---
name: score-ticker-component
description: HeroScoreTicker rotating audit strip — location, behavior, and design decisions
metadata:
  type: project
---

A "Recent audits" rotating ticker strip was shipped as components/hero/HeroScoreTicker.tsx and inserted into components/hero/HeroRepoForm.tsx (rendered just above the form element, inside a fragment).

The component cycles three hardcoded audit entries every 4 seconds with a 250ms opacity fade transition (no CSS animation classes, pure inline style opacity). Entries: alex-m/react-notes-app (44, red), jkim/expense-tracker (71, amber), priya-s/portfolio-v2 (88, green).

Score badge color logic: <50 = red-500, 50-79 = amber-400, 80+ = emerald-400.

Verdict text uses hidden sm:block so it only appears at >= sm breakpoint — intentional mobile space saving.

**Why:** Conversion concept #5 — social proof + FOMO at the moment a visitor is deciding whether to submit their repo URL.

**How to apply:** If the ticker entries need updating, edit TICKER_ENTRIES in components/hero/HeroScoreTicker.tsx. If the cycling interval needs adjustment, change the 4000ms setInterval value in the same file. Do not move this component without updating the HeroRepoForm.tsx import.
