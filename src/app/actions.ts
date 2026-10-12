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
import type { Profile } from '@/lib/types';

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

// ---------- Admin / leader: tài khoản ----------
// Database cũng tự chặn (trigger guard_profile + RLS); kiểm tra ở đây để báo lỗi dễ hiểu.
type Db = Awaited<ReturnType<typeof requireActive>>['supabase'];
type Target = { id: string; email: string; full_name: string; role: string; is_owner: boolean };
const enc = encodeURIComponent;
const adminFail = (msg: string): never => redirect(`/admin?err=${enc(msg)}`);
const dbMsg = (e: { message?: string } | null) => e?.message || 'Không lưu được, thử lại.';
/** So khớp email không phân biệt hoa thường (escape ký tự đại diện của ILIKE như dấu gạch dưới). */
const likeEmail = (email: string) => email.replace(/[\\%_]/g, '\\$&');

async function loadTarget(supabase: Db, id: string): Promise<Target> {
  const { data } = await supabase.from('profiles').select('id,email,full_name,role,is_owner').eq('id', id).maybeSingle();
  if (!data) adminFail('Không tìm thấy tài khoản.');
  return data as Target;
}
/** Không đụng chính mình, không đụng chủ sở hữu; chỉ chủ sở hữu mới đụng admin. */
function guardTarget(me: Profile, t: Target) {
  if (t.id === me.id) adminFail('Không tự khoá, xoá hay đổi vai trò của chính mình.');
  if (t.is_owner) adminFail('Không thể khoá, xoá hay hạ quyền chủ sở hữu.');
  if (t.role === 'admin' && !me.is_owner) adminFail('Chỉ chủ sở hữu mới khoá, xoá hay đổi vai trò admin.');
}
/** Leader phụ trách hợp lệ: tài khoản đang là leader hoặc admin. */
async function leaderOf(supabase: Db, id: string) {
  const { data } = await supabase.from('profiles').select('id,full_name,email,role').eq('id', id).maybeSingle();
  return data && ['leader', 'admin'].includes(data.role) ? { id: data.id as string, name: (data.full_name || data.email) as string } : null;
}

export async function updateMember(fd: FormData) {
  const { supabase, profile: me } = await requireAdmin();
  const t = await loadTarget(supabase, str(fd, 'id', 64));
  const patch: Record<string, unknown> = { full_name: str(fd, 'full_name', 80) };
  const start = str(fd, 'start_date', 10);
  if (isoOk(start)) patch.start_date = start;
  const lid = str(fd, 'leader_id', 64);
  if (lid) {
    const l = await leaderOf(supabase, lid);
    if (!l || l.id === t.id) adminFail('Leader phụ trách không hợp lệ.');
    patch.leader_id = l!.id; patch.team = l!.name;
  } else { patch.leader_id = null; patch.team = null; }
  const role = str(fd, 'role', 10);
  if (role && role !== t.role && ['pending', 'member', 'leader', 'admin', 'disabled'].includes(role)) {
    guardTarget(me, t);
    if (role === 'admin' && !me.is_owner) adminFail('Chỉ chủ sở hữu mới nâng người khác thành admin.');
    patch.role = role;
  }
  const { error } = await supabase.from('profiles').update(patch).eq('id', t.id);
  if (error) adminFail(dbMsg(error));
  revalidatePath('/', 'layout');
  redirect('/admin?acct=saved');
}

/** Khoá / mở khoá: hai action riêng (không dựa vào name/value của nút bấm vì trình duyệt có thể không gửi kèm). */
async function setLock(fd: FormData, lock: boolean) {
  const { supabase, profile: me } = await requireAdmin();
  const t = await loadTarget(supabase, str(fd, 'id', 64));
  guardTarget(me, t);
  const { data, error } = await supabase.from('profiles').update({ role: lock ? 'disabled' : 'member' }).eq('id', t.id).select('id');
  if (error || !data?.length) {
    console.error('setLock', lock, error);
    adminFail(error ? dbMsg(error) : 'Khoá / mở khoá chưa thành công, thử lại.');
  }
  // Khoá luôn ở tầng đăng nhập: không đăng nhập lại, không làm mới phiên được.
  const ban = await supabaseAdmin().auth.admin.updateUserById(t.id, { ban_duration: lock ? '876000h' : 'none' });
  if (ban.error) console.error('setLock ban', ban.error);
  revalidatePath('/', 'layout');
  redirect(`/admin?acct=${lock ? 'locked' : 'unlocked'}`);
}
export async function lockMember(fd: FormData) { await setLock(fd, true); }
export async function unlockMember(fd: FormData) { await setLock(fd, false); }

/** Xoá hẳn tài khoản và toàn bộ dữ liệu của người đó (tiến độ, điểm, check-in…). Không hoàn tác được. */
export async function deleteMember(fd: FormData) {
  const { supabase, profile: me } = await requireAdmin();
  const t = await loadTarget(supabase, str(fd, 'id', 64));
  guardTarget(me, t);
  const admin = supabaseAdmin();
  const { error } = await admin.auth.admin.deleteUser(t.id);
  if (error) { console.error('deleteMember', error); adminFail('Xoá tài khoản chưa thành công, thử lại.'); }
  // Xoá cả lời mời, nếu không họ đăng nhập lại là được duyệt lại ngay.
  await admin.from('invites').delete().ilike('email', likeEmail(t.email));
  revalidatePath('/', 'layout');
  redirect('/admin?acct=deleted');
}

/** Trao / thu quyền chủ sở hữu (tối đa 2 chủ, luôn còn ít nhất 1). Dùng khi bàn giao. */
async function setOwner(fd: FormData, on: boolean) {
  const { supabase, profile: me } = await requireAdmin();
  if (!me.is_owner) adminFail('Chỉ chủ sở hữu mới trao hoặc thu quyền chủ.');
  const { error } = await supabase.from('profiles').update({ is_owner: on }).eq('id', str(fd, 'id', 64));
  if (error) adminFail(dbMsg(error));
  revalidatePath('/', 'layout');
  redirect(`/admin?acct=${on ? 'owner_on' : 'owner_off'}`);
}
export async function grantOwner(fd: FormData) { await setOwner(fd, true); }
export async function revokeOwner(fd: FormData) { await setOwner(fd, false); }

/** Mời người mới. Admin: chọn vai trò + leader phụ trách (mời admin chỉ chủ sở hữu). Leader: chỉ mời nhân sự vào nhóm mình. */
export async function addInvite(fd: FormData) {
  const { supabase, profile: me } = await requireStaff();
  const isAdmin = me.role === 'admin';
  const backTo = isAdmin ? '/admin' : '/nhom';
  const fail = (msg: string): never => redirect(`${backTo}?err=${enc(msg)}`);
  const email = str(fd, 'email', 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail('Gmail không hợp lệ.');
  const start = str(fd, 'start_date', 10);
  let role = 'member';
  let leader: { id: string; name: string } | null = null;
  if (isAdmin) {
    const r = str(fd, 'role', 10);
    role = ['member', 'leader', 'admin'].includes(r) ? r : 'member';
    if (role === 'admin' && !me.is_owner) fail('Chỉ chủ sở hữu mới mời admin.');
    const lid = str(fd, 'leader_id', 64);
    if (lid) { leader = await leaderOf(supabase, lid); if (!leader) fail('Leader phụ trách không hợp lệ.'); }
  } else {
    leader = { id: me.id, name: me.full_name || me.email };
  }

  // Gmail đã có tài khoản chưa (leader không xem được hồ sơ người ngoài nhóm nên tra bằng quyền server).
  const { data: existing } = await supabaseAdmin().from('profiles').select('id,full_name,role,is_owner,leader_id').ilike('email', likeEmail(email)).maybeSingle();
  if (!isAdmin && existing && existing.leader_id !== me.id) fail('Gmail này đã có tài khoản trong hệ thống. Nhờ admin gắn người này vào nhóm của bạn.');

  const { error } = await supabase.from('invites').upsert({
    email, role, team: leader?.name ?? null, leader_id: leader?.id ?? null,
    start_date: isoOk(start) ? start : null, invited_by: me.id,
  });
  if (error) fail(isAdmin ? dbMsg(error) : 'Gmail này đã được mời trước đó.');

  // Admin mời người đã từng đăng nhập: áp leader / ngày bắt đầu / vai trò cho hồ sơ hiện có.
  let applied = false;
  if (isAdmin && existing) {
    const patch: Record<string, unknown> = { leader_id: leader?.id ?? null, team: leader?.name ?? null };
    if (isoOk(start)) patch.start_date = start;
    const canRole = existing.id !== me.id && !existing.is_owner && (me.is_owner || (existing.role !== 'admin' && role !== 'admin'));
    if (canRole) patch.role = role;
    const up = await supabase.from('profiles').update(patch).eq('id', existing.id);
    applied = !up.error;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://team-3-x.vercel.app';
  const mail = await sendInviteMail(email, existing?.full_name || email.split('@')[0], site, me.full_name || undefined);
  revalidatePath('/', 'layout');
  redirect(`${backTo}?invite=${mail}${applied ? '&applied=1' : ''}`);
}
export async function deleteInvite(fd: FormData) {
  const { supabase, profile: me } = await requireStaff();
  await supabase.from('invites').delete().eq('email', str(fd, 'email', 120));
  revalidatePath(me.role === 'admin' ? '/admin' : '/nhom');
}

// ---------- Video bài giảng (admin thêm trên web) ----------
const GUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
export async function addVideo(fd: FormData) {
  const { supabase } = await requireAdmin();
  const vfail = (msg: string): never => redirect(`/video?err=${enc(msg)}`);
  // Chấp nhận dán nguyên link Bunny (embed/play/trang quản lý) hoặc chỉ Video ID.
  const ids = str(fd, 'bunny', 400).match(GUID);
  const bunny_id = ids?.[ids.length - 1]?.toLowerCase();
  if (!bunny_id) vfail('Không tìm thấy Video ID. Dán link video hoặc Video ID lấy từ Bunny (dạng 1a2b3c4d-1234-…).');
  const title = str(fd, 'title', 200);
  if (!title) vfail('Nhập tên video.');
  const { count } = await supabase.from('videos').select('id', { count: 'exact', head: true });
  const { error } = await supabase.from('videos').upsert(
    { bunny_id, title, module: str(fd, 'module', 80), minutes: int(fd, 'minutes') || null, note: str(fd, 'note', 300), sort: count ?? 0 },
    { onConflict: 'bunny_id' },
  );
  if (error) vfail(dbMsg(error));
  revalidatePath('/video');
  redirect(`/video?v=${bunny_id}&ok=1`);
}
export async function deleteVideo(fd: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('videos').delete().eq('id', str(fd, 'id', 64));
  revalidatePath('/video');
  redirect('/video?ok=del');
}

// ---------- Nhật ký xem trang (truy vết nếu nội dung bị lộ) ----------
export async function logView(page: string) {
  const { supabase, profile } = await requireActive();
  await supabase.from('view_logs').insert({ user_id: profile.id, page: page.slice(0, 120) });
}
