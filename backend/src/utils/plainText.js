// Everything a person types is stored as plain text. Nothing here produces or
// stores HTML.
//
// This deliberately does **not** try to sanitise HTML. Regex-stripping tags is
// how sanitisers get bypassed, and a "cleaned" string tempts the next person to
// render it with dangerouslySetInnerHTML. Storing `<b>hello</b>` verbatim is
// safe precisely because React escapes it on the way out — the text is
// untrusted at rest and treated as untrusted at render.
//
// The rule this file enforces: what the person wrote is what gets stored,
// minus characters that would corrupt storage or a log line.

// U+0000 truncates C strings and can hide the rest of a value from a log or a
// terminal. Nobody types one.
const NULL_BYTE = /\x00/g

// Everything except tab and newline. These would let somebody smuggle terminal
// escape sequences into a staff member's console.
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_CHARACTERS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g

export function normalizeLineEndings(value) {
  return String(value).replace(/\r\n?/g, '\n')
}

// Trims, normalises newlines, and removes control characters. Ordinary Unicode
// survives untouched: Nepali, Korean, accents, emoji, and punctuation are all
// things people legitimately write.
export function toPlainText(value, { trim = true } = {}) {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') return ''

  let text = normalizeLineEndings(value).replace(NULL_BYTE, '').replace(CONTROL_CHARACTERS, '')
  // Three or more blank lines add nothing and make a CRM list unreadable.
  text = text.replace(/\n{3,}/g, '\n\n')
  return trim ? text.trim() : text
}

// A single line: newlines collapse to spaces. For subjects and names, where a
// newline would break every list view that renders them.
export function toPlainLine(value) {
  return toPlainText(value).replace(/\s*\n\s*/g, ' ').replace(/[ \t]{2,}/g, ' ').trim()
}

// True when the value contains something no legitimate submission would.
export function hasUnsafeCharacters(value) {
  if (typeof value !== 'string') return false
  return NULL_BYTE.test(value) || CONTROL_CHARACTERS.test(value)
}

export function exceedsLength(value, maximum) {
  return typeof value === 'string' && value.length > maximum
}

export default { toPlainText, toPlainLine, normalizeLineEndings, hasUnsafeCharacters }
