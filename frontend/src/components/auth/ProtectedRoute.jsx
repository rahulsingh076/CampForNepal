// Lets any signed-in user through; everyone else is sent to the login page.
import { Navigate, useLocation } from 'react-router-dom'
import { CUSTOMER_ROLES, homePathForRole } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { locationTarget } from '../../lib/returnTo.js'
import PageSkeleton from '../common/PageSkeleton.jsx'

export default function ProtectedRoute({ children, roles = CUSTOMER_ROLES }) {
  const { user, ready } = useAuth()
  const location = useLocation()

  // The saved session is still being restored — deciding now would be wrong.
  if (!ready) return <PageSkeleton />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: locationTarget(location) }} />
  }

  if (!roles.includes(user.role)) return <Navigate to={homePathForRole(user.role)} replace />

  return children
}
