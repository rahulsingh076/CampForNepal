// Small allowlists for CMS URLs. They keep malformed overlay content from
// becoming a navigation target, image request, or external browser action.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isSafeInternalPath(value) {
  return typeof value === 'string'
    && value.startsWith('/')
    && !value.startsWith('//')
    && !/[\\\u0000-\u001F]/.test(value)
}

export function isSafeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    return value === value.trim() && new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function isSafeImageUrl(value) {
  return isSafeInternalPath(value) || isSafeExternalUrl(value)
}

export function isSafeEmail(value) {
  return typeof value === 'string' && EMAIL_SHAPE.test(value.trim())
}

export function safeInternalPath(value, fallback = '') {
  return isSafeInternalPath(value) ? value : fallback
}

export function safeExternalUrl(value, fallback = '') {
  return isSafeExternalUrl(value) ? value : fallback
}
