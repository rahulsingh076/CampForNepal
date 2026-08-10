// Loads one record by id or slug, telling a page apart from "still loading",
// "no such thing", and "something broke".
import { useCallback, useEffect, useState } from 'react'
import { getItem } from '../lib/dataClient.js'

export default function useRecord(entity, idOrSlug) {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({ status: 'loading', item: null })

  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setState({ status: 'loading', item: null })

    getItem(entity, idOrSlug)
      .then((result) => {
        if (!active) return
        // dataClient reports a missing record as an unsuccessful read, which is
        // a 404 for the page, not an error state.
        setState(
          result.success
            ? { status: 'ready', item: result.data }
            : { status: 'notFound', item: null }
        )
      })
      .catch(() => {
        if (active) setState({ status: 'error', item: null })
      })

    return () => {
      active = false
    }
  }, [entity, idOrSlug, attempt])

  return { ...state, reload }
}
