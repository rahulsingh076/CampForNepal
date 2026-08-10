// Holds the visitor's country, language, and currency, and remembers them between visits.
import { createContext, useContext, useEffect, useState } from 'react'
import { translate } from '../config/translations.js'
import { getItem, getSingleton } from '../lib/dataClient.js'
import { readJson, removeKey, writeJson } from '../lib/storage.js'

// Exact key names are part of the agreed contract, so they are not namespaced.
const KEYS = {
  country: 'tourism_country',
  language: 'tourism_language',
  currency: 'tourism_currency',
  done: 'tourism_onboarding_done',
}
const RAW = { prefixed: false }

const DEFAULTS = { country: 'XX', language: 'en', currency: 'USD' }
const RTL_LANGUAGES = new Set(['ar', 'fa', 'he', 'ur'])

const LocaleContext = createContext(null)

export function LocaleProvider({ children }) {
  const [defaults, setDefaults] = useState(DEFAULTS)
  const [country, setCountryState] = useState(DEFAULTS.country)
  const [language, setLanguage] = useState(DEFAULTS.language)
  const [currencyCode, setCurrencyCode] = useState(DEFAULTS.currency)
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [currency, setCurrency] = useState(null)
  const [ready, setReady] = useState(false)

  // Read saved choices first; site defaults only guide visitors without their
  // own preference stored yet.
  useEffect(() => {
    let active = true
    const savedCountry = readJson(KEYS.country, null, RAW)
    const savedLanguage = readJson(KEYS.language, null, RAW)
    const savedCurrency = readJson(KEYS.currency, null, RAW)
    getSingleton('siteSettings').then((result) => {
      if (!active) return
      const nextDefaults = {
        country: DEFAULTS.country,
        language: result.success ? result.data.defaultLanguage || DEFAULTS.language : DEFAULTS.language,
        currency: result.success ? result.data.defaultCurrency || DEFAULTS.currency : DEFAULTS.currency,
      }
      setDefaults(nextDefaults)
      setCountryState(savedCountry || nextDefaults.country)
      setLanguage(savedLanguage || nextDefaults.language)
      setCurrencyCode(savedCurrency || nextDefaults.currency)
      setOnboardingDone(readJson(KEYS.done, false, RAW) === true)
      setReady(true)
    }).catch(() => {
      if (!active) return
      setCountryState(savedCountry || DEFAULTS.country)
      setLanguage(savedLanguage || DEFAULTS.language)
      setCurrencyCode(savedCurrency || DEFAULTS.currency)
      setReady(true)
    })
    return () => { active = false }
  }, [])

  // Keep the full currency record (symbol and demo rate) alongside its code.
  useEffect(() => {
    let active = true
    getItem('currencies', currencyCode).then((result) => {
      if (active) setCurrency(result.success ? result.data : null)
    })
    return () => {
      active = false
    }
  }, [currencyCode])

  useEffect(() => {
    document.documentElement.lang = language || DEFAULTS.language
    document.documentElement.dir = RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr'
  }, [language])

  function save(key, value) {
    writeJson(key, value, RAW)
  }

  // Choosing a country suggests its language and currency, but never forces them.
  function setCountry(nextCountry, suggestion = {}) {
    setCountryState(nextCountry)
    save(KEYS.country, nextCountry)

    if (suggestion.language) {
      setLanguage(suggestion.language)
      save(KEYS.language, suggestion.language)
    }
    if (suggestion.currency) {
      setCurrencyCode(suggestion.currency)
      save(KEYS.currency, suggestion.currency)
    }
  }

  function chooseLanguage(next) {
    setLanguage(next)
    save(KEYS.language, next)
  }

  function chooseCurrency(next) {
    setCurrencyCode(next)
    save(KEYS.currency, next)
  }

  function completeOnboarding() {
    setOnboardingDone(true)
    save(KEYS.done, true)
  }

  // Skipping is a real choice, not a deferral — it always settles on Other,
  // English, and USD, regardless of CMS defaults edited for future visitors.
  function skipOnboarding() {
    setCountry(DEFAULTS.country, { language: DEFAULTS.language, currency: DEFAULTS.currency })
    completeOnboarding()
  }

  function resetOnboarding() {
    Object.values(KEYS).forEach((key) => removeKey(key, RAW))
    setCountryState(defaults.country)
    setLanguage(defaults.language)
    setCurrencyCode(defaults.currency)
    setOnboardingDone(false)
  }

  const value = {
    country,
    language,
    currencyCode,
    currency,
    onboardingDone,
    ready,
    setCountry,
    setLanguage: chooseLanguage,
    setCurrency: chooseCurrency,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    t: (key) => translate(language, key),
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used inside a LocaleProvider')
  return context
}
