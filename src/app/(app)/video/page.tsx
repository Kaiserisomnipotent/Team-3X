import Link from 'next/link';
import { requireActive } from '@/lib/auth';
import { VIDEOS as CODE_VIDEOS } from '@/lib/videos';
import { bunnyEmbedUrl } from '@/lib/bunny';
import { addVideo, deleteVideo } from '@/app/actions';
import SubmitButton from '@/components/SubmitButton';
import type { Video } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function VideoPage({ searchParams }: { searchParams: Promise<{ v?: string; err?: string; ok?: string }> }) {
  const { supabase, profile } = await requireActive();
  const isAdmin = profile.role === 'admin';
  const { v, err, ok } = await searchParams;
  const { data } = await supabase.from('videos').select('*').order('module').order('sort').order('created_at');
  // Video thêm trên web (bảng videos) + video cũ khai báo trong code (src/lib/videos.ts), bỏ trùng.
  const fromDb = (data || []) as Video[];
  const seen = new Set(fromDb.map(x => x.bunny_id));
  const videos: Video[] = [
    ...fromDb,
    ...CODE_VIDEOS.filter(x => !seen.has(x.bunnyId)).map((x, i) => ({ id: '', bunny_id: x.bunnyId, module: x.module, title: x.title, minutes: x.minutes ?? null, note: x.note || '', sort: 1000 + i })),
  ];
  const current = videos.find(x => x.bunny_id === v) || videos[0];
  const src = current ? bunnyEmbedUrl(current.bunny_id) : null;
  const modules = Array.from(new Set(videos.map(x => x.module)));
  return (
    <div className="page">
      <div className="head">
        <span className="eyebrow">Kiến thức · Video</span>
        <h1>Video bài giảng</h1>
        <p className="lede">Video chỉ phát trên web của team, không tải xuống được. Email của bạn hiện mờ trên màn hình để bảo vệ nội dung.</p>
      </div>

      {err && <div className="note warn">{err}</div>}
      {ok === '1' && <div className="note info">Đã lưu video. Nếu khung phát báo lỗi, kiểm tra lại Video ID và mục Allowed domains trong Bunny.</div>}
      {ok === 'del' && <div className="note info">Đã xoá video khỏi danh sách (video gốc trên Bunny vẫn còn).</div>}

      {!videos.length && (
        <div className="empty-box">Chưa có video nào.{isAdmin ? ' Thêm video ở khung bên dưới.' : ''}</div>
      )}
      {current && (
        <div className="stack">
          {src
            ? <div className="player"><iframe src={src} loading="lazy" allow="accelerometer; gyroscope; encrypted-media; picture-in-picture" allowFullScreen title={current.title} /></div>
            : <div className="note warn">Chưa cấu hình Bunny Stream (thiếu BUNNY_LIBRARY_ID trên Vercel). Xem README, Bước 5.</div>}
          <div><span className="eyebrow">{current.module}</span><h3 style={{ marginTop: 4 }}>{current.title}</h3>{current.note && <p className="srcline">{current.note}</p>}</div>
        </div>
      )}
      {modules.map(m => (
        <section className="blk" key={m || '_'}>
          <h4>{m || 'Khác'}</h4>
          <div className="phase">
            {videos.filter(x => x.module === m).map(x => (
              <div key={x.bunny_id} className="task" style={{ gridTemplateColumns: '28px 1fr auto auto' }}>
                <span className="num">{x.bunny_id === current?.bunny_id ? '▶' : '·'}</span>
                <Link href={`/video?v=${x.bunny_id}`} className="t" style={{ textDecoration: 'none', color: 'var(--ink)' }}>{x.title}</Link>
                <span className="srcline">{x.minutes ? `${x.minutes} phút` : ''}</span>
                {isAdmin && x.id
                  ? <form action={deleteVideo}><input type="hidden" name="id" value={x.id} /><SubmitButton className="btn ghost sm" confirmText={`Xoá "${x.title}" khỏi danh sách?`}>Xoá</SubmitButton></form>
                  : <span />}
              </div>
            ))}
          </div>
        </section>
      ))}

      {isAdmin && (
        <section className="blk">
          <h3>Thêm video (admin)</h3>
          <form action={addVideo} className="panel stack">
            <p className="srcline" style={{ margin: 0 }}>Upload video lên thư viện Bunny Stream trước, rồi dán link video hoặc Video ID vào đây. Hướng dẫn từng bước: README, mục "Thêm video bài giảng".</p>
            <label className="f">Link video hoặc Video ID (Bunny)<input type="text" name="bunny" required placeholder="https://iframe.mediadelivery.net/play/123456/1a2b3c4d-… hoặc 1a2b3c4d-…" /></label>
            <div className="grid2">
              <label className="f">Tên video<input type="text" name="title" required maxLength={200} placeholder="VD: Bảng điện và màu giá" /></label>
              <label className="f">Module / nhóm<input type="text" name="module" list="video-modules" maxLength={80} placeholder="VD: Module 1 · TTCK & SSI" /></label>
            </div>
            <datalist id="video-modules">{modules.filter(Boolean).map(m => <option key={m} value={m} />)}</datalist>
            <div className="grid2">
              <label className="f">Thời lượng (phút)<input type="number" name="minutes" min={0} /></label>
              <label className="f">Ghi chú<input type="text" name="note" maxLength={300} placeholder="Tuỳ chọn" /></label>
            </div>
            <div><SubmitButton>Lưu video</SubmitButton></div>
          </form>
        </section>
      )}
    </div>
  );
}
