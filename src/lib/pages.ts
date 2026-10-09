import 'server-only';
import fs from 'fs/promises';
import path from 'path';
import { DOCS } from './docs';

// Các trang nội dung tĩnh (quy trình, kiến thức) — HTML gốc của anh lead nằm trong /content/pages.
// Muốn sửa nội dung: sửa file .html tương ứng, giữ nguyên các class CSS.
export const STATIC_PAGES: { slug: string; title: string; group: 'Quy trình chuẩn' | 'Kiến thức'; step: string }[] = [
  { slug: 'sop-tuyen-dung', title: 'Tuyển dụng', group: 'Quy trình chuẩn', step: 'Q1' },
  { slug: 'sop-zalo', title: 'Sale Zalo', group: 'Quy trình chuẩn', step: 'Q2' },
  { slug: 'sop-tiktok', title: 'TikTok & Livestream', group: 'Quy trình chuẩn', step: 'Q3' },
  { slug: 'sop-mo-tk', title: 'Mở TK & chuyển ID', group: 'Quy trình chuẩn', step: 'Q4' },
  { slug: 'sop-cskh', title: 'Chăm sóc khách hàng', group: 'Quy trình chuẩn', step: 'Q5' },
  { slug: 'kien-thuc', title: '5 Module đào tạo', group: 'Kiến thức', step: 'M' },
  { slug: 'san-pham', title: 'Sản phẩm SSI', group: 'Kiến thức', step: 'SP' },
  { slug: 'thu-nhap', title: 'Thu nhập & thăng tiến', group: 'Kiến thức', step: '₫' },
  { slug: 'noi-quy', title: 'Nội quy & Event', group: 'Kiến thức', step: '§' },
  { slug: 'tai-lieu', title: 'Tài liệu gốc', group: 'Kiến thức', step: '↗' },
];

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function readPage(slug: string): Promise<string | null> {
  if (!STATIC_PAGES.some(p => p.slug === slug)) return null;
  let html = await fs.readFile(path.join(process.cwd(), 'content', 'pages', slug + '.html'), 'utf8');
  if (slug === 'tai-lieu') {
    const rows = DOCS.map(d => `<tr><td>${d.url ? `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.name)}</a>` : `<b>${esc(d.name)}</b>`}</td><td class="srcline">${esc(d.folder)}</td><td>${esc(d.use)}</td></tr>`).join('');
    html = html.replace('<tbody id="docRows"></tbody>', `<tbody>${rows}</tbody>`)
      .replace(/Khi mở trang này từ chính thư mục đó, bấm tên file để mở trực tiếp\./, 'Tên file có gạch chân là bấm mở được.');
  }
  return html;
}

// ---------- Chỉ mục tìm kiếm ----------
type Hit = { slug: string; title: string; text: string };
let INDEX: Hit[] | null = null;

const strip = (s: string) => s
  .replace(/<img[^>]*>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ').trim();

export async function searchIndex(): Promise<Hit[]> {
  if (INDEX) return INDEX;
  const out: Hit[] = [];
  for (const p of STATIC_PAGES) {
    const html = (await readPage(p.slug)) || '';
    // Mỗi khối (đoạn, mục danh sách, dòng bảng, mẫu tin nhắn) là một kết quả tìm kiếm.
    const blocks = html.split(/<\/(?:li|tr|pre|p|h3|div)>/);
    for (const b of blocks) {
      const text = strip(b);
      if (text.length > 12) out.push({ slug: p.slug, title: p.title, text: text.slice(0, 600) });
    }
  }
  INDEX = out;
  return out;
}
