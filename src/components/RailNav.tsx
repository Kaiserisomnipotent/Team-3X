'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = { href: string; label: string; step?: string; count?: number; tone?: 'bad' | 'ok' } | { group: string };

export default function RailNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));
  return (
    <>
      {items.map((it, i) =>
        'group' in it ? (
          <div key={i} className="grp eyebrow">{it.group}</div>
        ) : (
          <Link key={it.href} href={it.href} aria-current={active(it.href) ? 'page' : undefined}>
            <span className="step">{it.step}</span>
            {it.label}
            {it.count ? <span className={`cnt ${it.tone || 'bad'}`}>{it.count}</span> : null}
          </Link>
        ),
      )}
    </>
  );
}
