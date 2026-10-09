import type { Metadata, Viewport } from 'next';
import './lead.css';
import './extra.css';

export const metadata: Metadata = {
  title: 'Hành trình 99 ngày · Team 3X',
  description: 'Hệ thống đào tạo nội bộ: lộ trình 99 ngày, quy trình chuẩn, kiến thức và bài kiểm tra',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('t3x.theme');if(t)document.documentElement.setAttribute('data-theme',JSON.parse(t))}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
