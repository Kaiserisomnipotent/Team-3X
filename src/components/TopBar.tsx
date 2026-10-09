'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Hit = { slug: string; title: string; text: string };
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();

export default function TopBar() {
  const router = useRouter();
  const dlg = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<(Hit & { f: string })[] | null>(null);
  const [q, setQ] = useState('');

  async function open() {
    if (!index) {
      const res = await fetch('/api/search');
      const data: Hit[] = res.ok ? await res.json() : [];
      setIndex(data.map(h => ({ ...h, f: fold(h.text) })));
    }
    setQ('');
    dlg.current?.showModal();
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName || '');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); open(); }
      else if (e.key === '/' && !typing && !dlg.current?.open) { e.preventDefault(); open(); }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });

  const words = fold(q).split(/\s+/).filter(Boolean);
  const phrase = words.join(' ');
  const hits = words.length && index
    ? index.filter(h => words.every(w => h.f.includes(w))).sort((a, b) => +b.f.includes(phrase) - +a.f.includes(phrase)).slice(0, 20)
    : [];
  const snip = (h: Hit & { f: string }) => {
    const w = h.f.includes(phrase) ? phrase : words[0];
    const i = h.f.indexOf(w), s = Math.max(0, i - 40), e = Math.min(h.text.length, i + w.length + 90);
    return <>{s ? '…' : ''}{h.text.slice(s, i)}<mark>{h.text.slice(i, i + w.length)}</mark>{h.text.slice(i + w.length, e)}{e < h.text.length ? '…' : ''}</>;
  };
  const go = (h: Hit) => { dlg.current?.close(); router.push(`/${h.slug}?q=${encodeURIComponent(h.text.slice(0, 60))}`); };

  return (
    <div className="tape" role="banner">
      <div className="tick"><span className="k">HÀNH TRÌNH</span><span className="v ref">99 NGÀY</span></div>
      <div className="tick"><span className="k">KPI TUẦN 1–3</span><span className="v up">3 TK/TUẦN</span></div>
      <div className="tick"><span className="k">SAU ĐÓ</span><span className="v up">≥1 TK/TUẦN</span></div>
      <div className="tick"><span className="k">ZALO/NGÀY</span><span className="v floor">50 TIN</span></div>
      <div className="tick"><span className="k">LÊN CHÍNH THỨC</span><span className="v ceil">10TR NET + 7 TK</span></div>
      <div className="tick"><span className="k">PHÍ GD</span><span className="v">0.25%</span></div>
      <div className="tick"><span className="k">HOA HỒNG NV</span><span className="v up">65%</span></div>
      <div className="spacer" />
      <button className="themebtn" type="button" onClick={open} aria-label="Tìm trong tài liệu (Ctrl+K)">TÌM · CTRL K</button>
      <button className="themebtn" type="button" aria-label="Đổi giao diện sáng/tối" onClick={() => {
        const el = document.documentElement;
        const cur = el.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const next = cur === 'dark' ? 'light' : 'dark';
        el.setAttribute('data-theme', next);
        try { localStorage.setItem('t3x.theme', JSON.stringify(next)); } catch {}
      }}>SÁNG / TỐI</button>

      <dialog id="searchDlg" ref={dlg} aria-label="Tìm trong tài liệu" onClick={e => { if (e.target === dlg.current) dlg.current?.close(); }}>
        <div className="sbox">
          <input type="search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm: mẫu tin nhắn, margin, từ cấm, KPI… (gõ không dấu cũng được)" autoComplete="off"
            onKeyDown={e => { if (e.key === 'Enter' && hits[0]) { e.preventDefault(); go(hits[0]); } }} />
          <kbd>ESC</kbd>
        </div>
        <div className="sres">
          {!words.length && <div className="empty">Gợi ý: <b>phỏng vấn</b>, <b>margin</b>, <b>từ cấm</b>, <b>hoa hồng</b>, <b>wifi</b>.</div>}
          {!!words.length && !hits.length && <div className="empty">Không thấy “{q}”. Thử từ ngắn hơn.</div>}
          {hits.map((h, i) => (
            <button key={i} type="button" onClick={() => go(h)}><span className="eyebrow">{h.title}</span><span>{snip(h)}</span></button>
          ))}
        </div>
      </dialog>
    </div>
  );
}
