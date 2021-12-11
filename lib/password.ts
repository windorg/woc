import { createHash, randomBytes, timingSafeEqual } from 'crypto'

// Important! The salt should be base64-encoded
function pwstore_pbkdf1(password: Buffer, salt: string, iter: number): Buffer {
  let hash: Buffer = createHash('sha256').update(password).update(salt).digest()
  for (let i = 0; i < iter + 1; i++) {
    hash = createHash('sha256').update(hash).digest()
  }
  return hash
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64')
  const strength = 17
  const hash = pwstore_pbkdf1(Buffer.from(password, 'utf8'), salt, Math.pow(2, strength)).toString('base64')
  return `sha256|${strength}|${salt}|${hash}`
}

// Checks password stored in pwstore-fast format
export function checkPassword(password: string, pwstring: string): boolean {
  const [algo, strength, salt, hash] = pwstring.split('|')
  if (algo != 'sha256')
    return false
  // NB: pwstore-fast doesn't decode the salt from base64 before doing the hashing
  const res = pwstore_pbkdf1(Buffer.from(password, 'utf8'), salt, Math.pow(2, parseInt(strength)))
  return timingSafeEqual(Buffer.from(hash, 'base64'), res)
}
