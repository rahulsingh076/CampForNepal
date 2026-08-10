// Create Account page: writes a demo customer account to the local overlay.
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import FormField from '../../components/common/FormField.jsx'
import LocaleFields from '../../components/common/LocaleFields.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useForm from '../../hooks/useForm.js'
import useLocaleOptions from '../../hooks/useLocaleOptions.js'

const RULES = {
  fullName: { required: true, min: 2, label: 'Full name' },
  email: { required: true, type: 'email', label: 'Email' },
  password: { required: true, min: 8, label: 'Password' },
}

export default function Register() {
  usePageMeta('Create Account', 'Create a demo Camp for Nepal customer account.')
  const { user, ready, register } = useAuth()
  const locale = useLocale()
  const options = useLocaleOptions()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const form = useForm({
    initialValues: { fullName: '', email: '', password: '' },
    rules: RULES,
    spamChecks: false,
    onSubmit: async (values) => {
      setServerError('')
      const result = await register({
        ...values,
        country: locale.country,
        language: locale.language,
        currency: locale.currencyCode,
      })
      if (result.success) navigate('/customer', { replace: true })
      else setServerError(result.message)
      return result
    },
  })

  // Already signed in — straight to the dashboard. Below every hook call so
  // the hook order never changes between renders.
  if (ready && user) return <Navigate to="/customer" replace />

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-h2 text-stone-900">Create your account</h1>
      <p className="mt-2 text-body text-stone-600">
        This optional demo account opens a private customer dashboard in this browser. Browsing,
        searching, planning, and sending inquiries still work without signing in.
      </p>

      <form onSubmit={form.handleSubmit} noValidate className="mt-8 space-y-6">
        <FormField
          label="Full name"
          required
          autoComplete="name"
          value={form.values.fullName}
          onChange={form.handleChange('fullName')}
          onBlur={form.handleBlur('fullName')}
          error={form.touched.fullName ? form.errors.fullName : null}
        />
        <FormField
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.values.email}
          onChange={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
          error={form.touched.email ? form.errors.email : null}
        />
        <FormField
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          hint="At least 8 characters. It is stored in this browser only."
          value={form.values.password}
          onChange={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
          error={form.touched.password ? form.errors.password : null}
        />

        {options.status === 'loading' && <LoadingState label="Loading preferences…" />}
        {options.status === 'ready' && (
          <LocaleFields
            countries={options.countries}
            languages={options.languages}
            currencies={options.currencies}
            showHints={false}
          />
        )}

        <p className="text-small text-stone-600">
          By creating a demo account, you acknowledge the{' '}
          <Link to="/privacy-policy" className="font-medium text-primary-700 hover:text-primary-800">Privacy Policy</Link>,{' '}
          <Link to="/terms-and-conditions" className="font-medium text-primary-700 hover:text-primary-800">Terms and Conditions</Link>, and{' '}
          <Link to="/cancellation-policy" className="font-medium text-primary-700 hover:text-primary-800">Cancellation Policy</Link>.
        </p>

        {serverError && (
          <p role="alert" className="text-small font-medium text-danger-700">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={form.state === 'sending'}
          className="w-full rounded-lg bg-primary-700 px-4 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {form.state === 'sending' ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-10 text-small text-stone-600">
        Already have one?{' '}
        <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">
          Log in
        </Link>
      </p>
    </div>
  )
}
