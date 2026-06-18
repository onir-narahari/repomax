'use client'

import { motion } from 'motion/react'
import HeroRepoForm from '@/components/hero/HeroRepoForm'
import { pageMax, pageX, sectionHeaderGap } from '@/lib/landing-layout'
import { cn } from '@/lib/utils'

const CATCH_ITEMS = [
  { color: 'bg-red-400/70', label: 'Vague README', body: "No project summary. No context. Recruiter can't tell what it does." },
  { color: 'bg-red-400/70', label: 'No live demo', body: "No URL, no screenshots. Nothing to show it actually works." },
  { color: 'bg-red-400/70', label: 'Missing setup steps', body: "A recruiter who can't run it assumes it doesn't work." },
  { color: 'bg-amber-400/70', label: 'Weak technical depth', body: "No explanation of why you made key decisions." },
  { color: 'bg-amber-400/70', label: 'Generic resume bullets', body: "Built a web app using React. Every CS student says this." },
  { color: 'bg-amber-400/70', label: 'No proof it runs', body: "No CI badge, no demo, no screenshot. Recruiter assumes it's broken." },
]

export default function HomePageSections() {
  return (
    <section className={cn('bg-[#202941] border-t border-[#303A55] pt-20 pb-20 sm:pt-24 sm:pb-28')}>
      <div className={cn(pageMax, pageX)}>
        <div className={cn('text-center', sectionHeaderGap)}>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-[-0.02em] leading-snug">
            Your repo gets 30 seconds. Here&apos;s what&apos;s failing it.
          </h2>
          <p className="mt-2 text-sm text-[#A7B0C3] max-w-sm mx-auto">
            RepoMax shows you exactly what&apos;s missing and rewrites it for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATCH_ITEMS.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: index * 0.07 }}
              className="rounded-xl border border-[#303A55] bg-[#202941] p-5 hover:bg-[#253050] hover:border-[#A78BFA]/30 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className={`h-2 w-2 rounded-full shrink-0 ${item.color}`} />
                <span className="text-sm font-semibold text-[#F8FAFC]">{item.label}</span>
              </div>
              <p className="text-[13px] text-[#A7B0C3] leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className={cn('relative mt-20 sm:mt-28', pageMax, pageX)}>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(167,139,250,0.18) 0%, transparent 70%)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="relative flex flex-col items-center gap-6 text-center py-16 sm:py-24"
        >
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC] tracking-[-0.02em] leading-snug">
            See what your repo is hiding.
          </h2>
          <p className="text-sm text-[#A7B0C3] max-w-xs">
            Most repos score under 55. Paste yours and find out where you stand.
          </p>
          <div className="w-full max-w-[420px]">
            <HeroRepoForm showLabel={false} />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
