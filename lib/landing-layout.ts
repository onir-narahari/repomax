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
  'text-[10px] font-mono uppercase tracking-[0.15em] text-[#8B9CC4] mb-4'

/** Base navy — hero / page default */
export const navyBase = '#131929'

/**
 * Section shade ladder — same hue family, stepped lightness only.
 * Hero/README → features (lifted) → testimonials (deeper) → footer (anchor)
 */
export const featuresSectionBg = 'bg-[#171f2e]'
export const featuresSectionBorder = 'border-[#3d4a66]'
export const testimonialsSectionBg = 'bg-[#101624]'
export const testimonialsSectionBorder = 'border-[#2f3a52]'
export const footerSectionBg = 'bg-[#0c101a]'

/** Shared accents — one system across all sections */
export const landingAccent = '#38D9FF'
export const landingAccentLabel =
  'text-[10px] font-mono uppercase tracking-[0.14em] text-[#38D9FF]'
export const landingTag =
  'font-mono text-[10px] uppercase tracking-[0.12em] text-[#9BB4FF]'
export const landingSurface =
  'rounded-xl border border-[#3d4a66] bg-[#1a2238] shadow-[0_12px_40px_rgba(0,0,0,0.22)]'
export const landingTextSecondary = 'text-[#B8C4DC]'
export const landingTextMuted = 'text-[#8B9CC4]'
export const landingMeta = 'font-mono text-[10px] text-[#8B9CC4]'

export const sectionYCompact = 'py-14 sm:py-16'

export type FeatureKey = 'outreach' | 'interview'
