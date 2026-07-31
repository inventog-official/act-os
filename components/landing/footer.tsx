import Link from 'next/link'

const columns = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Platform', href: '#platform' },
      { label: 'Operations', href: '#platform' },
      { label: 'Workflows', href: '#platform' },
      { label: 'Intelligence', href: '#intelligence' },
      { label: 'Inventory', href: '#platform' },
    ],
  },
  {
    title: 'SOLUTIONS',
    links: [
      { label: 'Growing teams', href: '#solutions' },
      { label: 'Operations teams', href: '#solutions' },
      { label: 'Enterprise', href: '#solutions' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Security', href: '#resources' },
    ],
  },
  {
    title: 'RESOURCES',
    links: [
      { label: 'Documentation', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Guides', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-[var(--lp-border)]" style={{ background: 'var(--lp-bg-secondary)' }}>
      <div className="lp-container py-16">
        {/* Columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-semibold tracking-[0.14em] text-[var(--lp-text-muted)] mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-[var(--lp-text-secondary)] transition-colors hover:text-[var(--lp-text)]"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[var(--lp-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--lp-accent)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-[13px] font-semibold text-[var(--lp-text)]">ACT OS</span>
          </div>

          <p className="text-[12px] text-[var(--lp-text-muted)]">
            © 2026 ACT OS. All rights reserved.
          </p>

          <div className="flex items-center gap-6 text-[12px] text-[var(--lp-text-muted)]">
            <a href="#" className="transition-colors hover:text-[var(--lp-text-secondary)]">Privacy</a>
            <a href="#" className="transition-colors hover:text-[var(--lp-text-secondary)]">Terms</a>
            <a href="#" className="transition-colors hover:text-[var(--lp-text-secondary)]">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
