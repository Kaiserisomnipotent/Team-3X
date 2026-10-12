import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Ai chưa đăng nhập thì chỉ vào được trang đăng nhập. Mọi trang nội dung đều cần đăng nhập.
const PUBLIC = ['/login', '/auth/callback', '/api/cron'];

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const path = req.nextUrl.pathname;
  if (!user && !PUBLIC.some(p => path.startsWith(p))) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }
  // Đã đăng nhập nhưng chưa duyệt / đã bị khoá: chặn ở MỌI request (kể cả chuyển trang kiểu SPA, server action, API).
  if (user && !PUBLIC.some(p => path.startsWith(p)) && !['/cho-duyet', '/auth/signout'].some(p => path.startsWith(p))) {
    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const role = prof?.role as string | undefined;
    if (!role || !['member', 'leader', 'admin'].includes(role)) {
      if (path.startsWith('/api/')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      const url = req.nextUrl.clone();
      url.pathname = role === 'disabled' ? '/login' : '/cho-duyet';
      url.search = role === 'disabled' ? '?error=disabled' : '';
      return NextResponse.redirect(url);
    }
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)'],
};
