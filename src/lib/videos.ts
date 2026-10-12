// Video cũ khai báo trong code (vẫn hiện). Từ nay admin thêm video ngay trên web: trang Video bài giảng > "Thêm video".
// Cách cũ (không cần nữa):
// 1) Upload video lên Bunny Stream (thư viện của team).
// 2) Copy "Video ID" (dạng 1a2b3c4d-....) dán vào bunnyId bên dưới.
// 3) Đẩy code lên GitHub — Vercel tự cập nhật web sau 1–2 phút.
export type Video = { bunnyId: string; module: string; title: string; minutes?: number; note?: string };

export const VIDEOS: Video[] = [
  // { bunnyId: 'dan-video-id-vao-day', module: 'Module 1 · TTCK & SSI', title: 'Bảng điện và màu giá', minutes: 12 },
];
