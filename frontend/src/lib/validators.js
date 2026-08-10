// Field checks shared by every form. Each returns an error string, or null.

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Digits, spaces, brackets, dashes and one optional leading plus.
const PHONE_SHAPE = /^\+?[\d\s()-]{7,20}$/

export function required(value, label = 'This field') {
  const filled = typeof value === 'string' ? value.trim() : value
  if (filled === '' || filled === false || filled === null || filled === undefined) {
    return `${label} is needed.`
  }
  return null
}

export function email(value) {
  if (!value) return null
  return EMAIL_SHAPE.test(value.trim()) ? null : 'That does not look like an email address.'
}

export function phone(value) {
  if (!value) return null
  return PHONE_SHAPE.test(value.trim())
    ? null
    : 'Use digits, spaces and an optional country code, like +977 98 1234 5678.'
}

export function minLength(value, length, label = 'This field') {
  if (!value) return null
  return value.trim().length >= length
    ? null
    : `${label} needs at least ${length} characters.`
}

export function maxLength(value, length, label = 'This field') {
  if (!value) return null
  return value.trim().length <= length ? null : `${label} must be under ${length} characters.`
}

// Runs one field's rules and returns the first problem found.
export function validateField(value, rule = {}) {
  const label = rule.label || 'This field'

  if (rule.required) {
    const problem = required(value, label)
    if (problem) return problem
  }
  if (rule.type === 'email') {
    const problem = email(value)
    if (problem) return problem
  }
  if (rule.type === 'phone') {
    const problem = phone(value)
    if (problem) return problem
  }
  if (rule.min) {
    const problem = minLength(value, rule.min, label)
    if (problem) return problem
  }
  if (rule.max) {
    const problem = maxLength(value, rule.max, label)
    if (problem) return problem
  }

  return null
}

// Runs every rule and returns { field: message } for the ones that failed.
export function validateForm(values, rules) {
  const errors = {}

  Object.entries(rules).forEach(([field, rule]) => {
    const problem = validateField(values[field], rule)
    if (problem) errors[field] = problem
  })

  return errors
}
