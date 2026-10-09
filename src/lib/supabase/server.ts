import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Client Supabase chạy trên server, đăng nhập theo cookie của người đang xem (tuân thủ phân quyền RLS). */
export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); }
        catch { /* gọi từ Server Component: middleware đã làm mới cookie */ }
      },
    },
  });
}
