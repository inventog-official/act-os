import './landing.css'
import { SmoothScroll } from '@/components/marketing/SmoothScroll'
import { Navigation } from '@/components/marketing/Navigation'
import { Hero } from '@/components/marketing/Hero'
import { ChaosSection } from '@/components/marketing/ChaosSection'
import { ConnectionSection } from '@/components/marketing/ConnectionSection'
import { ProductSection } from '@/components/marketing/ProductSection'
import { OperationsSection } from '@/components/marketing/OperationsSection'
import { WorkflowSection } from '@/components/marketing/WorkflowSection'
import { IntelligenceSection } from '@/components/marketing/IntelligenceSection'
import { GeminiEffectSection } from '@/components/marketing/GeminiEffectSection'
import { CommandCenter } from '@/components/marketing/CommandCenter'
import { InventorySection } from '@/components/marketing/InventorySection'
import { PeopleSection } from '@/components/marketing/PeopleSection'
import { OperatingSystemSection } from '@/components/marketing/OperatingSystemSection'
import { ControlSection } from '@/components/marketing/ControlSection'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'

export default function LandingPage() {
  return (
    <SmoothScroll>
      <div className="landing-page min-h-screen overflow-x-clip bg-black text-white selection:bg-white selection:text-black">
        {/* Navigation */}
        <Navigation />

        {/* 00 — HERO: The Act OS Core Boot & Vision */}
        <Hero />

        {/* 01 — CHAOS: Scattered Systems */}
        <ChaosSection />

        {/* 02 — CONNECTION: One System. Every Moving Part */}
        <ConnectionSection />

        {/* 03 — PRODUCT: See Your Business Clearly */}
        <ProductSection />

        {/* 04 — OPERATIONS: Know What's Happening */}
        <OperationsSection />

        {/* 05 — WORKFLOWS: Turn Work into Systems */}
        <WorkflowSection />

        {/* 06 — INTELLIGENCE: Context & Next Directives */}
        <IntelligenceSection />

        {/* SIGNATURE WEAVE — Google Gemini Neural Waveform */}
        <GeminiEffectSection />

        {/* 07 — COMMAND CENTER: Natural Language Terminal */}
        <CommandCenter />

        {/* 08 — INVENTORY: Dimensional Supply & Stock */}
        <InventorySection />

        {/* 09 — PEOPLE: Workforce Coordination & Deliverables */}
        <PeopleSection />

        {/* 10 — THE OPERATING SYSTEM: The Full-Screen Core Climax */}
        <OperatingSystemSection />

        {/* 11 — CONTROL: Deterministic Execution */}
        <ControlSection />

        {/* 12 — FINAL CTA & FOOTER */}
        <FinalCTA />
        <Footer />
      </div>
    </SmoothScroll>
  )
}