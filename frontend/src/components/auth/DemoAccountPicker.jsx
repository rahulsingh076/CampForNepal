// One-click demo logins for the public/customer/admin demo paths.
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'

export const DEMO_ROLES = [
  { role: 'customer', label: 'Customer' },
  { role: 'admin', label: 'Admin' },
  { role: 'super_admin', label: 'Super Admin' },
]

export const ADMIN_DEMO_ROLES = [
  { role: 'admin', label: 'Admin' },
  { role: 'super_admin', label: 'Super Admin' },
]

export default function DemoAccountPicker({
  onSignedIn,
  roles = DEMO_ROLES,
  heading = 'Or explore with a demo account',
}) {
  const { loginAs } = useAuth()
  const [busyRole, setBusyRole] = useState(null)
  const [error, setError] = useState('')

  async function pick(role) {
    setBusyRole(role)
    setError('')

    const result = await loginAs(role)
    if (result.success) {
      onSignedIn(result.data)
    } else {
      setError(result.message)
      setBusyRole(null)
    }
  }

  return (
    <div>
      <p className="text-small font-semibold text-stone-800">{heading}</p>
      <p className="mt-1 text-small text-stone-600">
        One click signs you in — no password needed.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {roles.map((entry) => (
          <button
            key={entry.role}
            type="button"
            onClick={() => pick(entry.role)}
            disabled={busyRole !== null}
            className="rounded-lg border border-stone-300 px-4 py-2 text-small font-medium text-stone-800 transition-colors duration-200 hover:border-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyRole === entry.role ? 'Signing in…' : entry.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-small font-medium text-danger-700">
          {error}
        </p>
      )}
    </div>
  )
}
