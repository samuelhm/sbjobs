import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export const hashPassword = async (password) => {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64')}$${Buffer.from(key).toString('base64')}`;
};

export const verifyPassword = async (password, encodedHash) => {
  const [algorithm, n, r, p, saltB64, keyB64] = String(encodedHash || '').split('$');

  if (algorithm !== 'scrypt' || !saltB64 || !keyB64) {
    return false;
  }

  const salt = Buffer.from(saltB64, 'base64');
  const expectedKey = Buffer.from(keyB64, 'base64');
  const actualKey = await scrypt(password, salt, expectedKey.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  return timingSafeEqual(expectedKey, Buffer.from(actualKey));
};
