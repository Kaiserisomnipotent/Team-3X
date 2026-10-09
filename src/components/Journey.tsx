// Các khối hiển thị dùng chung giữa "Bảng của tôi" và trang chi tiết nhân sự của leader.
import Link from 'next/link';
import { addKpi, deleteKpi } from '@/app/actions';
import {
  fmtDate, fmtDM, fmtNum, journeyStats, kyOf, metOfficial, nextTasks, prevKy, routeOf, sumLog, tkTarget, todayISO, weekOf, weekRange,
} from '@/lib/journey';
import type { KpiLog } from '@/lib/types';

type Stats = ReturnType<typeof journeyStats>;

export function DayPanel({ s }: { s: Stats }) {
  const day = Math.min(s.day, 99);
  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div><span className="eyebrow">Ngày trong hành trình</span><div className="daybig num">{s.day}<small> / 99</small></div></div>
        <div style={{ textAlign: 'right' }}>
          <span className="eyebrow">Giai đoạn</span>
          <div style={{ font: '700 22px var(--display)', textTransform: 'uppercase' }}>{s.phase.code} · {s.phase.name}</div>
          <div className="srcline">{s.phase.win}</div>
        </div>
      </div>
      <div className="meter" aria-label={`Thanh 99 ngày, đang ở ngày ${day}`}>
        {Array.from({ length: 99 }, (_, i) => <i key={i} className={i + 1 < day ? 'p' : i + 1 === day ? 't m' : ''} title={`Ngày ${i + 1}`} />)}
      </div>
      {s.day > 99 && <div className="note" style={{ marginTop: 12 }}>Đã qua mốc 99 ngày. Nếu đã đạt 10 triệu phí net và 7 TK trong một kỳ, báo leader xét lên chính thức.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
        <div><span className="eyebrow">Đầu việc xong</span><div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{s.done}/{s.total}</div></div>
        <div><span className="eyebrow">Tiến độ</span><div className="num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--up)' }}>{s.pct}%</div></div>
        <div><span className="eyebrow">Quá hạn</span><div className="num" style={{ fontSize: 20, fontWeight: 600, color: s.overdue ? 'var(--down)' : 'var(--muted)' }}>{s.overdue}</div></div>
      </div>
    </div>
  );
}

export function NextPanel({ start, done }: { start: string; done: Set<string> }) {
  const open = nextTasks(start, done);
  return (
    <div className="panel">
      <span className="eyebrow">Việc cần làm tiếp</span>
      <ul className="next" style={{ marginTop: 8 }}>
        {open.length ? open.map(({ t, st }) => (
          <li key={t.id}>
            <Link href={routeOf(t.link)} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{t.t}</Link>
            <span className={`pill ${st.cls}`}>{st.label}</span>
          </li>
        )) : <li>Đã hoàn thành toàn bộ lộ trình. Báo leader để xét lên chính thức.</li>}
      </ul>
      <Link href="/lo-trinh" className="btn ghost sm" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>Mở toàn bộ lộ trình</Link>
    </div>
  );
}

const Bar = ({ v, max, c }: { v: number; max: number; c: string }) => (
  <div className="bar"><i style={{ width: `${Math.min(100, (v / max) * 100)}%`, background: `var(--${c})` }} /></div>
);

export function KpiTiles({ start, logs }: { start: string; logs: KpiLog[] }) {
  const t = todayISO(), w = weekOf(start, t), wr = weekRange(start, w), ws = sumLog(logs, wr.from, wr.to), tg = tkTarget(w);
  const k = kyOf(t), ks = sumLog(logs, k.start, k.end), pk = prevKy(k), ps = sumLog(logs, pk.start, pk.end);
  return (
    <div className="kpi">
      <div className="tile"><span className="eyebrow">Tuần {w} · {fmtDM(wr.from)}–{fmtDM(wr.to)}</span><div className="big">{ws.tk}<small> / {tg} TK</small></div><Bar v={ws.tk} max={tg} c={ws.tk >= tg ? 'up' : 'ref'} /><span className="srcline">KPI {w <= 3 ? '3 tuần đầu' : 'từ tuần 4'}: {tg} TK/tuần</span></div>
      <div className="tile"><span className="eyebrow">Kỳ {fmtDM(k.start)}–{fmtDM(k.end)} · TK mới</span><div className="big">{ks.tk}<small> / 7</small></div><Bar v={ks.tk} max={7} c={ks.tk >= 7 ? 'ceil' : 'up'} /><span className="srcline">Chuyển ID trong kỳ: {ks.cid}</span></div>
      <div className="tile"><span className="eyebrow">Kỳ này · phí net</span><div className="big">{fmtNum(ks.net)}<small> / 10 tr</small></div><Bar v={ks.net} max={10} c={ks.net >= 10 ? 'ceil' : 'up'} /><span className="srcline">TTCS &amp; TTPS</span></div>
      <div className="tile"><span className="eyebrow">Điều kiện chính thức</span>
        <div>{metOfficial(ks) ? <span className="pill s-ceil">Kỳ này đã đạt</span> : metOfficial(ps) ? <span className="pill s-ceil">Kỳ trước đã đạt</span> : <span className="pill s-ref">Chưa đạt</span>}</div>
        <span className="srcline">Kỳ trước {fmtDM(pk.start)}–{fmtDM(pk.end)}: {ps.tk} TK · {fmtNum(ps.net)} tr</span>
      </div>
    </div>
  );
}

export function KpiForm() {
  return (
    <form action={addKpi} className="panel logform">
      <label className="f">Ngày<input type="date" name="log_date" defaultValue={todayISO()} required /></label>
      <label className="f">TK mở mới<input type="number" name="new_accounts" min={0} step={1} defaultValue={0} inputMode="numeric" /></label>
      <label className="f">Chuyển ID<input type="number" name="id_transfers" min={0} step={1} defaultValue={0} inputMode="numeric" /></label>
      <label className="f">Phí net (triệu)<input type="number" name="net_fee" min={0} step={0.1} defaultValue={0} inputMode="decimal" /></label>
      <button className="btn" type="submit">Ghi số liệu</button>
    </form>
  );
}

export function KpiLogTable({ logs, canDelete, limit = 8 }: { logs: KpiLog[]; canDelete: boolean; limit?: number }) {
  const recent = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date)).slice(0, limit);
  if (!recent.length) return <p className="srcline">Chưa có số liệu. Ghi dòng đầu tiên khi mở được tài khoản mới.</p>;
  return (
    <div className="tw"><table>
      <thead><tr><th>Ngày</th><th className="r">TK mới</th><th className="r">Chuyển ID</th><th className="r">Phí net (tr)</th>{canDelete && <th />}</tr></thead>
      <tbody>{recent.map(e => (
        <tr key={e.id}>
          <td className="num">{fmtDate(e.log_date)}</td><td className="r num">{e.new_accounts}</td><td className="r num">{e.id_transfers}</td><td className="r num">{fmtNum(+e.net_fee)}</td>
          {canDelete && <td className="r"><form action={deleteKpi}><input type="hidden" name="id" value={e.id} /><button className="btn ghost sm" type="submit">Xoá</button></form></td>}
        </tr>
      ))}</tbody>
    </table></div>
  );
}

export const scorePill = (sc?: number | null) =>
  sc == null ? <span className="pill s-idle">Chưa làm</span> : <span className={`pill ${sc === 5 ? 's-ceil' : sc >= 4 ? 's-up' : 's-down'}`}>{sc}/5</span>;
