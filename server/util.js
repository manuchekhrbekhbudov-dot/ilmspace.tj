import crypto from 'node:crypto';

// Вақти Душанбе: UTC+5, бе гузариши тобистона
export const TZ_OFFSET_MIN = 300;

export function localToUtcIso(date, time = '00:00') {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - TZ_OFFSET_MIN * 60000).toISOString();
}
export function dushanbeDate(iso = new Date().toISOString()) {
  return new Date(new Date(iso).getTime() + TZ_OFFSET_MIN * 60000).toISOString().slice(0, 10);
}
// Санаҳои дарс: аз start_date, рӯзҳои ҳафтаи интихобшуда (1=душанбе … 7=якшанбе)
export function lessonDates(startDate, weekdays, count) {
  const days = new Set(String(weekdays).split(',').map(Number));
  const [y, m, d] = startDate.split('-').map(Number);
  const out = []; let t = Date.UTC(y, m - 1, d);
  for (let guard = 0; out.length < count && guard < 400; guard++, t += 86400000) {
    const wd = new Date(t).getUTCDay() || 7;
    if (days.has(wd)) out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(pw, salt, 32).toString('hex');
  return `${salt}:${h}`;
}
export function checkPassword(pw, stored) {
  const [salt, h] = String(stored).split(':');
  if (!salt || !h) return false;
  const got = crypto.scryptSync(pw, salt, 32);
  return crypto.timingSafeEqual(got, Buffer.from(h, 'hex'));
}
export const token = (n = 24) => crypto.randomBytes(n).toString('base64url');
export function inviteCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i = 0; i < 6; i++) s += A[crypto.randomInt(A.length)];
  return s;
}
export const J = s => { try { return JSON.parse(s); } catch { return null; } };

export class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
export const bad = (m, x) => new HttpError(400, m, x);
export const forbidden = (m = 'Дастрасӣ нест.') => new HttpError(403, m);
export const notFound = (m = 'Ёфт нашуд.') => new HttpError(404, m);
