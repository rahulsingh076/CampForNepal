// Loads the country, language, and currency lists used by the locale pickers.
import { useCallback, useEffect, useState } from 'react'
import { listItems } from '../lib/dataClient.js'

export default function useLocaleOptions() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    status: 'loading',
    countries: [],
    languages: [],
    currencies: [],
  })

  // Wrapped so the retry button gets a stable function to call.
  const reload = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    let active = true
    setState((current) => ({ ...current, status: 'loading' }))

    Promise.all([listItems('countries'), listItems('languages'), listItems('currencies')])
      .then(([countries, languages, currencies]) => {
        if (!active) return

        const ok = countries.success && languages.success && currencies.success
        setState({
          status: ok ? 'ready' : 'error',
          countries: countries.data || [],
          languages: languages.data || [],
          currencies: currencies.data || [],
        })
      })
      .catch(() => {
        if (active) setState((current) => ({ ...current, status: 'error' }))
      })

    return () => {
      active = false
    }
  }, [attempt])

  return { ...state, reload }
}
