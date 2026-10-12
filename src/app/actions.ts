'use server';
// Mọi thao tác ghi dữ liệu đi qua đây. Phân quyền được kiểm tra 2 lớp:
// ở đây (requireActive/requireStaff) và trong database (RLS trong supabase/schema.sql).
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireActive, requireStaff, requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { QUIZZES } from '@/lib/quizzes';
import { ALL_TASKS, todayISO } from '@/lib/journey';
import { sendInviteMail } from '@/lib/mail';

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
export async function setTaskStatus(id: string, status: string): Promise<{ ok: boolean; msg?: string }> {
  const { supabase, profile } = await requireActive();
  if (!['todo', 'doing', 'done'].includes(status) || !id) return { ok: false, msg: 'Dữ liệu không hợp lệ.' };
  // .select() để biết có dòng nào thực sự được cập nhật không (không có = bị chặn quyền hoặc việc không thuộc về bạn).
  const { data, error } = await supabase.from('assigned_tasks').update({ status }).eq('id', id).eq('assignee', profile.id).select('id');
  if (error) console.error('setTaskStatus', error);
  if (error || !data?.length) return { ok: false, msg: 'Chưa lưu được trạng thái. Tải lại trang rồi thử lại, nếu vẫn lỗi hãy báo leader.' };
  revalidatePath('/', 'layout');
  return { ok: true };
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
  const { supabase, profile: me } = await requireAdmin();
  const id = str(fd, 'id', 64);
  const role = str(fd, 'role', 10);
  const start = str(fd, 'start_date', 10);
  const patch: Record<string, string | null> = { team: str(fd, 'team', 40) || null, full_name: str(fd, 'full_name', 80) };
  // Admin không tự đổi vai trò của chính mình (tránh tự khoá mình ra ngoài).
  if (id !== me.id && ['pending', 'member', 'leader', 'admin', 'disabled'].includes(role)) patch.role = role;
  if (isoOk(start)) patch.start_date = start;
  await supabase.from('profiles').update(patch).eq('id', id);
  revalidatePath('/', 'layout');
}
/** Khoá / mở khoá: hai action riêng (không dựa vào name/value của nút bấm vì trình duyệt có thể không gửi kèm, từng khiến "Khoá" bị hiểu thành "Mở khoá"). */
async function setLock(fd: FormData, lock: boolean) {
  const { profile: me } = await requireAdmin();
  const id = str(fd, 'id', 64);
  if (!id || id === me.id) return;
  const admin = supabaseAdmin();
  const { data, error } = await admin.from('profiles').update({ role: lock ? 'disabled' : 'member' }).eq('id', id).select('id');
  if (error || !data?.length) {
    console.error('setLock', lock, error);
    redirect('/admin?acct=lockfailed');
  }
  // Khoá ở tầng đăng nhập: không đăng nhập lại, không làm mới phiên được.
  const ban = await admin.auth.admin.updateUserById(id, { ban_duration: lock ? '876000h' : 'none' });
  if (ban.error) console.error('setLock ban', ban.error);
  revalidatePath('/', 'layout');
  redirect(`/admin?acct=${lock ? 'locked' : 'unlocked'}`);
}
export async function lockMember(fd: FormData) { await setLock(fd, true); }
export async function unlockMember(fd: FormData) { await setLock(fd, false); }
/** Xoá hẳn tài khoản và toàn bộ dữ liệu của người đó (tiến độ, điểm, check-in…). Không hoàn tác được. */
export async function deleteMember(fd: FormData) {
  const { supabase, profile: me } = await requireAdmin();
  const id = str(fd, 'id', 64);
  if (id === me.id) return;
  const { data: target } = await supabase.from('profiles').select('email').eq('id', id).maybeSingle();
  if (!target) return;
  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) redirect('/admin?acct=failed');
  // Xoá cả lời mời, nếu không họ đăng nhập lại là được duyệt lại ngay.
  await admin.from('invites').delete().ilike('email', target.email);
  revalidatePath('/', 'layout');
  redirect('/admin?acct=deleted');
}
export async function addInvite(fd: FormData) {
  const { supabase, profile: me } = await requireAdmin();
  const email = str(fd, 'email', 120).toLowerCase();
  const start = str(fd, 'start_date', 10);
  const role = ['member', 'leader', 'admin'].includes(str(fd, 'role', 10)) ? str(fd, 'role', 10) : 'member';
  const team = str(fd, 'team', 40) || null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
  await supabase.from('invites').upsert({ email, role, team, start_date: isoOk(start) ? start : null });

  // Người này đã từng đăng nhập: áp nhóm/ngày bắt đầu/vai trò cho hồ sơ hiện có (trước đây chỉ có tác dụng với người mới).
  const { data: existing } = await supabase.from('profiles').select('id,full_name').ilike('email', email).maybeSingle();
  let applied = false;
  if (existing) {
    const patch: Record<string, string | null> = { team };
    if (isoOk(start)) patch.start_date = start;
    if (existing.id !== me.id) patch.role = role;
    await supabase.from('profiles').update(patch).eq('id', existing.id);
    applied = true;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://team-3-x.vercel.app';
  const mail = await sendInviteMail(email, existing?.full_name || email.split('@')[0], site);
  revalidatePath('/', 'layout');
  redirect(`/admin?invite=${mail}${applied ? '&applied=1' : ''}`);
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
