import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PASSWORD_HASH_PREFIX = "scrypt";
const PASSWORD_KEY_LENGTH = 64;

const isHex = (value: string): boolean => /^[a-f0-9]+$/i.test(value);

export const isPasswordHash = (value: string): boolean => {
  const parts = value.split(":");
  if (parts.length !== 3 || parts[0] !== PASSWORD_HASH_PREFIX) {
    return false;
  }

  const salt = parts[1];
  const hash = parts[2];

  return salt.length > 0 && hash.length > 0 && hash.length % 2 === 0 && isHex(salt) && isHex(hash);
};

export const hashPassword = (password: string): string => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");
  return `${PASSWORD_HASH_PREFIX}:${salt}:${hash}`;
};

export const verifyPassword = (input: string, stored: string): boolean => {
  if (!stored) {
    return false;
  }

  if (!isPasswordHash(stored)) {
    return input === stored;
  }

  const [, salt, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(input, salt, expected.length);

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
};

export const needsPasswordHashUpgrade = (stored: string): boolean => !isPasswordHash(stored);
