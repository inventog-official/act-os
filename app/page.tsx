import './landing.css'
import { LandingNavbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { ProductDashboard } from '@/components/landing/product-dashboard'
import { TrustStrip } from '@/components/landing/trust-strip'
import { ProblemSection } from '@/components/landing/problem-section'
import { EcosystemSection } from '@/components/landing/ecosystem-section'
import { OperationsPreview } from '@/components/landing/operations-preview'
import { WorkflowPreview } from '@/components/landing/workflow-preview'
import { CommandCenter } from '@/components/landing/command-center'
import { InventoryPreview } from '@/components/landing/inventory-preview'
import { SignatureVisual } from '@/components/landing/signature-visual'
import { FinalCta } from '@/components/landing/final-cta'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="landing-page min-h-screen overflow-x-clip bg-black text-white selection:bg-white selection:text-black">
      {/* 10 — Minimalist Black Navigation */}
      <LandingNavbar />

      {/* 05-06 — Hero with Atmospheric Background */}
      <Hero />

      {/* 07-08 — Single Beautiful Monochrome Dashboard */}
      <ProductDashboard />

      {/* 11 — Minimal Trust Strip */}
      <TrustStrip />

      {/* 12-13 — The Problem: Convergence Animation */}
      <ProblemSection />

      {/* 14-15 — Product Section: Everything Connected */}
      <EcosystemSection />

      {/* 18 — Operations: Real-Time Observability */}
      <OperationsPreview />

      {/* 19 — Workflows: Turn Repetitive Work into Systems */}
      <WorkflowPreview />

      {/* 16-17 — Intelligence: Ask Your Business Anything */}
      <CommandCenter />

      {/* 20 — Inventory: Know What You Have */}
      <InventoryPreview />

      {/* 21 — Signature Abstract Visual Section */}
      <SignatureVisual />

      {/* 22-23 — Final Statement & Cinematic CTA */}
      <FinalCta />

      {/* Footer */}
      <Footer />
    </div>
  )
}