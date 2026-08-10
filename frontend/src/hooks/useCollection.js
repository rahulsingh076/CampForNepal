// Loads a list through dataClient and reports loading, error, and empty states.
import { useCallback, useEffect, useState } from 'react'
import { listItems } from '../lib/dataClient.js'
import useDataChange from './useDataChange.js'

export default function useCollection(entity, options = {}) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', items: [], meta: {} })
  const version = useDataChange([entity])

  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  // Callers pass an object literal, so a fresh identity arrives every render.
  // Comparing the serialised form is what stops this effect looping forever.
  const key = JSON.stringify(options)

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, status: 'loading' }))

    listItems(entity, JSON.parse(key))
      .then((result) => {
        if (!active) return
        setState({
          status: result.success ? 'ready' : 'error',
          items: result.data || [],
          meta: result.meta || {},
        })
      })
      .catch(() => {
        if (active) setState({ status: 'error', items: [], meta: {} })
      })

    return () => {
      active = false
    }
  }, [entity, key, attempt, version])

  return { ...state, reload }
}

// Keeps a hand-picked list in the order the CMS asked for, not the seed order.
export function orderByIds(items, ids = []) {
  if (!ids.length) return items
  return ids.map((id) => items.find((item) => item.id === id)).filter(Boolean)
}
