import { createContext, useCallback, useContext, useState } from 'react'
import Portal from '../common/Portal.jsx'

const ToastContext = createContext(null)

const TONES = {
  success: 'border-success-200 bg-success-50 text-success-900',
  error: 'border-danger-200 bg-danger-50 text-danger-900',
  info: 'border-glacier-200 bg-glacier-50 text-glacier-900',
}

function Notice({ notice, dismiss }) {
  return (
    <div className={`pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg ${TONES[notice.tone] || TONES.info}`}>
      <p className="flex-1 text-small font-semibold">{notice.message}</p>
      <button
        type="button"
        onClick={() => dismiss(notice.id)}
        aria-label="Dismiss notification"
        className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}

// Both regions stay mounted and empty. A live region inserted into the page at
// the same moment as its text is frequently not announced at all, so the
// container has to already be there when a message arrives. Errors get their
// own assertive region rather than retuning aria-live on a shared one.
function ToastViewport({ notices, dismiss }) {
  const urgent = notices.filter((notice) => notice.tone === 'error')
  const routine = notices.filter((notice) => notice.tone !== 'error')

  return (
    <Portal>
      <div className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        <div aria-live="assertive" aria-atomic="false" className="flex flex-col gap-2">
          {urgent.map((notice) => (
            <Notice key={notice.id} notice={notice} dismiss={dismiss} />
          ))}
        </div>
        <div aria-live="polite" aria-atomic="false" className="flex flex-col gap-2">
          {routine.map((notice) => (
            <Notice key={notice.id} notice={notice} dismiss={dismiss} />
          ))}
        </div>
      </div>
    </Portal>
  )
}

export function ToastProvider({ children }) {
  const [notices, setNotices] = useState([])

  const dismiss = useCallback((id) => {
    setNotices((current) => current.filter((notice) => notice.id !== id))
  }, [])

  const showToast = useCallback(
    (message, tone = 'success', duration = 3500) => {
      const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
      setNotices((current) => [...current, { id, message, tone }])
      window.setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ showToast, dismiss }}>
      {children}
      <ToastViewport notices={notices} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
