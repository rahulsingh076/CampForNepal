// Safe localStorage helpers. Every call is wrapped so a blocked or full store never crashes.
const PREFIX = 'cfn:'

// Exported so listeners can match the real, namespaced key in storage events.
export const STORAGE_PREFIX = PREFIX

// Private browsing, disabled storage, or server rendering all land here.
function getStore() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch (error) {
    return null
  }
}

// Most keys are namespaced. Locale keys are not, because their exact names are
// part of the agreed contract (tourism_country, tourism_language, and so on).
function fullKey(key, prefixed) {
  return prefixed ? PREFIX + key : key
}

export function readJson(key, fallback = null, { prefixed = true } = {}) {
  const store = getStore()
  if (!store) return fallback

  try {
    const raw = store.getItem(fullKey(key, prefixed))
    return raw === null ? fallback : JSON.parse(raw)
  } catch (error) {
    // Corrupt or unreadable value: behave as if nothing was saved.
    return fallback
  }
}

export function writeJson(key, value, { prefixed = true } = {}) {
  const store = getStore()
  if (!store) return false

  try {
    store.setItem(fullKey(key, prefixed), JSON.stringify(value))
    return true
  } catch (error) {
    // Usually a full quota. The app keeps working on seed data.
    return false
  }
}

export function removeKey(key, { prefixed = true } = {}) {
  const store = getStore()
  if (!store) return false

  try {
    store.removeItem(fullKey(key, prefixed))
    return true
  } catch (error) {
    return false
  }
}

// Removes only this app's keys, never anything else on the domain.
export function clearAll() {
  const store = getStore()
  if (!store) return false

  try {
    const ours = Object.keys(store).filter((key) => key.startsWith(PREFIX))
    ours.forEach((key) => store.removeItem(key))
    return true
  } catch (error) {
    return false
  }
}
