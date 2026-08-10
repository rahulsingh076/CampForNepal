// Password policy, hashing, and verification.
//
// No database: these assert the cryptography and the rules around it, which is
// where a mistake would be silent and expensive.
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  ARGON2_OPTIONS,
  DUMMY_PASSWORD_HASH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  hashPassword,
  passwordNeedsRehash,
  validatePasswordPolicy,
  verifyAgainstDummy,
  verifyPassword,
} from '../../src/utils/password.js'

const GOOD_PASSWORD = 'annapurna-base-camp-2026'

describe('password policy', () => {
  test('a long enough password is accepted', () => {
    assert.equal(validatePasswordPolicy(GOOD_PASSWORD), true)
  })

  test('a short password is rejected with a 400', () => {
    assert.throws(() => validatePasswordPolicy('a'.repeat(MIN_PASSWORD_LENGTH - 1)), {
      status: 400,
    })
  })

  test('an over-long password is rejected, so hashing cannot be used to burn CPU', () => {
    assert.throws(() => validatePasswordPolicy('a'.repeat(MAX_PASSWORD_LENGTH + 1)), {
      status: 400,
    })
  })

  test('a missing or non-string password is rejected', () => {
    for (const value of ['', undefined, null, 12345678901234, {}]) {
      assert.throws(() => validatePasswordPolicy(value), { status: 400 })
    }
  })

  test('Unicode is accepted and counted by characters', () => {
    // A passphrase in Nepali or Korean is a perfectly good password. Rejecting
    // non-ASCII would exclude most of the people this site is built for.
    assert.equal(validatePasswordPolicy('सगरमाथा-आधार-शिविर-यात्रा'), true)
    assert.equal(validatePasswordPolicy('안나푸르나-베이스캠프-트레킹'), true)
    assert.equal(validatePasswordPolicy('🏔️🏔️🏔️🏔️🏔️🏔️🏔️'), true)
  })

  test('a Unicode password round-trips through hashing exactly', async () => {
    const password = 'सगरमाथा-आधार-शिविर-यात्रा'
    const hash = await hashPassword(password)
    assert.equal(await verifyPassword(hash, password), true)
  })

  test('bytes are compared, not normalised forms', async () => {
    // Hangul decomposes under NFD; the composed and decomposed strings look
    // identical on screen but are different bytes. Silently normalising either
    // side would let two distinct strings unlock one account — and would also
    // mean the stored password is not the one that was typed.
    const password = '안나푸르나-베이스캠프-트레킹'
    assert.notEqual(password, password.normalize('NFD'))

    const hash = await hashPassword(password)
    assert.equal(await verifyPassword(hash, password), true)
    assert.equal(await verifyPassword(hash, password.normalize('NFD')), false)
  })

  test('spaces count as characters — a password is never trimmed', () => {
    // '  short  ' is 9 characters; trimming it would leave 5 and change the
    // verdict, which would also mean the stored password differs from the typed
    // one.
    assert.throws(() => validatePasswordPolicy('  short  '), { status: 400 })
    assert.equal(validatePasswordPolicy(`  ${'a'.repeat(MIN_PASSWORD_LENGTH)}  `), true)
  })

  test('a password made only of spaces is still a password', async () => {
    const password = ' '.repeat(MIN_PASSWORD_LENGTH)
    assert.equal(validatePasswordPolicy(password), true)
    const hash = await hashPassword(password)
    // Proof there is no trimming anywhere in the path: a trimmed value would
    // hash as the empty string and verify against it.
    assert.equal(await verifyPassword(hash, password), true)
    assert.equal(await verifyPassword(hash, ''), false)
  })
})

describe('hashing', () => {
  test('a hash is Argon2id with the configured parameters', async () => {
    const hash = await hashPassword(GOOD_PASSWORD)
    assert.match(hash, /^\$argon2id\$/)
    assert.ok(hash.includes(`m=${ARGON2_OPTIONS.memoryCost}`))
    assert.ok(hash.includes(`t=${ARGON2_OPTIONS.timeCost}`))
    assert.ok(hash.includes(`p=${ARGON2_OPTIONS.parallelism}`))
  })

  test('the plaintext never appears in the hash', async () => {
    const hash = await hashPassword(GOOD_PASSWORD)
    assert.ok(!hash.includes(GOOD_PASSWORD))
  })

  test('the same password hashes differently every time — the salt is random', async () => {
    const [first, second] = await Promise.all([
      hashPassword(GOOD_PASSWORD),
      hashPassword(GOOD_PASSWORD),
    ])
    assert.notEqual(first, second)
  })

  test('hashing enforces the policy', async () => {
    await assert.rejects(hashPassword('too-short'), { status: 400 })
  })
})

describe('verification', () => {
  test('the correct password verifies', async () => {
    const hash = await hashPassword(GOOD_PASSWORD)
    assert.equal(await verifyPassword(hash, GOOD_PASSWORD), true)
  })

  test('a wrong password does not', async () => {
    const hash = await hashPassword(GOOD_PASSWORD)
    assert.equal(await verifyPassword(hash, 'annapurna-base-camp-2027'), false)
  })

  test('a one-character difference does not', async () => {
    const hash = await hashPassword(GOOD_PASSWORD)
    assert.equal(await verifyPassword(hash, `${GOOD_PASSWORD} `), false)
  })

  test('a malformed stored hash reads as "no match" rather than throwing', async () => {
    // A thrown error here would surface as a 500, which tells an attacker that
    // this account is different from one with a merely wrong password.
    for (const hash of ['', 'not-a-hash', '$argon2id$broken', null, undefined]) {
      assert.equal(await verifyPassword(hash, GOOD_PASSWORD), false)
    }
  })
})

describe('timing equalisation', () => {
  test('the dummy hash is a real, verifiable Argon2id hash', async () => {
    // If it were malformed, verify would throw immediately and the unknown-email
    // path would return far faster than the wrong-password path — which is
    // precisely the leak the dummy hash exists to prevent.
    assert.match(DUMMY_PASSWORD_HASH, /^\$argon2id\$v=19\$m=19456,p=1,t=2\$/)
    assert.equal(await verifyPassword(DUMMY_PASSWORD_HASH, 'anything at all'), false)
  })

  test('the dummy hash uses the same parameters as a real one, so the cost matches', async () => {
    assert.equal(passwordNeedsRehash(DUMMY_PASSWORD_HASH), false)
  })

  test('verifying against the dummy always reports failure', async () => {
    assert.equal(await verifyAgainstDummy(GOOD_PASSWORD), false)
  })

  test('the unknown-email path costs a comparable amount of time', async () => {
    const realHash = await hashPassword(GOOD_PASSWORD)

    const startReal = process.hrtime.bigint()
    await verifyPassword(realHash, 'the-wrong-password-entirely')
    const realMs = Number(process.hrtime.bigint() - startReal) / 1e6

    const startDummy = process.hrtime.bigint()
    await verifyAgainstDummy('the-wrong-password-entirely')
    const dummyMs = Number(process.hrtime.bigint() - startDummy) / 1e6

    // A loose bound on purpose: this runs on shared CI hardware. It is here to
    // catch an order-of-magnitude difference — a dummy hash that fails instantly
    // would come back roughly a thousand times faster.
    const ratio = Math.max(realMs, dummyMs) / Math.max(1, Math.min(realMs, dummyMs))
    assert.ok(ratio < 10, `timing ratio ${ratio.toFixed(2)} is too large`)
  })
})

describe('rehashing', () => {
  test('a current hash does not need rehashing', async () => {
    assert.equal(passwordNeedsRehash(await hashPassword(GOOD_PASSWORD)), false)
  })

  test('a weaker hash does', () => {
    // Same algorithm, lower memory cost: an account created under old
    // parameters is upgraded on its next successful login.
    assert.equal(
      passwordNeedsRehash('$argon2id$v=19$m=4096,p=1,t=2$c2FsdHNhbHRzYWx0$aGFzaGhhc2hoYXNo'),
      true
    )
  })

  test('a missing hash is treated as needing one', () => {
    assert.equal(passwordNeedsRehash(undefined), true)
  })
})
