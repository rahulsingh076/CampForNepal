// Form state shared by every public form: values, blur validation, submit
// state, and the two quiet spam checks.
import { useRef, useState } from 'react'
import { validateField } from '../lib/validators.js'

// A real person takes a few seconds to fill anything in. A bot does not.
const MINIMUM_FILL_MS = 3000

// spamChecks is on for public inquiry forms. Login and register turn it off:
// silently pretending a login worked would strand the person on the page.
export default function useForm({ initialValues, rules, onSubmit, spamChecks = true, formId = '' }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [state, setState] = useState('idle')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const [submitResult, setSubmitResult] = useState(null)

  // Hidden from people, tempting to bots. A rare autofill collision is recoverable.
  const [honeypot, setHoneypot] = useState('')
  const startedAt = useRef(Date.now())

  function setValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleChange = (field) => (event) => {
    const target = event.target
    setValue(field, target.type === 'checkbox' ? target.checked : target.value)

    // Once a field has been corrected, clear its error as the visitor types.
    if (errors[field]) setErrors((current) => ({ ...current, [field]: null }))
  }

  const handleBlur = (field) => (event) => {
    setTouched((current) => ({ ...current, [field]: true }))
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    const problem = validateField(value, rules[field] || {})
    setErrors((current) => ({ ...current, [field]: problem }))
  }

  function focusFirstError(found, fields) {
    const first = fields.find((field) => found[field])
    if (!first || !formId) return

    requestAnimationFrame(() => {
      document.getElementById(`${formId}-${first}`)?.focus()
    })
  }

  function validateFields(fields = Object.keys(rules)) {
    const found = {}
    fields.forEach((field) => {
      const problem = validateField(values[field], rules[field] || {})
      if (problem) found[field] = problem
    })

    setErrors((current) => {
      const next = { ...current }
      fields.forEach((field) => {
        if (found[field]) next[field] = found[field]
        else delete next[field]
      })
      return next
    })
    setTouched((current) => ({
      ...current,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    }))

    if (Object.keys(found).length > 0) focusFirstError(found, fields)
    return found
  }

  function reset() {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setHasSubmitted(false)
    setSubmitMessage('')
    startedAt.current = Date.now()
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setHasSubmitted(true)
    const found = validateFields(Object.keys(rules))
    if (Object.keys(found).length > 0) return

    // Keep a fast real submission rather than pretending it succeeded. The
    // quiet delay preserves the original bot friction without penalising
    // autofill or a confident keyboard user.
    if (spamChecks && honeypot) {
      setState('blocked')
      setSubmitMessage('A browser autofill setting filled our hidden spam check. Use Try again to clear it; your visible answers will stay here.')
      return
    }

    setState('sending')
    const wait = spamChecks ? Math.max(0, MINIMUM_FILL_MS - (Date.now() - startedAt.current)) : 0
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait))

    let result
    try {
      result = await onSubmit(values)
    } catch {
      result = { success: false, message: 'Could not save this request.' }
    }

    if (result?.success) {
      setSubmitResult(result)
      setState('sent')
      reset()
    } else {
      setSubmitResult(null)
      setState('failed')
      setSubmitMessage(result?.message || 'Could not save this request.')
    }
  }

  return {
    values,
    errors,
    touched,
    state,
    hasSubmitted,
    submitMessage,
    submitResult,
    setValue,
    handleChange,
    handleBlur,
    handleSubmit,
    validateFields,
    reset,
    resetState: () => {
      setSubmitResult(null)
      setState('idle')
    },
    recoverSpamCheck: () => {
      setHoneypot('')
      setSubmitResult(null)
      setState('idle')
      setSubmitMessage('')
      startedAt.current = Date.now()
    },
    // Spread onto the hidden input that only a bot will fill in.
    honeypotProps: {
      value: honeypot,
      onChange: (event) => setHoneypot(event.target.value),
    },
  }
}
