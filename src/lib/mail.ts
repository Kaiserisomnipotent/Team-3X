import 'server-only';
import { Resend } from 'resend';

const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export type MailResult = 'sent' | 'failed' | 'nokey';

/** Gửi email mời vào học viện. Không bao giờ ném lỗi: thất bại thì trả về 'failed'. */
export async function sendInviteMail(to: string, who: string, siteUrl: string): Promise<MailResult> {
  if (!process.env.RESEND_API_KEY) return 'nokey';
  const from = process.env.EMAIL_FROM || 'Học viện Team 3X <onboarding@resend.dev>';
  const html = `<!doctype html><html><body style="margin:0;background:#F1F3F6;font-family:Arial,sans-serif;color:#111725">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#0D121C;color:#E7EBF3;padding:12px 16px;border-radius:6px 6px 0 0;font:600 12px monospace;letter-spacing:.12em">TEAM 3X · HÀNH TRÌNH 99 NGÀY</div>
<div style="background:#fff;border:1px solid #D6DCE5;border-top:0;border-radius:0 0 6px 6px;padding:20px">
<h2 style="margin:0 0 12px;font-size:20px">Bạn đã được mời vào Học viện Team 3X</h2>
<p style="margin:0 0 12px">Chào ${esc(who)}, leader đã thêm bạn vào hệ thống đào tạo nội bộ. Đăng nhập bằng đúng Gmail này (${esc(to)}) để bắt đầu hành trình 99 ngày.</p>
<p style="margin:20px 0 0"><a href="${esc(siteUrl)}" style="background:#111725;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">Đăng nhập</a></p>
</div></div></body></html>`;
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from, to, subject: 'Bạn được mời vào Học viện Team 3X', html });
    return error ? 'failed' : 'sent';
  } catch {
    return 'failed';
  }
}
