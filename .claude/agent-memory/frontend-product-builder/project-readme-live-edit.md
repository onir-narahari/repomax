---
name: project-readme-live-edit
description: HomeReadmeLiveEdit section — full GitHub-styled README document with yellow-amber block highlighting, cycling issue fix cards, and animated score badge
metadata:
  type: project
---

`components/HomeReadmeLiveEdit.tsx` is a client component inserted between `<LandingHero />` and `<HomePageSections />` in `app/page.tsx`.

**No heroOverlapPad** — `HeroDemoPreview` was removed from `LandingHero.tsx` (and `heroOverlap` removed from its imports). `HomePageSections` uses `pt-20 sm:pt-24`. This section uses `py-20 sm:py-28` with `bg-[#131929] border-t border-[#303A55]`.

**Document style:** Real GitHub README rendering — white background (`bg-white`), `text-[#1f2328]`, GitHub dark header chrome (`bg-[#24292f]`) with octocat SVG + repo path + Star/Fork buttons, file path bar (`bg-[#f6f8fa] border-b border-[#d0d7de]`). Markdown elements styled with inline Tailwind to match GitHub exactly (h1/h2/h3 with border-b, code blocks `bg-[#f6f8fa]`, tables, inline code).

**README content:** RepoMax's own README.md (onir-narahari/repomax), rendered as structured JSX blocks with IDs: `block-h1`, `block-tagline`, `block-local-dev-h`, `block-deploy-h`, `block-deploy-body`.

**Highlight style:** Yellow-amber glow — `bg-[#fff8c5] outline outline-2 outline-[#d4a72c]/40 rounded` with `transition-all duration-500`. NOT red border.

**Layout:** `grid-cols-1 lg:grid-cols-[1fr_280px]` — GitHub README left (no height cap, scrolls naturally), right column sticky `lg:sticky lg:top-8`.

**Behavior:**
- IntersectionObserver (threshold 0.3) auto-starts cycling when scrolled into view
- 4 issues cycle every 3500ms (`CYCLE_MS`)
- Active issue's `highlightIds` target block IDs via `ReadmeBlock` component receiving `isHighlighted` prop
- Score animates via `requestAnimationFrame` ease-out cubic from current → `ISSUES[idx].scoreTarget` over 700ms
- Starting score: 72; targets: 78 → 84 → 90 → 94
- Grade thresholds: WEAK <73 (red), FAIR 73-82 (amber), GOOD 83-90 (blue), STRONG 91+ (emerald)

**4 issues:** No one-sentence hook (block-tagline) → No live demo link (block-h1) → No screenshot (block-local-dev-h) → Deploy instructions dominate (block-deploy-h + block-deploy-body).

See also: [[project-landing-layout]]
