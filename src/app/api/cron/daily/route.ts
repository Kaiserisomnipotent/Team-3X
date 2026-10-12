// Email nhắc mỗi sáng (Vercel Cron gọi lúc 7:00 giờ VN — xem vercel.json).
// - Mỗi nhân sự: việc quá hạn, việc đến hạn trong giai đoạn, việc leader giao sắp hạn, nhắc check-in.
// - Thứ Hai: leader/admin nhận thêm bản tóm tắt cả team.
import { NextResponse, type NextRequest } from 'next/server';
import { mailLayout, mailReady, sendMails, type Mail } from '@/lib/mail';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { loadTeam } from '@/lib/teamData';
import { dayNum, dayOf, fmtDate, fmtNum, isoFromNum, nextTasks, todayISO } from '@/lib/journey';
import type { AssignedTask, Profile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const wrap = (title: string, body: string, site: string) => mailLayout(title, body, site);
const li = (items: string[]) => `<ul style="padding-left:18px;margin:6px 0 14px;line-height:1.6">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!mailReady()) return NextResponse.json({ error: 'Chưa cấu hình email (GMAIL_USER + GMAIL_APP_PASSWORD hoặc RESEND_API_KEY)' }, { status: 500 });
  const site = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const db = supabaseAdmin();
  const today = todayISO(), yesterday = isoFromNum(dayNum(today) - 1), soon = isoFromNum(dayNum(today) + 2);

  const [pr, tp, ci, at] = await Promise.all([
    db.from('profiles').select('*').in('role', ['member', 'leader', 'admin']),
    db.from('task_progress').select('user_id,task_id'),
    db.from('checkins').select('user_id').eq('checkin_date', yesterday),
    db.from('assigned_tasks').select('*').neq('status', 'done').lte('due_date', soon),
  ]);
  const profiles = (pr.data || []) as Profile[];
  const doneBy = new Map<string, Set<string>>();
  (tp.data || []).forEach(r => { const s = doneBy.get(r.user_id) || new Set(); s.add(r.task_id); doneBy.set(r.user_id, s); });
  const checkedYesterday = new Set((ci.data || []).map(r => r.user_id as string));
  const tasksBy = new Map<string, AssignedTask[]>();
  ((at.data || []) as AssignedTask[]).forEach(t => tasksBy.set(t.assignee, [...(tasksBy.get(t.assignee) || []), t]));

  const emails: Mail[] = [];
  for (const p of profiles) {
    if (p.role !== 'member') continue; // leader/admin không nhận nhắc học
    const day = dayOf(p.start_date, today);
    const open = nextTasks(p.start_date, doneBy.get(p.id) || new Set(), 6, today);
    const overdue = open.filter(o => o.st.cls === 's-down'), current = open.filter(o => o.st.cls === 's-ref');
    const mine = tasksBy.get(p.id) || [];
    let body = `<p style="margin:0 0 12px">Chào ${esc(p.full_name || '')}, hôm nay là <b>ngày ${day}/99</b> trong hành trình của bạn.</p>`;
    if (!checkedYesterday.has(p.id) && day > 1) body += `<p style="background:#FBE6E3;padding:8px 12px;border-radius:6px">Hôm qua bạn chưa check-in. Nhớ check-in cuối ngày hôm nay nhé.</p>`;
    if (overdue.length) body += `<b style="color:#CF3A2E">Quá hạn (${overdue.length})</b>` + li(overdue.map(o => esc(o.t.t)));
    if (current.length) body += `<b>Đang trong hạn</b>` + li(current.map(o => `${esc(o.t.t)} <span style="color:#566076">· ${esc(o.st.label)}</span>`));
    if (mine.length) body += `<b>Việc leader giao sắp đến hạn</b>` + li(mine.map(t => `${esc(t.title)} <span style="color:#566076">· hạn ${fmtDate(t.due_date)}</span>`));
    if (!overdue.length && !current.length && !mine.length) body += `<p>Không có việc nào tồn đọng. Giữ nhịp live và nhắn Zalo đều tay!</p>`;
    emails.push({ to: p.email, subject: `Ngày ${day}/99 · ${overdue.length ? overdue.length + ' việc quá hạn' : 'việc cần làm hôm nay'}`, html: wrap(`Ngày ${day}/99`, body, site) });
  }

  // Thứ Hai (giờ VN): tóm tắt tuần cho leader/admin
  const weekday = new Date(today + 'T00:00:00Z').getUTCDay();
  if (weekday === 1 || req.nextUrl.searchParams.get('weekly') === '1') {
    const { rows } = await loadTeam(db);
    const allMembers = rows.filter(r => r.p.role === 'member');
    // Admin nhận cả team; leader chỉ nhận nhóm mình phụ trách.
    for (const s of profiles.filter(p => p.role === 'leader' || p.role === 'admin')) {
      const members = s.role === 'admin' ? allMembers : allMembers.filter(r => r.p.leader_id === s.id);
      if (!members.length) continue;
      const table = `<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="background:#E8ECF1"><th align="left" style="padding:6px">Nhân sự</th><th>Ngày</th><th>Tiến độ</th><th>Quá hạn</th><th>Kỳ này</th><th>Check-in 7 ngày</th></tr>${members.map(r => `<tr style="border-top:1px solid #D6DCE5"><td style="padding:6px">${esc(r.p.full_name || r.p.email)}</td><td align="center">${r.s.day}</td><td align="center">${r.s.pct}%</td><td align="center" style="color:${r.s.overdue ? '#CF3A2E' : '#566076'}">${r.s.overdue}</td><td align="center">${r.ks.tk} TK · ${fmtNum(r.ks.net)} tr</td><td align="center">${r.checkins7}/7</td></tr>`).join('')}</table>`;
      const behind = members.filter(r => r.s.overdue > 0 || r.checkins7 < 4);
      const body = (behind.length ? `<p><b>Cần kèm tuần này:</b> ${behind.map(r => esc(r.p.full_name || r.p.email)).join(', ')}</p>` : '<p>Cả nhóm đang đúng tiến độ.</p>') + table;
      emails.push({ to: s.email, subject: `Tóm tắt tuần ${s.role === 'admin' ? 'Team 3X' : 'nhóm của bạn'} · ${fmtDate(today)}`, html: wrap('Tóm tắt tuần', body, site + '/team') });
    }
  }

  const { sent, errors } = await sendMails(emails);
  return NextResponse.json({ date: today, sent, errors });
}
