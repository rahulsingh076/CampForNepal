// Authentication routes.
//
// A factory rather than a module-level router, because the rate limiters need
// their window and threshold from configuration at construction time.
//
// CSRF is not applied here: it is global for every unsafe method (see app.js),
// so a route added later cannot forget it.
import { Router } from 'express'
import { loginRateLimit, registerRateLimit } from '../../middleware/authRateLimit.js'
import requireAuth from '../../middleware/requireAuth.js'
import authController from './auth.controller.js'

export default function createAuthRoutes(config) {
  const router = Router()

  // Public. GET, so the token can be fetched before any protected call.
  router.get('/csrf-token', authController.csrfToken)

  // Public, rate limited.
  router.post('/register', registerRateLimit(config), authController.register)
  router.post('/login', loginRateLimit(config), authController.login)

  // Public, but still CSRF protected. Signing out has nothing worth guarding
  // with a 401, and refusing it because the session already lapsed makes the
  // button fail for exactly the person who needed it.
  router.post('/logout', authController.logout)

  // Signed in only.
  router.get('/me', requireAuth, authController.me)
  router.post('/logout-all', requireAuth, authController.logoutAll)
  router.post('/change-password', requireAuth, authController.changePassword)

  return router
}
