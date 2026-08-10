// Saved trips and destinations per signed-in user, kept in localStorage.
// This is visitor UI state, not business content, so it skips dataClient.
import { createContext, useContext, useEffect, useState } from 'react'
import { readJson, writeJson } from '../lib/storage.js'
import { useAuth } from './AuthContext.jsx'

const WISHLIST_KEY = 'wishlist'

const WishlistContext = createContext(null)

function readWishlists() {
  const value = readJson(WISHLIST_KEY, {})
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function uniqueEntries(entries) {
  const seen = new Set()
  return entries.filter((entry) => {
    const key = `${entry?.type}:${entry?.id}`
    if (!entry?.type || !entry?.id || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// The stored shape is { [userId]: [{ type: 'package' | 'destination', id }] }.
export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState([])

  useEffect(() => {
    if (!user) {
      setSaved([])
      return
    }
    const all = readWishlists()
    setSaved(uniqueEntries(Array.isArray(all[user.id]) ? all[user.id] : []))
  }, [user])

  function isSaved(type, id) {
    return saved.some((entry) => entry.type === type && entry.id === id)
  }

  function toggle(type, id) {
    if (!user) return
    setSaved((current) => {
      const exists = current.some((entry) => entry.type === type && entry.id === id)
      const next = exists
        ? current.filter((entry) => !(entry.type === type && entry.id === id))
        : uniqueEntries([...current, { type, id }])
      writeJson(WISHLIST_KEY, { ...readWishlists(), [user.id]: next })
      return next
    })
  }

  const value = { saved, count: saved.length, isSaved, toggle }
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside a WishlistProvider')
  return context
}
