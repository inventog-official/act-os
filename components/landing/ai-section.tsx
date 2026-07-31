'use client'

import { Reveal } from '@/components/landing/reveal'
import { useState } from 'react'
import { Sparkles, ArrowRight, BarChart3, Clock, Target, Box } from 'lucide-react'

const questions = [
  { text: 'What changed today?', icon: Clock },
  { text: 'Where are we losing time?', icon: BarChart3 },
  { text: 'Which inventory needs attention?', icon: Box },
  { text: 'What should I prioritize?', icon: Target },
]

const sampleInsight = {
  question: 'What should I prioritize?',
  answer: 'Based on current deadlines, resource allocation, and business impact, here are your top priorities:',
  items: [
    { priority: 1, text: 'Approve Q3 budget — blocking 3 downstream projects', impact: 'High' },
    { priority: 2, text: 'Review vendor contract renewal — expires in 5 days', impact: 'High' },
    { priority: 3, text: 'Restock MacBook Pro inventory — customer orders pending', impact: 'Medium' },
    { priority: 4, text: 'Complete performance reviews — 4 overdue', impact: 'Medium' },
  ],
}

export function AiSection() {
  const [selectedIdx, setSelectedIdx] = useState(3) // "What should I prioritize?"

  return (
    <section className="lp-section" style={{ background: 'var(--lp-bg-secondary)' }} id="intelligence">
      <div className="lp-container">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="lp-eyebrow">Intelligence</span>
            <h2 className="lp-headline mt-4">
              Your business has data. <br />ACT OS gives it <span className="lp-text-gradient">context.</span>
            </h2>
          </div>
        </Reveal>

        <div className="max-w-3xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Questions list */}
          <div className="lg:col-span-2 space-y-2">
            <Reveal variant="left">
              {questions.map((q, i) => (
                <button
                  key={q.text}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all mb-2 ${
                    selectedIdx === i
                      ? 'bg-[var(--lp-surface)] border border-[var(--lp-border-accent)] shadow-md shadow-black/20'
                      : 'border border-transparent hover:bg-[var(--lp-surface)] hover:border-[var(--lp-border)]'
                  }`}
                >
                  <q.icon className={`h-4 w-4 shrink-0 ${selectedIdx === i ? 'text-[var(--lp-accent)]' : 'text-[var(--lp-text-muted)]'}`} />
                  <span className={`text-[13px] font-medium ${selectedIdx === i ? 'text-[var(--lp-text)]' : 'text-[var(--lp-text-secondary)]'}`}>
                    {q.text}
                  </span>
                  {selectedIdx === i && <ArrowRight className="h-3 w-3 ml-auto text-[var(--lp-accent)]" />}
                </button>
              ))}
            </Reveal>
          </div>

          {/* Insight panel */}
          <div className="lg:col-span-3">
            <Reveal variant="right" delay={200}>
              <div className="rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface)] overflow-hidden shadow-xl shadow-black/30">
                <div className="px-5 py-3.5 border-b border-[var(--lp-border)] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--lp-accent)]" />
                  <span className="text-[12px] font-semibold text-[var(--lp-text)]">ACT OS Intelligence</span>
                </div>
                <div className="p-5">
                  <p className="text-[13px] leading-relaxed text-[var(--lp-text-secondary)] mb-4">
                    {sampleInsight.answer}
                  </p>
                  <div className="space-y-2">
                    {sampleInsight.items.map((item) => (
                      <div key={item.priority} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--lp-bg)] border border-[var(--lp-border)]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-[var(--lp-accent)]" style={{ background: 'rgba(22,131,255,0.1)' }}>
                          {item.priority}
                        </span>
                        <div className="flex-1">
                          <p className="text-[12px] text-[var(--lp-text)]">{item.text}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.impact === 'High' ? 'bg-red-400/10 text-red-400' : 'bg-amber-400/10 text-amber-400'}`}>
                          {item.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
