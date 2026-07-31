import './landing.css'
import { LandingNavbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { ProductDashboard } from '@/components/landing/product-dashboard'
import { CommandBar } from '@/components/landing/command-bar'
import { TrustStrip } from '@/components/landing/trust-strip'
import { ProblemSection } from '@/components/landing/problem-section'
import { EcosystemSection } from '@/components/landing/ecosystem-section'
import { FeatureSection } from '@/components/landing/feature-section'
import { OperationsPreview } from '@/components/landing/operations-preview'
import { WorkflowPreview } from '@/components/landing/workflow-preview'
import { IntelligencePreview } from '@/components/landing/intelligence-preview'
import { InventoryPreview } from '@/components/landing/inventory-preview'
import { PeoplePreview } from '@/components/landing/people-preview'
import { CommandCenter } from '@/components/landing/command-center'
import { AiSection } from '@/components/landing/ai-section'
import { ScaleSection } from '@/components/landing/scale-section'
import { SecuritySection } from '@/components/landing/security-section'
import { FinalCta } from '@/components/landing/final-cta'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-clip">
      <LandingNavbar />

      <Hero />

      <ProductDashboard />

      <CommandBar />

      {/* Spacer before trust strip */}
      <div className="h-24 sm:h-32" />

      <TrustStrip />

      <ProblemSection />

      <EcosystemSection />

      {/* ── Product storytelling: alternating editorial sections ── */}
      <FeatureSection
        eyebrow="OPERATIONS"
        headline="See what is happening across your business."
        description="A real-time operational view that gives teams and leaders a single source of truth. Monitor KPIs, track team activity, and catch issues before they escalate."
      >
        <OperationsPreview />
      </FeatureSection>

      <div className="lp-separator" />

      <FeatureSection
        eyebrow="AUTOMATION"
        headline="Build systems that work while your team works."
        description="Design intelligent workflows that trigger actions, check conditions, and notify the right people — all without writing code."
        reverse
      >
        <WorkflowPreview />
      </FeatureSection>

      <div className="lp-separator" />

      <FeatureSection
        eyebrow="INTELLIGENCE"
        headline="Turn business data into better decisions."
        description="ACT OS intelligence analyzes your operations in real time. Ask questions in natural language and receive actionable insights with supporting data."
      >
        <IntelligencePreview />
      </FeatureSection>

      <div className="lp-separator" />

      <FeatureSection
        eyebrow="INVENTORY"
        headline="Know what you have before you need it."
        description="Track inventory levels, monitor stock movements, manage suppliers, and receive alerts before shortages impact your business."
        reverse
      >
        <InventoryPreview />
      </FeatureSection>

      <div className="lp-separator" />

      <FeatureSection
        eyebrow="PEOPLE"
        headline="Give every team clarity on what matters."
        description="Understand team workload, track approvals, manage responsibilities, and measure performance — all from one connected view."
      >
        <PeoplePreview />
      </FeatureSection>

      <CommandCenter />

      <AiSection />

      <ScaleSection />

      <SecuritySection />

      <FinalCta />

      <Footer />
    </div>
  )
}