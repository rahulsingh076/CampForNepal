// Change notification for the mock data layer. This mirrors the subscription
// point a real API cache would expose, and lets customer and admin views
// refresh after another component — or another tab — writes data.
import { STORAGE_PREFIX } from './storage.js'

const CHANGE_EVENT = 'campfornepal:data-change'

// The overlay is written through storage.js, which namespaces every key.
// Comparing against the bare name here never matched, so a second tab silently
// went stale until it was reloaded.
const OVERLAY_STORAGE_KEY = `${STORAGE_PREFIX}overlay`

export function publishChange(entity) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { entity } }))
}

export function subscribeDataChanges(listener) {
  if (typeof window === 'undefined') return () => {}

  const onChange = (event) => listener(event.detail || { entity: '*' })
  const onStorage = (event) => {
    if (event.key === OVERLAY_STORAGE_KEY) listener({ entity: '*' })
  }

  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
