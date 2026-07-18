/** Shared landing page layout tokens — keep gutters and vertical rhythm consistent. */

export const pageX = 'px-6 sm:px-8 lg:px-12'

export const pageMax = 'max-w-5xl mx-auto'

/** Wider sections below the README demo — shared alignment rail */
export const sectionMax = 'max-w-[1200px] mx-auto'

export const sectionX = pageX

export const sectionY = 'py-20 sm:py-28'

export const sectionHeaderGap = 'mb-10 sm:mb-12'

export const stackSm = 'gap-3'

export const stackMd = 'gap-5'

export const stackLg = 'gap-8'

export const heroOverlap = '-mb-28 sm:-mb-32 lg:-mb-36'

export const heroOverlapPad = 'pt-28 sm:pt-32 lg:pt-36'

export const heroFormMax = 'w-full max-w-[420px]'

export const sectionLabel =
  'text-[10px] font-mono uppercase tracking-[0.15em] text-[#8A8F9C] mb-4'

/** Base near-black — hero / page default. Premium dark, not navy-SaaS-blue. */
export const navyBase = '#0A0A0F'

/**
 * Section shade ladder — same near-black family, stepped lightness only.
 * Hero/README → features (lifted) → testimonials (deeper) → footer (anchor)
 */
export const featuresSectionBg = 'bg-[#0D0D12]'
export const featuresSectionBorder = 'border-white/[0.08]'
export const testimonialsSectionBg = 'bg-[#08080B]'
export const testimonialsSectionBorder = 'border-white/[0.06]'
export const footerSectionBg = 'bg-[#050506]'

/** Shared accents — one system across all sections */
export const landingAccent = '#EC4899'
export const landingAccentLabel =
  'text-[10px] font-mono uppercase tracking-[0.14em] text-[#EC4899]'
export const landingTag =
  'font-mono text-[10px] uppercase tracking-[0.12em] text-[#8A8F9C]'
export const landingSurface =
  'rounded-xl border border-white/[0.08] bg-[#111114] shadow-[0_12px_40px_rgba(0,0,0,0.4)]'
export const landingTextSecondary = 'text-[#C7CAD1]'
export const landingTextMuted = 'text-[#8A8F9C]'
export const landingMeta = 'font-mono text-[10px] text-[#8A8F9C]'

export const sectionYCompact = 'py-14 sm:py-16'

export type FeatureKey = 'outreach' | 'interview'
