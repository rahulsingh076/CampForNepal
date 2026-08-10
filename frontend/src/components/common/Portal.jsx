// Renders children at the end of <body>.
//
// Overlays must escape their parent: an ancestor with backdrop-filter, filter,
// transform or perspective becomes the containing block for position:fixed
// descendants, so a "full screen" overlay inside the blurred sticky header
// would size itself to the header instead of the viewport.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Portal({ children }) {
  const [mounted, setMounted] = useState(false)

  // Only after mount, so this is safe when there is no document.
  useEffect(() => setMounted(true), [])

  if (!mounted) return null
  return createPortal(children, document.body)
}
