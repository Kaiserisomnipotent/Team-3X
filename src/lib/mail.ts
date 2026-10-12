import 'server-only';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Gửi email. Ưu tiên Gmail của team (miễn phí, không cần tên miền, ~500 mail/ngày):
//   GMAIL_USER=hocvien3x@gmail.com  GMAIL_APP_PASSWORD=<mật khẩu ứng dụng 16 ký tự>
// Nếu không có thì dùng Resend (RESEND_API_KEY, cần tên miền riêng mới gửi được cho người khác).

export type Mail = { to: string; subject: string; html: string };
export type MailResult = 'sent' | 'failed' | 'nokey';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export const mailReady = () => !!((process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) || process.env.RESEND_API_KEY);

/** Gửi một loạt email. Không ném lỗi: trả về số đã gửi và danh sách lỗi. */
export async function sendMails(mails: Mail[]): Promise<{ sent: number; errors: string[] }> {
  const errors: string[] = [];
  let sent = 0;
  if (!mails.length) return { sent, errors };
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const user = process.env.GMAIL_USER;
    const tx = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '') } });
    const from = `Học viện Team 3X <${user}>`;
    for (const m of mails) {
      try { await tx.sendMail({ from, ...m }); sent++; } catch (e) { errors.push(`${m.to}: ${(e as Error).message}`); }
    }
    return { sent, errors };
  }
  if (process.env.RESEND_API_KEY) {
    const from = process.env.EMAIL_FROM || 'Học viện Team 3X <onboarding@resend.dev>';
    const resend = new Resend(process.env.RESEND_API_KEY);
    for (let i = 0; i < mails.length; i += 100) {
      const { error } = await resend.batch.send(mails.slice(i, i + 100).map(m => ({ from, ...m })));
      if (error) errors.push(error.message); else sent += Math.min(100, mails.length - i);
    }
    return { sent, errors };
  }
  return { sent, errors: ['Chưa cấu hình email (GMAIL_USER + GMAIL_APP_PASSWORD hoặc RESEND_API_KEY)'] };
}

/** Khung email chung của học viện. */
export const mailLayout = (title: string, body: string, link: string, cta = 'Mở web học viện') => `<!doctype html><html><body style="margin:0;background:#F1F3F6;font-family:Arial,sans-serif;color:#111725">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#0D121C;color:#E7EBF3;padding:12px 16px;border-radius:6px 6px 0 0;font:600 12px monospace;letter-spacing:.12em">TEAM 3X · HÀNH TRÌNH 99 NGÀY</div>
<div style="background:#fff;border:1px solid #D6DCE5;border-top:0;border-radius:0 0 6px 6px;padding:20px">
<h2 style="margin:0 0 12px;font-size:20px">${title}</h2>${body}
<p style="margin:20px 0 0"><a href="${esc(link)}" style="background:#111725;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">${cta}</a></p>
</div><p style="font-size:12px;color:#566076">Email tự động từ hệ thống đào tạo nội bộ Team 3X.</p></div></body></html>`;

/** Email mời vào học viện. */
export async function sendInviteMail(to: string, who: string, siteUrl: string, inviter?: string): Promise<MailResult> {
  if (!mailReady()) return 'nokey';
  const body = `<p style="margin:0 0 12px">Chào ${esc(who)}, ${inviter ? esc(inviter) : 'leader'} đã thêm bạn vào hệ thống đào tạo nội bộ Team 3X.</p>
<p style="margin:0 0 12px">Bấm nút bên dưới và <b>đăng nhập bằng đúng Gmail này (${esc(to)})</b> để bắt đầu hành trình 99 ngày.</p>`;
  const r = await sendMails([{ to, subject: 'Bạn được mời vào Học viện Team 3X', html: mailLayout('Bạn được mời vào Học viện Team 3X', body, siteUrl, 'Đăng nhập') }]);
  return r.sent ? 'sent' : 'failed';
}
