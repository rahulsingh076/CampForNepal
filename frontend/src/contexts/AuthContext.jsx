// Mock login state. Checks demo accounts through dataClient and keeps the
// session in localStorage — there is no real authentication in Version 1.
import { createContext, useContext, useEffect, useState } from 'react'
import { createItem, getItem, listItems } from '../lib/dataClient.js'
import { readJson, removeKey, writeJson } from '../lib/storage.js'
import { CUSTOMER_ROLES, STAFF_ROLES } from '../config/navigation.js'
import { useLocale } from './LocaleContext.jsx'

const SESSION_KEY = 'session'

const AuthContext = createContext(null)

function canStartPortalSession(account) {
  return CUSTOMER_ROLES.includes(account.role) || STAFF_ROLES.includes(account.role)
}

export function AuthProvider({ children }) {
  const locale = useLocale()
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // Restore a saved session. Only the id is stored, so the record stays fresh.
  useEffect(() => {
    if (!locale.ready) return

    const session = readJson(SESSION_KEY)
    if (!session?.userId) {
      setReady(true)
      return
    }

    let active = true
    getItem('users', session.userId).then((result) => {
      if (!active) return
      if (result.success && result.data.status === 'active' && canStartPortalSession(result.data)) {
        setUser(result.data)
        syncLocale(result.data)
      } else {
        removeKey(SESSION_KEY)
      }
      setReady(true)
    })
    return () => {
      active = false
    }
  }, [locale.ready])

  function syncLocale(account) {
    if (account.country) {
      locale.setCountry(account.country, {
        language: account.preferences?.language,
        currency: account.preferences?.currency,
      })
      return
    }

    if (account.preferences?.language) locale.setLanguage(account.preferences.language)
    if (account.preferences?.currency) locale.setCurrency(account.preferences.currency)
  }

  function startSession(account) {
    writeJson(SESSION_KEY, { userId: account.id })
    setUser(account)
    syncLocale(account)
  }

  // Fetch-all-and-compare is fine here: a small demo user list, browser only.
  async function login(email, password) {
    const result = await listItems('users', { pageSize: 0 })
    if (!result.success) return { success: false, message: result.message }

    const account = result.data.find(
      (row) => row.email.toLowerCase() === String(email).trim().toLowerCase()
    )
    if (!account || account.password !== password || account.status !== 'active') {
      return { success: false, message: 'Email or password did not match a demo account.' }
    }
    if (!canStartPortalSession(account)) {
      return { success: false, message: 'Guide accounts do not have a self-service portal in this demo.' }
    }

    startSession(account)
    return { success: true, message: '', data: account }
  }

  // Same demo credential check as login, scoped to the operations panel.
  // Only Admin and Super Admin create a staff session from /admin/login.
  async function loginStaff(email, password) {
    const result = await listItems('users', { pageSize: 0 })
    if (!result.success) return { success: false, message: result.message }

    const account = result.data.find(
      (row) => row.email.toLowerCase() === String(email).trim().toLowerCase()
    )
    if (!account || account.password !== password || account.status !== 'active') {
      return { success: false, message: 'Email or password did not match a demo account.' }
    }
    if (!STAFF_ROLES.includes(account.role)) return { success: false, message: 'This sign-in is only for Admin or Super Admin accounts.' }

    startSession(account)
    return { success: true, message: '', data: account }
  }

  // One-click demo login: signs in as the first active account with this role.
  async function loginAs(role) {
    const result = await listItems('users', { filters: { role, status: 'active' } })
    if (!result.success || result.data.length === 0) {
      return { success: false, message: `No demo account has the ${role} role.` }
    }
    const account = result.data[0]
    if (!canStartPortalSession(account)) {
      return { success: false, message: 'This demo role does not have a self-service portal.' }
    }
    startSession(account)
    return { success: true, message: '', data: account }
  }

  // Registration writes a customer account to the localStorage overlay.
  async function register(details) {
    const existing = await listItems('users', { pageSize: 0 })
    if (!existing.success) return { success: false, message: existing.message }

    const taken = existing.data.some(
      (row) => row.email.toLowerCase() === details.email.trim().toLowerCase()
    )
    if (taken) return { success: false, message: 'An account with this email already exists.' }

    const result = await createItem(
      'users',
      {
        fullName: details.fullName.trim(),
        email: details.email.trim(),
        password: details.password,
        role: 'customer',
        avatar: null,
        phone: null,
        country: details.country || 'XX',
        guideId: null,
        preferences: {
          language: details.language || 'en',
          currency: details.currency || 'USD',
          emailUpdates: true,
        },
        lastLoginAt: null,
        status: 'active',
      },
      { id: 'public', fullName: details.fullName.trim() }
    )

    if (result.success) startSession(result.data)
    return result
  }

  function logout() {
    removeKey(SESSION_KEY)
    setUser(null)
  }

  // Profile edits land here so the header and layouts update immediately.
  function refreshUser(account) {
    setUser(account)
  }

  const value = {
    user,
    role: user?.role || null,
    ready,
    login,
    loginStaff,
    loginAs,
    register,
    logout,
    refreshUser,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
