import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { dayNum, isoFromNum, journeyStats, kyOf, prevKy, sumLog, todayISO, metOfficial } from './journey';
import { QUIZ_COUNT } from './quizMeta';
import type { KpiLog, Profile } from './types';

/** Gom số liệu cả team cho leader (RLS chỉ cho leader/admin đọc toàn bộ). */
export async function loadTeam(supabase: SupabaseClient) {
  const today = todayISO(), ky = kyOf(today), pk = prevKy(ky), since7 = isoFromNum(dayNum(today) - 6);
  const [pr, tp, qs, kpi, ci, at] = await Promise.all([
    supabase.from('profiles').select('*').in('role', ['member', 'leader', 'admin']),
    supabase.from('task_progress').select('user_id,task_id'),
    supabase.from('quiz_scores').select('user_id,quiz_id,best_score'),
    supabase.from('kpi_logs').select('*').gte('log_date', pk.start),
    supabase.from('checkins').select('user_id,checkin_date,help_status').gte('checkin_date', since7),
    supabase.from('assigned_tasks').select('assignee,status,due_date').neq('status', 'done'),
  ]);
  const by = <T extends { user_id?: string; assignee?: string }>(rows: T[] | null, key: 'user_id' | 'assignee' = 'user_id') => {
    const m = new Map<string, T[]>();
    (rows || []).forEach(r => { const k = r[key] as string; m.set(k, [...(m.get(k) || []), r]); });
    return m;
  };
  const tpm = by(tp.data), qsm = by(qs.data), kpim = by(kpi.data as KpiLog[]), cim = by(ci.data), atm = by(at.data, 'assignee');
  const rows = ((pr.data || []) as Profile[]).map(p => {
    const done = new Set((tpm.get(p.id) || []).map(r => (r as { task_id: string }).task_id));
    const quiz = Object.fromEntries((qsm.get(p.id) || []).map(r => [(r as { quiz_id: string }).quiz_id, (r as { best_score: number }).best_score]));
    const passed = Object.values(quiz).filter(v => v >= 4).length;
    const s = journeyStats(p.start_date, done, passed, QUIZ_COUNT, today);
    const logs = (kpim.get(p.id) || []) as KpiLog[];
    const ks = sumLog(logs, ky.start, ky.end), ps = sumLog(logs, pk.start, pk.end);
    const cis = (cim.get(p.id) || []) as { checkin_date: string; help_status: string }[];
    const openTasks = (atm.get(p.id) || []) as { due_date: string | null }[];
    return {
      p, s, quiz, ks, ps,
      official: metOfficial(ks) || metOfficial(ps),
      checkedToday: cis.some(c => c.checkin_date === today),
      checkins7: cis.length,
      openHelp: cis.filter(c => c.help_status === 'open').length,
      openTasks: openTasks.length,
      lateTasks: openTasks.filter(t => t.due_date && dayNum(t.due_date) < dayNum(today)).length,
    };
  }).sort((a, b) => b.s.day - a.s.day);
  return { rows, ky, today };
}
