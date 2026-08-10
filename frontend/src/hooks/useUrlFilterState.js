// Keeps a listing's simple filter values shareable in the URL and in sync with Back.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function readValues(params, defaults) {
  return Object.fromEntries(
    Object.keys(defaults).map((key) => [key, params.get(key) || defaults[key]])
  )
}

function valuesMatch(left, right) {
  return Object.keys(left).every((key) => left[key] === right[key])
}

export default function useUrlFilterState(defaults) {
  const [params, setParams] = useSearchParams()
  const [choice, setChoice] = useState(() => readValues(params, defaults))

  useEffect(() => {
    const next = readValues(params, defaults)
    setChoice((current) => (valuesMatch(current, next) ? current : next))
  }, [defaults, params])

  function applyChoice(nextChoice) {
    const nextParams = new URLSearchParams(params)
    Object.keys(defaults).forEach((key) => {
      if (nextChoice[key]) nextParams.set(key, nextChoice[key])
      else nextParams.delete(key)
    })
    setChoice(nextChoice)
    if (nextParams.toString() !== params.toString()) setParams(nextParams)
  }

  function clear() {
    applyChoice({ ...defaults })
  }

  return { choice, applyChoice, clear }
}
