import 'server-only';
import crypto from 'crypto';

/**
 * Link phát video Bunny Stream có chữ ký, hết hạn sau `ttl` giây.
 * Bật "Embed view token authentication" trong Bunny > Stream > thư viện > Security,
 * và giới hạn "Allowed domains" về đúng tên miền web của team.
 */
export function bunnyEmbedUrl(videoId: string, ttl = 4 * 3600) {
  const lib = process.env.BUNNY_LIBRARY_ID, key = process.env.BUNNY_TOKEN_KEY;
  if (!lib) return null;
  const base = `https://iframe.mediadelivery.net/embed/${lib}/${encodeURIComponent(videoId)}`;
  const params = new URLSearchParams({ autoplay: 'false', preload: 'false', responsive: 'true' });
  if (key) {
    const expires = Math.floor(Date.now() / 1000) + ttl;
    params.set('token', crypto.createHash('sha256').update(key + videoId + expires).digest('hex'));
    params.set('expires', String(expires));
  }
  return `${base}?${params}`;
}
