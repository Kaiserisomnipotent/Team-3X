import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Client quyền cao nhất — CHỈ dùng trên server cho: chấm điểm kiểm tra, gửi email nhắc. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
}
