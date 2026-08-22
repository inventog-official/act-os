import Link from 'next/link'
import { IoLogoStencil } from 'react-icons/io5'

const footerColumns = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Platform', href: '#platform' },
      { label: 'Operations', href: '#operations' },
      { label: 'Workflows', href: '#workflows' },
      { label: 'Intelligence', href: '#intelligence' },
      { label: 'Inventory', href: '#inventory' },
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
      { label: 'Security', href: '#' },
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
    <footer className="border-t border-white/[0.08] bg-black">
      <div className="lp-container py-16 sm:py-20">
        {/* Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[11px] font-medium tracking-[0.16em] text-[#666666] mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[13px] text-[#A1A1A1] transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-[5px] bg-white text-black flex items-center justify-center shadow-xs">
              <IoLogoStencil className="w-3 h-3" />
            </div>
            <span className="text-[14px] font-semibold text-white tracking-tight font-sans">ACT OS</span>
            <span className="text-[12px] text-[#666666]">·</span>
            <span className="text-[12px] text-[#666666]">© 2026 ACT OS</span>
          </div>

          <div className="flex items-center gap-6 text-[12px] text-[#666666]">
            <a href="#" className="transition-colors hover:text-[#A1A1A1]">Privacy</a>
            <a href="#" className="transition-colors hover:text-[#A1A1A1]">Terms</a>
            <a href="#" className="transition-colors hover:text-[#A1A1A1]">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
