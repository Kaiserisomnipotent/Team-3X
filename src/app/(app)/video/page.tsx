import Link from 'next/link';
import { requireActive } from '@/lib/auth';
import { VIDEOS } from '@/lib/videos';
import { bunnyEmbedUrl } from '@/lib/bunny';

export const dynamic = 'force-dynamic';

export default async function VideoPage({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  await requireActive();
  const { v } = await searchParams;
  const current = VIDEOS.find(x => x.bunnyId === v) || VIDEOS[0];
  const src = current ? bunnyEmbedUrl(current.bunnyId) : null;
  const modules = Array.from(new Set(VIDEOS.map(x => x.module)));
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Kiến thức · Video</span>
        <h1>Video bài giảng</h1>
        <p className="lede">Video chỉ phát trên web của team, không tải xuống được. Email của bạn hiện mờ trên màn hình để bảo vệ nội dung.</p>
      </div>
      {!VIDEOS.length && (
        <div className="empty-box">Chưa có video nào. Admin thêm video theo hướng dẫn trong file <code>src/lib/videos.ts</code>.</div>
      )}
      {current && (
        <div className="stack">
          {src
            ? <div className="player"><iframe src={src} loading="lazy" allow="accelerometer; gyroscope; encrypted-media; picture-in-picture" allowFullScreen title={current.title} /></div>
            : <div className="note warn">Chưa cấu hình Bunny Stream (thiếu BUNNY_LIBRARY_ID).</div>}
          <div><span className="eyebrow">{current.module}</span><h3 style={{ marginTop: 4 }}>{current.title}</h3>{current.note && <p className="srcline">{current.note}</p>}</div>
        </div>
      )}
      {modules.map(m => (
        <section className="blk" key={m}>
          <h4>{m}</h4>
          <div className="phase">
            {VIDEOS.filter(x => x.module === m).map(x => (
              <Link key={x.bunnyId} href={`/video?v=${x.bunnyId}`} className="task" style={{ gridTemplateColumns: '28px 1fr auto', textDecoration: 'none', color: 'var(--ink)' }}>
                <span className="num">{x.bunnyId === current?.bunnyId ? '▶' : '·'}</span>
                <span className="t">{x.title}</span>
                <span className="srcline">{x.minutes ? `${x.minutes} phút` : ''}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
