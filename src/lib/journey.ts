// Logic hành trình 99 ngày, KPI và kỳ doanh số — chuyển từ bản HTML của anh lead.
// Mọi "ngày hôm nay" tính theo giờ Việt Nam (server Vercel chạy giờ UTC).
import { PHASES } from './phases';
import type { KpiLog, Phase, Task } from './types';

export const TZ = 'Asia/Ho_Chi_Minh';
const DAY = 864e5;

export type TaskWithPhase = Task & { phase: Phase };
export const ALL_TASKS: TaskWithPhase[] = PHASES.flatMap(p => p.tasks.map(t => ({ ...t, phase: p })));

/** yyyy-mm-dd của hôm nay theo giờ Việt Nam */
export function todayISO(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
/** Ngày (không giờ) dưới dạng số ngày kể từ epoch, để so sánh và cộng trừ không lệch múi giờ */
export const dayNum = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / DAY);
};
export const isoFromNum = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
export const fmtDate = (iso?: string | null) => (iso ? iso.split('-').reverse().join('/') : '');
export const fmtDM = (iso: string) => iso.slice(8, 10) + '/' + iso.slice(5, 7);
export const fmtNum = (n: number) => (Math.round(n * 10) / 10).toLocaleString('vi-VN');

/** Ngày thứ mấy trong hành trình (ngày bắt đầu = ngày 1) */
export const dayOf = (start: string, today = todayISO()) => Math.max(1, dayNum(today) - dayNum(start) + 1);

export type Status = { cls: 's-up' | 's-down' | 's-ref' | 's-floor'; label: string; rank: number };
export function statusOf(task: TaskWithPhase, done: boolean, day: number): Status {
  if (done) return { cls: 's-up', label: 'Hoàn thành', rank: 9 };
  if (day > task.phase.to) return { cls: 's-down', label: 'Quá hạn', rank: 0 };
  if (day >= task.phase.from) return { cls: 's-ref', label: 'Hạn ngày ' + task.phase.to, rank: 1 };
  return { cls: 's-floor', label: 'Từ ngày ' + task.phase.from, rank: 2 };
}

export function journeyStats(start: string, doneIds: Set<string>, passedQuizzes: number, totalQuizzes: number, today = todayISO()) {
  const day = dayOf(start, today);
  const done = ALL_TASKS.filter(t => doneIds.has(t.id)).length;
  const overdue = ALL_TASKS.filter(t => statusOf(t, doneIds.has(t.id), day).cls === 's-down').length;
  return {
    day, done, overdue, passed: passedQuizzes, totalQuizzes,
    total: ALL_TASKS.length,
    pct: Math.round((done / ALL_TASKS.length) * 100),
    phase: PHASES.find(p => Math.min(day, 99) >= p.from && Math.min(day, 99) <= p.to) || PHASES[PHASES.length - 1],
  };
}

export function nextTasks(start: string, doneIds: Set<string>, n = 6, today = todayISO()) {
  const day = dayOf(start, today);
  return ALL_TASKS.filter(t => !doneIds.has(t.id))
    .map(t => ({ t, st: statusOf(t, false, day) }))
    .sort((a, b) => a.st.rank - b.st.rank)
    .slice(0, n);
}

// ---------- Kỳ doanh số SSI: ngày 20 tháng này → ngày 19 tháng sau ----------
export function kyOf(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const sy = d >= 20 ? y : m === 1 ? y - 1 : y;
  const sm = d >= 20 ? m : m === 1 ? 12 : m - 1;
  const start = `${sy}-${String(sm).padStart(2, '0')}-20`;
  const ey = sm === 12 ? sy + 1 : sy, em = sm === 12 ? 1 : sm + 1;
  const end = `${ey}-${String(em).padStart(2, '0')}-19`;
  return { start, end };
}
export const prevKy = (ky: { start: string }) => kyOf(isoFromNum(dayNum(ky.start) - 1));

export function sumLog(logs: KpiLog[], from: string, to: string) {
  const a = dayNum(from), b = dayNum(to);
  const r = { tk: 0, cid: 0, net: 0 };
  for (const e of logs) {
    const x = dayNum(e.log_date);
    if (x >= a && x <= b) { r.tk += +e.new_accounts || 0; r.cid += +e.id_transfers || 0; r.net += +e.net_fee || 0; }
  }
  return r;
}
export const weekOf = (start: string, today = todayISO()) => Math.max(1, Math.floor((dayNum(today) - dayNum(start)) / 7) + 1);
export const weekRange = (start: string, w: number) => {
  const from = dayNum(start) + (w - 1) * 7;
  return { from: isoFromNum(from), to: isoFromNum(from + 6) };
};
export const tkTarget = (w: number) => (w <= 3 ? 3 : 1);
export const metOfficial = (s: { tk: number; net: number }) => s.tk >= 7 && s.net >= 10;

/** '#sop-zalo' → '/sop-zalo' */
export const routeOf = (link?: string) => (link ? '/' + link.replace(/^#/, '') : '/lo-trinh');
