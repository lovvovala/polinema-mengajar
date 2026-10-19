import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const ALFABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa karakter membingungkan (0/O, 1/I)

export function generateKode(panjang = 8) {
  const bytes = crypto.randomBytes(panjang);
  let out = '';
  for (let i = 0; i < panjang; i++) out += ALFABET[bytes[i] % ALFABET.length];
  return out;
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
