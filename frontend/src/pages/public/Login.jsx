// Log In page: the demo email + password form, plus one-click demo accounts.
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import DemoAccountPicker from '../../components/auth/DemoAccountPicker.jsx'
import FormField from '../../components/common/FormField.jsx'
import { homePathForRole } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useForm from '../../hooks/useForm.js'
import { returnTarget } from '../../lib/returnTo.js'

const RULES = {
  email: { required: true, type: 'email', label: 'Email' },
  password: { required: true, label: 'Password' },
}

export default function Login() {
  usePageMeta('Log In', 'Sign in to your Camp for Nepal demo account.')
  const { user, ready, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')

  // Someone bounced off a protected page goes back there after signing in.
  function finish(account) {
    navigate(returnTarget(location.state?.from, homePathForRole(account.role), ['/login', '/register']), { replace: true })
  }

  const form = useForm({
    initialValues: { email: '', password: '' },
    rules: RULES,
    spamChecks: false,
    onSubmit: async (values) => {
      setServerError('')
      const result = await login(values.email, values.password)
      if (result.success) finish(result.data)
      else setServerError(result.message)
      return result
    },
  })

  // Already signed in? The login form has nothing to offer. This sits below
  // every hook call so the hook order never changes between renders.
  if (ready && user) return <Navigate to={homePathForRole(user.role)} replace />

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-h2 text-stone-900">Welcome back</h1>
      <p className="mt-2 text-body text-stone-600">
        Login is optional. You can browse trips, use search, plan a trip, and send inquiries without an account.
        Demo sign-in only opens the private dashboard in this browser.
      </p>
      <p className="mt-2 text-small text-stone-600">
        Manual sign-in works with any active seed email and the password <span className="font-mono">demo1234</span>.
      </p>

      <form onSubmit={form.handleSubmit} noValidate className="mt-8 space-y-6">
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
          autoComplete="current-password"
          value={form.values.password}
          onChange={form.handleChange('password')}
          onBlur={form.handleBlur('password')}
          error={form.touched.password ? form.errors.password : null}
        />

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
          {form.state === 'sending' ? 'Signing in…' : 'Log in'}
        </button>
      </form>

      <div className="mt-10 border-t border-stone-200 pt-8">
        <DemoAccountPicker onSignedIn={finish} />
      </div>

      <p className="mt-10 text-small text-stone-600">
        New here?{' '}
        <Link to="/register" className="font-semibold text-primary-700 hover:text-primary-800">
          Create an account
        </Link>
      </p>
    </div>
  )
}
