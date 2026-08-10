import { useEffect, useState } from 'react'
import { subscribeDataChanges } from '../lib/dataClient.js'

// Components that load several related entities can subscribe once and reuse
// this monotonically increasing value in their existing load effect.
export default function useDataChange(entities = []) {
  const [version, setVersion] = useState(0)
  const key = JSON.stringify([...entities].sort())

  useEffect(() => subscribeDataChanges(({ entity }) => {
    const watched = JSON.parse(key)
    if (entity === '*' || watched.includes(entity)) setVersion((value) => value + 1)
  }), [key])

  return version
}
