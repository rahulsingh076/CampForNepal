// Sends a first-time visitor to /welcome once, then never blocks them again.
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import PageSkeleton from '../components/common/PageSkeleton.jsx'
import { useLocale } from '../contexts/LocaleContext.jsx'
import { locationTarget } from '../lib/returnTo.js'

const ONBOARDING_EXEMPT_PATHS = ['/login', '/register', '/admin/login']

export default function OnboardingGate() {
  const { ready, onboardingDone } = useLocale()
  const location = useLocation()

  // Wait for the saved choice to be read, so /welcome never flashes at
  // someone who already completed it.
  if (!ready) return <PageSkeleton />

  if (!onboardingDone && !ONBOARDING_EXEMPT_PATHS.includes(location.pathname)) {
    return <Navigate to="/welcome" replace state={{ from: locationTarget(location) }} />
  }

  return <Outlet />
}
