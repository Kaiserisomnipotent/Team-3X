import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import type { Profile } from './types';

/** Người đang xem + hồ sơ (gọi nhiều lần trong một request chỉ truy vấn một lần). */
export const getMe = cache(async () => {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null as Profile | null };
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  return { supabase, user, profile: (data as Profile) ?? null };
});

/** Chỉ cho người đã được duyệt vào trang. */
export async function requireActive() {
  const me = await getMe();
  if (!me.user) redirect('/login');
  if (!me.profile || me.profile.role === 'pending') redirect('/cho-duyet');
  if (me.profile.role === 'disabled') redirect('/login?error=disabled');
  return me as typeof me & { profile: Profile };
}

export async function requireStaff() {
  const me = await requireActive();
  if (me.profile.role !== 'leader' && me.profile.role !== 'admin') redirect('/');
  return me;
}

export async function requireAdmin() {
  const me = await requireActive();
  if (me.profile.role !== 'admin') redirect('/');
  return me;
}

export const isStaff = (p?: Profile | null) => p?.role === 'leader' || p?.role === 'admin';
