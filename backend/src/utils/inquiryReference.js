// The public reference code: CFN-2026-7K9Q2M
//
// This is the only identifier a person ever sees for their inquiry, so it has
// two jobs that pull against each other — it has to be readable over the phone,
// and it has to be unguessable.
//
// Unguessable matters because a reference code is the natural thing to build a
// "check my inquiry" lookup on later. If codes were sequential, anybody could
// walk the range and read other people's requests. They are random from a
// CSPRNG instead, so that door stays closed even if a future lookup flow opens it.
//
// The MongoDB `_id` is deliberately not used: an ObjectId leaks its creation
// time and a rough insertion order, and it is not something anyone can read
// aloud.
import { randomInt } from 'node:crypto'

// No O/0, no I/1, no S/5, no B/8. Somebody reading a code down the phone gets
// these wrong constantly, and a support call that starts with "is that a letter
// or a number" is a support call that did not need to happen.
export const REFERENCE_ALPHABET = '23456789ACDEFGHJKLMNPQRTUVWXYZ'

export const REFERENCE_LENGTH = 6

// 30 characters, 6 positions = 729 million combinations per prefix per year.
// Enough that guessing is pointless and collisions are rare.
export const REFERENCE_COMBINATIONS = REFERENCE_ALPHABET.length ** REFERENCE_LENGTH

// crypto.randomInt, not Math.random. Math.random is seeded predictably enough
// that an attacker who sees a handful of codes could narrow the rest — and it
// would still pass every test, which is what makes it dangerous.
//
// `random` is injectable so a test can pin the output. It defaults to the
// secure generator, and no production path ever passes anything else.
export function generateReferenceCode({
  prefix = 'CFN',
  year = new Date().getFullYear(),
  random = (max) => randomInt(max),
} = {}) {
  let code = ''
  for (let index = 0; index < REFERENCE_LENGTH; index += 1) {
    code += REFERENCE_ALPHABET[random(REFERENCE_ALPHABET.length)]
  }
  return `${prefix}-${year}-${code}`
}

export function isReferenceCode(value, prefix = 'CFN') {
  if (typeof value !== 'string') return false
  const pattern = new RegExp(`^${prefix}-\\d{4}-[${REFERENCE_ALPHABET}]{${REFERENCE_LENGTH}}$`)
  return pattern.test(value)
}

// Generates a code and hands it to `save`, retrying if the unique index rejects
// it as a duplicate.
//
// The retry exists because a uniqueness check followed by an insert is a race:
// two requests can both find the code free and both then try to use it. Letting
// the index be the arbiter and retrying on 11000 is the only version that is
// actually correct under concurrency.
//
// It never reports how many inquiries exist — a "next number" scheme would leak
// exactly that.
export async function withUniqueReference(save, options = {}, attempts = 5) {
  let lastError = null

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const referenceCode = generateReferenceCode(options)
    try {
      return await save(referenceCode)
    } catch (error) {
      // 11000 is MongoDB's duplicate key. Anything else is a real failure and
      // must not be retried — retrying a validation error just repeats it.
      const isDuplicateReference =
        error?.code === 11000 && Object.keys(error.keyPattern || {}).includes('referenceCode')
      if (!isDuplicateReference) throw error
      lastError = error
    }
  }

  throw lastError || new Error('Could not allocate a unique reference code.')
}

export default { generateReferenceCode, isReferenceCode, withUniqueReference }
