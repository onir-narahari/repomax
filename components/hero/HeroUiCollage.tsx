type Fragment = {
  text: string
  top: string
  left: string
  size: string
  opacity: number
  rotate: number
  mono?: boolean
  color?: string
  weight?: number
}

const FRAGMENTS: Fragment[] = [
  // Large ghost score numbers — atmospheric depth
  { text: '88', top: '4%', left: '3%', size: '10rem', opacity: 0.05, rotate: -6, color: '#F8FAFC', weight: 700 },
  { text: '74', top: '58%', left: '89%', size: '8rem', opacity: 0.045, rotate: 5, color: '#F8FAFC', weight: 700 },
  { text: '42', top: '80%', left: '6%', size: '6.5rem', opacity: 0.045, rotate: -4, color: '#F8FAFC', weight: 700 },
  { text: '91', top: '2%', left: '82%', size: '7rem', opacity: 0.04, rotate: 4, color: '#F8FAFC', weight: 700 },

  // Match / score labels
  { text: "TODAY'S MATCH", top: '10%', left: '24%', size: '11px', opacity: 0.11, rotate: -3, mono: true },
  { text: 'MATCH 88', top: '16%', left: '70%', size: '12px', opacity: 0.1, rotate: 4, mono: true, color: '#EC4899' },
  { text: 'MATCH 94', top: '72%', left: '46%', size: '12px', opacity: 0.09, rotate: -2, mono: true, color: '#EC4899' },
  { text: 'SCORE 74', top: '44%', left: '8%', size: '12px', opacity: 0.1, rotate: 2, mono: true },
  { text: 'STRONG · 91', top: '25%', left: '46%', size: '11px', opacity: 0.09, rotate: -2, mono: true, color: '#34d399' },
  { text: '3 MATCHED · DAILY', top: '86%', left: '58%', size: '11px', opacity: 0.1, rotate: 3, mono: true },
  { text: 'GAPS FLAGGED · 3', top: '34%', left: '80%', size: '11px', opacity: 0.09, rotate: -3, mono: true, color: '#f87171' },
  { text: 'REPO SCORE', top: '92%', left: '20%', size: '11px', opacity: 0.09, rotate: 2, mono: true },
  { text: '12:00 PM DAILY', top: '6%', left: '52%', size: '10px', opacity: 0.09, rotate: -1, mono: true },
  { text: 'IN REVIEW', top: '64%', left: '4%', size: '10px', opacity: 0.08, rotate: 2, mono: true },
  { text: 'PHONE SCREEN', top: '38%', left: '92%', size: '10px', opacity: 0.08, rotate: -2, mono: true },

  // Job title / company fragments
  { text: 'Sr. Frontend Engineer · Vercel', top: '30%', left: '3%', size: '13px', opacity: 0.1, rotate: -2 },
  { text: 'New Grad SWE · Datadog', top: '66%', left: '68%', size: '13px', opacity: 0.09, rotate: 2 },
  { text: 'Frontend Intern · Stripe', top: '90%', left: '3%', size: '13px', opacity: 0.09, rotate: -1 },
  { text: 'Backend Engineer · Ramp', top: '52%', left: '36%', size: '13px', opacity: 0.08, rotate: 3 },
  { text: 'ML Researcher · Anthropic', top: '12%', left: '88%', size: '12px', opacity: 0.08, rotate: -2 },
  { text: 'Platform Engineer · Cloudflare', top: '48%', left: '78%', size: '12px', opacity: 0.07, rotate: 2 },

  // Repo diagnostic fragments
  { text: 'No demo link', top: '8%', left: '58%', size: '12px', opacity: 0.09, rotate: 2 },
  { text: 'Hook fails the scan', top: '56%', left: '86%', size: '12px', opacity: 0.08, rotate: -2 },
  { text: 'README.md', top: '40%', left: '58%', size: '11px', opacity: 0.09, rotate: 1, mono: true },
  { text: 'Score: 42 → 89', top: '20%', left: '38%', size: '12px', opacity: 0.09, rotate: -3, mono: true },
  { text: 'new role indexed', top: '78%', left: '82%', size: '11px', opacity: 0.07, rotate: 2 },
  { text: '$130K + equity', top: '96%', left: '48%', size: '11px', opacity: 0.07, rotate: -1, mono: true },
]

export default function HeroUiCollage() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {FRAGMENTS.map((f, i) => (
        <span
          key={i}
          className={`absolute whitespace-nowrap select-none ${f.mono ? 'font-mono uppercase tracking-[0.14em]' : 'font-sans'}`}
          style={{
            top: f.top,
            left: f.left,
            fontSize: f.size,
            opacity: f.opacity,
            transform: `rotate(${f.rotate}deg)`,
            color: f.color ?? '#F8FAFC',
            fontWeight: f.weight ?? 600,
          }}
        >
          {f.text}
        </span>
      ))}
    </div>
  )
}
