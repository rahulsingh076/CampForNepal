// A small, truthful disclosure wherever local-only demo data needs context.
import useSingleton from '../../hooks/useSingleton.js'

const MESSAGES = {
  workspace: 'Viewing demo data: changes and records stay only in this browser.',
  admin: 'Viewing demo data: changes and records stay only in this browser.',
  form: 'Demo mode: submitting this form saves the entry only in this browser. No message is sent to Camp For Nepal.',
  formSuccess: 'Your demo request was saved in this browser. No message was sent to Camp For Nepal.',
  evidence: 'Demo mode: these are sample records, shown for demonstration only and not as real-world evidence.',
  contact: 'Demo mode: contact details are placeholders and do not reach a real trip planner.',
}

export default function DemoNotice({ context = 'workspace', className = '' }) {
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  if (!demoMode && !['form', 'formSuccess'].includes(context)) return null

  const message = demoMode
    ? MESSAGES[context] || MESSAGES.workspace
    : 'This form preview is not connected to a live inbox.'

  return (
    <p role="status" className={`text-small text-stone-600 ${className}`.trim()}>
      {message}
    </p>
  )
}
