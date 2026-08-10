// Team-only entry point for the frontend demo. It uses the same local mock
// accounts as /login, but never creates a session for a customer or guide.
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import DemoAccountPicker, { ADMIN_DEMO_ROLES } from '../../components/auth/DemoAccountPicker.jsx'
import FormField from '../../components/common/FormField.jsx'
import { homePathForRole } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import useForm from '../../hooks/useForm.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { returnTarget } from '../../lib/returnTo.js'

const RULES = {
  email: { required: true, type: 'email', label: 'Team email' },
  password: { required: true, label: 'Password' },
}

export default function AdminLogin() {
  usePageMeta('Team Sign In', 'Sign in to the Camp for Nepal demo admin panel.')
  const { user, ready, loginStaff } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState('')

  function finish() {
    const destination = returnTarget(location.state?.from, '/admin', ['/admin/login'])
    navigate(destination.pathname.startsWith('/admin') ? destination : '/admin', { replace: true })
  }

  const form = useForm({
    initialValues: { email: '', password: '' },
    rules: RULES,
    spamChecks: false,
    onSubmit: async (values) => {
      setServerError('')
      const result = await loginStaff(values.email, values.password)
      if (result.success) finish()
      else setServerError(result.message)
      return result
    },
  })

  if (ready && user) return <Navigate to={homePathForRole(user.role)} replace />

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <p className="text-small font-semibold uppercase tracking-widest text-amber-700">Camp For Nepal team</p>
      <h1 className="mt-3 font-display text-h2 text-stone-900">Team sign in</h1>
      <p className="mt-2 text-body text-stone-600">
        This frontend-only demo accepts Admin and Super Admin accounts. Customer accounts use the regular sign-in; guide accounts do not have a self-service portal.
      </p>

      <form onSubmit={form.handleSubmit} noValidate className="mt-8 space-y-6">
        <FormField
          label="Team email"
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

        {serverError && <p role="alert" className="text-small font-medium text-danger-700">{serverError}</p>}

        <button
          type="submit"
          disabled={form.state === 'sending'}
          className="w-full rounded-lg bg-primary-700 px-4 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {form.state === 'sending' ? 'Signing in...' : 'Sign in to admin'}
        </button>
      </form>

      <div className="mt-10 border-t border-stone-200 pt-8">
        <DemoAccountPicker
          roles={ADMIN_DEMO_ROLES}
          heading="Or enter with a team demo account"
          onSignedIn={finish}
        />
      </div>

      <p className="mt-10 text-small text-stone-600">
        Looking for a customer account? <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">Use the regular sign-in</Link>.
      </p>
    </div>
  )
}
