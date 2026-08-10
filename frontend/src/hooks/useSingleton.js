import { useCallback, useEffect, useState } from 'react'
import { getSingleton } from '../lib/dataClient.js'

// Mirrors useCollection for singleton CMS records.
export default function useSingleton(name) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', data: null, error: '' })
  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    getSingleton(name)
      .then((result) => {
        if (!active) return
        setState({ status: result.success ? 'ready' : 'error', data: result.data || null, error: result.message || '' })
      })
      .catch(() => {
        if (active) setState({ status: 'error', data: null, error: 'Could not load this content.' })
      })
    return () => { active = false }
  }, [attempt, name])

  return { ...state, reload }
}
