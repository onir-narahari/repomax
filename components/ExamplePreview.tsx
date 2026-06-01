'use client'

import { FileText, Briefcase, MessageCircle, Check, GitFork } from 'lucide-react'

const RESUME_BULLETS = [
  'Built a FastAPI-based stock analysis platform integrating financial APIs, valuation logic, and LLM query routing to generate natural-language equity research responses',
  'Implemented multi-ticker comparison workflows using Python, structured financial data, and session memory to support follow-up stock analysis queries',
  'Designed route-specific analysis flows for valuation, financials, news, and peer comparisons, improving the clarity and relevance of generated market insights',
]

const LINKEDIN_POST = `I built an AI stock research tool that turns natural-language questions into valuation, financials, news, and peer comparison insights.

The project uses FastAPI, financial data APIs, and LLM routing to understand what a user is asking, fetch the right market data, and generate a clear lesson: building useful AI products is less about the model and more about the data pipeline, routing logic, and making the output grounded enough to trust.

#AI #FinTech #SoftwareEngineering #BuildInPublic`

const X_POST = `Built an AI stock analysis app.

Ask "NVDA vs AMD" or "is AAPL undervalued?" and it returns valuation, news, financials, and comparison insights.

FastAPI + financial APIs + LLM routing.

Biggest lesson: AI apps are only as good as their data pipeline.`

const STEPS = [
  'Reading README',
  'Detecting tech stack',
  'Extracting key features',
  'Ranking resume-worthy details',
  'Writing project story',
]

// Typewriter URL: "onir/stock-analysis-agent" is 24 chars typed after "github.com/"
// Typing duration: 1.4s starting at 0.5s = ends at ~1.9s
// Cursor blinks 3x at 0.7s each = 2.1s of blinking, then gone
// Total cursor visible: 0.5s start → ~4s end

export default function ExamplePreview() {
  return (
    <>
      <style>{`
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes cursorFade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes cursorDisappear {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes analyzingPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        /* The typed text container */
        .typewriter-url {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: typewriter 1.4s steps(24, end) 0.5s forwards;
        }

        /* Cursor: blinks 3 times over ~2.1s then fades out */
        .typewriter-cursor {
          display: inline-block;
          width: 1.5px;
          height: 0.85em;
          background: #60A5FA;
          vertical-align: middle;
          margin-left: 1px;
          animation:
            cursorFade 0.7s step-end 1.9s 3,
            cursorDisappear 0.3s ease forwards 4.0s;
        }

        .step-item {
          opacity: 0;
          animation: stepIn 0.35s ease forwards;
        }
        .output-card {
          opacity: 0;
          animation: cardSlideIn 0.45s ease forwards;
        }
        .analyzing-bar {
          animation: analyzingPulse 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="w-full">
        {/* Section label */}
        <div className="mb-8 flex items-center gap-3">
          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
            Live example
          </span>
          <span className="text-xs text-[#F4F0E8]/30">— paste any public repo, get this in seconds</span>
        </div>

        {/* Two-column simulation grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-[42%_1fr] md:items-start">

          {/* ── LEFT COLUMN: process simulation ── */}
          <div className="flex flex-col gap-4">

            {/* Card: Paste a repo */}
            <div
              className="rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E] p-5"
              style={{ boxShadow: '0 0 40px rgba(59,130,246,0.06)' }}
            >
              <div className="mb-3 flex items-center gap-2">
                <GitFork className="h-3.5 w-3.5 text-blue-400/60" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F4F0E8]/35">
                  Paste a repo
                </span>
              </div>
              <div className="flex items-center overflow-hidden rounded-xl border border-blue-500/15 bg-[#09090B] px-4 py-3">
                <span className="font-mono text-xs text-[#F4F0E8]/30">github.com/</span>
                <span className="typewriter-url font-mono text-xs text-[#F4F0E8]/80">
                  onir/stock-analysis-agent
                </span>
                <span className="typewriter-cursor" />
              </div>

              {/* Analyzing bar — appears after typing ends (~1.9s) */}
              <div
                className="mt-3 overflow-hidden rounded-full bg-blue-500/10"
                style={{ opacity: 0, animation: 'cardSlideIn 0.4s ease forwards 1.9s' }}
              >
                <div
                  className="h-1 rounded-full bg-blue-500/50 analyzing-bar"
                  style={{ animationDelay: '1.9s', width: '60%' }}
                />
              </div>
              <p
                className="mt-2 text-[11px] text-blue-400/50"
                style={{ opacity: 0, animation: 'cardSlideIn 0.4s ease forwards 2.0s' }}
              >
                Analyzing repository...
              </p>
            </div>

            {/* Card: RepoStory is working */}
            <div
              className="rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E] p-5"
              style={{ boxShadow: '0 0 40px rgba(59,130,246,0.06)' }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F4F0E8]/35">
                  RepoStory is working
                </span>
              </div>
              <div className="space-y-3">
                {STEPS.map((step, i) => (
                  <div
                    key={step}
                    className="step-item flex items-center gap-3"
                    style={{ animationDelay: `${0.7 + i * 0.3}s` }}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10">
                      <Check className="h-2.5 w-2.5 text-blue-400" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-[#F4F0E8]/65">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: output cards ── */}
          <div className="flex flex-col gap-4">

            {/* Card: Resume Bullets */}
            <div
              className="output-card rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-default"
              style={{
                animationDelay: '2.4s',
                boxShadow: '0 0 40px rgba(59,130,246,0.06)',
              }}
            >
              <div className="mb-3 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
                  Resume Bullets
                </span>
              </div>
              <ul className="space-y-3">
                {RESUME_BULLETS.map((bullet, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[#F4F0E8]/70">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* LinkedIn + X side by side on large screens, stacked otherwise */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

              {/* Card: LinkedIn Post */}
              <div
                className="output-card rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-default"
                style={{
                  animationDelay: '2.65s',
                  boxShadow: '0 0 40px rgba(59,130,246,0.06)',
                }}
              >
                <div className="mb-3 flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
                    LinkedIn Post
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#F4F0E8]/65">
                  {LINKEDIN_POST}
                </p>
              </div>

              {/* Card: X Post */}
              <div
                className="output-card rounded-2xl border border-[#1E3A5F] bg-[#0A0F1E] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] cursor-default"
                style={{
                  animationDelay: '2.9s',
                  boxShadow: '0 0 40px rgba(59,130,246,0.06)',
                }}
              >
                <div className="mb-3 flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400/80">
                    X Post
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#F4F0E8]/65">
                  {X_POST}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
