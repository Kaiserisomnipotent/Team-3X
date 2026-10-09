'use server';
// Mọi thao tác ghi dữ liệu đi qua đây. Phân quyền được kiểm tra 2 lớp:
// ở đây (requireActive/requireStaff) và trong database (RLS trong supabase/schema.sql).
import { revalidatePath } from 'next/cache';
import { requireActive, requireStaff, requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { QUIZZES } from '@/lib/quizzes';
import { ALL_TASKS, todayISO } from '@/lib/journey';

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? '').trim().slice(0, max);
const int = (f: FormData, k: string) => Math.max(0, Math.floor(Number(f.get(k)) || 0));
const isoOk = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// ---------- Lộ trình ----------
export async function toggleTask(taskId: string, done: boolean) {
  const { supabase, profile } = await requireActive();
  if (!ALL_TASKS.some(t => t.id === taskId)) return { ok: false };
  const q = done
    ? supabase.from('task_progress').upsert({ user_id: profile.id, task_id: taskId })
    : supabase.from('task_progress').delete().eq('user_id', profile.id).eq('task_id', taskId);
  const { error } = await q;
  revalidatePath('/', 'layout');
  return { ok: !error };
}

// ---------- Bài kiểm tra: chấm trên server, học viên không sửa điểm được ----------
export async function submitQuiz(quizId: string, picks: number[]) {
  const { profile } = await requireActive();
  const qz = QUIZZES.find(q => q.id === quizId);
  if (!qz || !Array.isArray(picks) || picks.length !== qz.qs.length) return { ok: false as const };
  const score = qz.qs.reduce((s, q, i) => s + (picks[i] === q.c ? 1 : 0), 0);
  const admin = supabaseAdmin();
  const { data: prev } = await admin.from('quiz_scores').select('best_score,attempts')
    .eq('user_id', profile.id).eq('quiz_id', quizId).maybeSingle();
  await admin.from('quiz_scores').upsert({
    user_id: profile.id, quiz_id: quizId,
    best_score: Math.max(score, prev?.best_score ?? 0),
    attempts: (prev?.attempts ?? 0) + 1,
    updated_at: new Date().toISOString(),
  });
  revalidatePath('/', 'layout');
  // Trả đáp án đúng SAU KHI nộp để học viên xem lại.
  return { ok: true as const, score, total: qz.qs.length, correct: qz.qs.map(q => q.c) };
}

// ---------- Số liệu kinh doanh ----------
export async function addKpi(fd: FormData) {
  const { supabase, profile } = await requireActive();
  const d = str(fd, 'log_date', 10);
  const row = {
    user_id: profile.id,
    log_date: isoOk(d) ? d : todayISO(),
    new_accounts: int(fd, 'new_accounts'),
    id_transfers: int(fd, 'id_transfers'),
    net_fee: Math.max(0, Math.round((parseFloat(String(fd.get('net_fee') ?? '0').replace(',', '.')) || 0) * 100) / 100),
  };
  if (!row.new_accounts && !row.id_transfers && !row.net_fee) return;
  await supabase.from('kpi_logs').insert(row);
  revalidatePath('/');
}
export async function deleteKpi(fd: FormData) {
  const { supabase } = await requireActive();
  await supabase.from('kpi_logs').delete().eq('id', str(fd, 'id', 64));
  revalidatePath('/');
}

// ---------- Check-in cuối ngày ----------
export async function saveCheckin(fd: FormData) {
  const { supabase, profile } = await requireActive();
  await supabase.from('checkins').upsert(
    {
      user_id: profile.id,
      checkin_date: todayISO(),
      did: str(fd, 'did'),
      result: str(fd, 'result'),
      need_help: str(fd, 'need_help'),
    },
    { onConflict: 'user_id,checkin_date' },
  );
  revalidatePath('/', 'layout');
}

// ---------- Việc được giao ----------
export async function setTaskStatus(fd: FormData) {
  const { supabase } = await requireActive();
  const status = str(fd, 'status', 10);
  if (!['todo', 'doing', 'done'].includes(status)) return;
  await supabase.from('assigned_tasks').update({ status }).eq('id', str(fd, 'id', 64));
  revalidatePath('/', 'layout');
}

// ---------- Leader ----------
export async function assignTask(fd: FormData) {
  const { supabase, profile } = await requireStaff();
  const title = str(fd, 'title', 200);
  const due = str(fd, 'due_date', 10);
  const assignees = fd.getAll('assignee').map(String).filter(Boolean);
  if (!title || !assignees.length) return;
  await supabase.from('assigned_tasks').insert(assignees.map(a => ({
    assignee: a, created_by: profile.id, title, detail: str(fd, 'detail'), due_date: isoOk(due) ? due : null,
  })));
  revalidatePath('/', 'layout');
}
export async function deleteAssigned(fd: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from('assigned_tasks').delete().eq('id', str(fd, 'id', 64));
  revalidatePath('/', 'layout');
}
export async function replyCheckin(fd: FormData) {
  const { supabase, profile } = await requireStaff();
  await supabase.from('checkins').update({
    leader_reply: str(fd, 'reply'), replied_by: profile.id, help_status: 'resolved',
  }).eq('id', str(fd, 'id', 64));
  revalidatePath('/', 'layout');
}

// ---------- Admin: tài khoản ----------
export async function updateMember(fd: FormData) {
  const { supabase } = await requireAdmin();
  const role = str(fd, 'role', 10);
  const start = str(fd, 'start_date', 10);
  const patch: Record<string, string | null> = { team: str(fd, 'team', 40) || null, full_name: str(fd, 'full_name', 80) };
  if (['pending', 'member', 'leader', 'admin', 'disabled'].includes(role)) patch.role = role;
  if (isoOk(start)) patch.start_date = start;
  await supabase.from('profiles').update(patch).eq('id', str(fd, 'id', 64));
  revalidatePath('/', 'layout');
}
export async function addInvite(fd: FormData) {
  const { supabase } = await requireAdmin();
  const email = str(fd, 'email', 120).toLowerCase();
  const start = str(fd, 'start_date', 10);
  const role = str(fd, 'role', 10);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
  await supabase.from('invites').upsert({
    email, role: ['member', 'leader', 'admin'].includes(role) ? role : 'member',
    team: str(fd, 'team', 40) || null, start_date: isoOk(start) ? start : null,
  });
  revalidatePath('/admin');
}
export async function deleteInvite(fd: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('invites').delete().eq('email', str(fd, 'email', 120));
  revalidatePath('/admin');
}

// ---------- Nhật ký xem trang (truy vết nếu nội dung bị lộ) ----------
export async function logView(page: string) {
  const { supabase, profile } = await requireActive();
  await supabase.from('view_logs').insert({ user_id: profile.id, page: page.slice(0, 120) });
}
