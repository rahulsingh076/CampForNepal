// Injects one JSON-LD block for the current page and removes it on unmount.
//
// Structured data is a claim made to a search engine, so it is only emitted
// when the values behind it are real. Two guards enforce that: the builders in
// lib/structuredData.js return null when a required field is missing, and this
// component emits nothing at all while the site is in demo mode, where ratings,
// credentials, and availability are sample records.
import { useEffect } from 'react'
import useSingleton from '../../hooks/useSingleton.js'

export default function StructuredData({ data }) {
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false
  const payload = !data || demoMode ? null : JSON.stringify(data)

  useEffect(() => {
    if (!payload) return

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.pageStructuredData = 'true'
    script.textContent = payload
    document.head.appendChild(script)

    return () => script.remove()
  }, [payload])

  return null
}
