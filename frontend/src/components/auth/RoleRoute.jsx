// Lets a signed-in user through only when their role is on the allowed list.
import { Link, Navigate, useLocation } from 'react-router-dom'
import { STAFF_ROLES, homePathForRole } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { locationTarget } from '../../lib/returnTo.js'
import PageSkeleton from '../common/PageSkeleton.jsx'

export default function RoleRoute({ roles = [], children, loginPath = '/login', nested = false }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <PageSkeleton />

  if (!user) {
    return <Navigate to={loginPath} replace state={{ from: locationTarget(location) }} />
  }

  // Signed in, wrong role: explain rather than bounce them somewhere confusing.
  if (!roles.includes(user.role)) {
    // Per-page admin guards render inside AdminLayout's main landmark. The
    // top-level guard does not, so only the nested version uses a section.
    const Container = nested ? 'section' : 'main'
    return (
      <Container
        {...(!nested ? { id: 'main', tabIndex: -1 } : {})}
        aria-labelledby="access-denied-title"
        className="flex min-h-screen items-center justify-center bg-sand-50 px-4"
      >
        <div className="max-w-md text-center">
          <h1 id="access-denied-title" className="font-display text-h2 text-stone-900">This area is for the team</h1>
          <p className="mt-4 text-body text-stone-600">
            Your account ({user.role.replace(/_/g, ' ')}) does not have access to this
            section of the demo. Try one of the staff demo accounts from the login page.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2 text-small font-medium text-stone-800 transition-colors duration-200 hover:border-stone-400"
            >
              Back to the site
            </Link>
            <Link
              to={homePathForRole(user.role)}
              className="inline-flex min-h-11 items-center rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800"
            >
              {STAFF_ROLES.includes(user.role) ? 'My workspace' : 'My dashboard'}
            </Link>
          </div>
        </div>
      </Container>
    )
  }

  return children
}
