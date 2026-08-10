// Reports which anchored section is currently in view, for marking the active
// link in an in-page navigation.
//
// Fails open: if IntersectionObserver is missing, or no section is matched, it
// returns an empty id and the navigation renders with nothing highlighted. The
// links keep working either way — the highlight is an enhancement, never the
// mechanism.
import { useEffect, useState } from 'react'

export default function useCurrentSection(ids = []) {
  const [currentId, setCurrentId] = useState('')

  // ids is a fresh array each render, so the effect keys on its contents.
  const key = ids.join('|')

  useEffect(() => {
    const sectionIds = key ? key.split('|') : []
    if (!sectionIds.length || typeof IntersectionObserver === 'undefined') return undefined

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean)
    if (!elements.length) return undefined

    // Track ratios rather than reacting to single entries, so the heading that
    // occupies the most of the reading area wins even while two are on screen.
    const ratios = new Map()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target.id, entry.intersectionRatio))

        let best = ''
        let bestRatio = 0
        sectionIds.forEach((id) => {
          const ratio = ratios.get(id) || 0
          if (ratio > bestRatio) {
            best = id
            bestRatio = ratio
          }
        })

        // Nothing meaningfully in view keeps the previous choice rather than
        // flickering the highlight off between sections.
        if (best) setCurrentId(best)
      },
      {
        // The sticky header and anchor bar cover the top of the viewport, so
        // the observed band starts below them.
        rootMargin: '-140px 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [key])

  return currentId
}
