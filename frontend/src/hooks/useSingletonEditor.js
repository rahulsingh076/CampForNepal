import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useToast } from '../components/admin/Toast.jsx'
import { updateSingleton } from '../lib/dataClient.js'
import useSingleton from './useSingleton.js'

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

// Gives singleton-backed admin forms the same feedback and audit behavior as
// the collection CRUD screens.
export default function useSingletonEditor(name) {
  const source = useSingleton(name)
  const { user } = useAuth()
  const { showToast } = useToast()
  const [draft, setDraft] = useState(null)
  const [saved, setSaved] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (source.status !== 'ready') return
    const next = clone(source.data)
    setDraft(next)
    setSaved(next)
  }, [source.data, source.status])

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved])

  useEffect(() => {
    if (!dirty) return undefined
    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [dirty])

  async function save(message = 'Changes saved.') {
    if (!draft || busy) return false
    setBusy(true)
    const result = await updateSingleton(name, draft, user)
    setBusy(false)
    if (!result.success) {
      showToast(result.message || 'Could not save these changes.', 'error')
      return false
    }
    const next = clone(result.data)
    setDraft(next)
    setSaved(next)
    showToast(`${message} Audit log updated.`)
    return true
  }

  function discard() {
    setDraft(clone(saved))
  }

  return { ...source, draft, setDraft, busy, dirty, save, discard }
}
