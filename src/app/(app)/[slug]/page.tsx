import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { readPage, STATIC_PAGES } from '@/lib/pages';
import { requireActive } from '@/lib/auth';
import Highlight from '@/components/Highlight';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = STATIC_PAGES.find(x => x.slug === slug);
  return { title: p ? `${p.title} · Team 3X` : 'Team 3X' };
}

export default async function StaticPage({ params }: { params: Promise<{ slug: string }> }) {
  await requireActive(); // kiểm tra lại quyền mỗi lần mở trang (khi chuyển trang kiểu SPA, layout không chạy lại)
  const { slug } = await params;
  const html = await readPage(slug);
  if (!html) notFound();
  // Nội dung do team soạn (tin cậy), lưu trong /content/pages.
  return (
    <>
      <div className="page" dangerouslySetInnerHTML={{ __html: html }} />
      <Suspense><Highlight /></Suspense>
    </>
  );
}
