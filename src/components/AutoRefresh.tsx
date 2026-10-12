'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Tự tải lại dữ liệu khi quay lại tab và mỗi 30 giây, để check-in / yêu cầu hỗ trợ / số đếm luôn khớp nhau. */
export default function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const go = () => { if (document.visibilityState === 'visible') router.refresh(); };
    const t = setInterval(go, seconds * 1000);
    document.addEventListener('visibilitychange', go);
    window.addEventListener('focus', go);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', go); window.removeEventListener('focus', go); };
  }, [router, seconds]);
  return null;
}
