'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Archive } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/archive', label: 'Reports Archive', Icon: Archive }
];

export default function LeftRail() {
  const pathname = usePathname();

  return (
    <nav className="left-rail" aria-label="Primary">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || pathname?.startsWith(href + '/');
        return (
          <Link key={href} href={href} className={`rail-item ${active ? 'active' : ''}`} title={label}>
            <Icon size={20} strokeWidth={2} />
          </Link>
        );
      })}
    </nav>
  );
}
