'use client';
// Khi mở trang từ ô tìm kiếm (?q=...), cuộn tới đoạn khớp và nháy sáng.
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/\s+/g, ' ');

export default function Highlight() {
  const q = useSearchParams().get('q');
  useEffect(() => {
    if (!q) return;
    const target = fold(q).slice(0, 40);
    const els = Array.from(document.querySelectorAll<HTMLElement>('.page li, .page tr, .page .tpl, .page p, .page h3, .page .panel, .page .note'));
    const el = els.find(e => fold(e.innerText).includes(target));
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }, [q]);
  return null;
}
