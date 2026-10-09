'use client';
// Lớp bảo vệ nội dung: watermark email người xem + chặn bôi đen/chuột phải/copy/in/lưu trang.
// Không chặn được chụp hoặc quay màn hình — watermark để truy ra ai làm lộ.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logView } from '@/app/actions';

export default function Protect({ email }: { email: string }) {
  const path = usePathname();

  useEffect(() => { logView(path).catch(() => {}); }, [path]);

  useEffect(() => {
    document.body.classList.add('protect');
    const inField = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest('input,textarea,select,[contenteditable]');
    const block = (e: Event) => { if (!inField(e.target)) e.preventDefault(); };
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 's', 'p', 'u', 'a'].includes(k) && !inField(e.target)) e.preventDefault();
      if (k === 'printscreen') navigator.clipboard?.writeText('').catch(() => {});
    };
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('contextmenu', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('keydown', keys);

    // Nút "Chép" ở mẫu tin nhắn vẫn hoạt động (chỉ chép đúng nội dung mẫu).
    const copyBtn = async (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]');
      if (!b) return;
      const pre = b.closest('.tpl')?.querySelector('pre');
      if (!pre) return;
      let ok = false;
      try { await navigator.clipboard.writeText(pre.innerText); ok = true; } catch {}
      b.textContent = ok ? 'Đã chép' : 'Không chép được';
      setTimeout(() => (b.textContent = 'Chép'), 1600);
    };
    document.addEventListener('click', copyBtn);
    return () => {
      document.body.classList.remove('protect');
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('keydown', keys);
      document.removeEventListener('click', copyBtn);
    };
  }, []);

  // Watermark dạng ô lặp (SVG), mật độ đều trên mọi kích thước màn hình.
  const stamp = `${email} · ${new Date().toLocaleDateString('vi-VN')}`;
  const safe = stamp.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="190"><text x="10" y="110" transform="rotate(-24 170 95)" font-family="monospace" font-size="15" font-weight="600" fill="#808080">${safe}</text></svg>`;
  return <div className="wm" aria-hidden="true" style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")` }} />;
}
