import { randomInt } from "node:crypto";

// No 0/O, 1/l/I or other characters that are easy to misread when a password is read out or copied by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/** A random password to hand to someone. The person must change it at their first login. */
export function generateTemporaryPassword(length = 10) {
  let password = "";
  for (let i = 0; i < length; i++) password += ALPHABET[randomInt(ALPHABET.length)];
  return password;
}
