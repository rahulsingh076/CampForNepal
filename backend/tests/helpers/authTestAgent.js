// Builds the real Express app and drives it over HTTP with supertest.
//
// The whole stack runs: session cookie, CSRF, rate limiting, the error handler.
// Testing below that layer would prove the pieces work and miss whether they
// were actually wired together.
import request from 'supertest'
import createApp from '../../src/app.js'
import loadEnv from '../../src/config/env.js'

export function testConfig() {
  return loadEnv(process.env)
}

// Every app built here, so their session stores can be closed at the end. An
// open store keeps the process alive after the tests finish.
const builtApps = []

// A fresh app per group of tests, because the rate limiter counts in memory:
// sharing one app would let one describe block exhaust another's budget.
export function buildTestApp() {
  const app = createApp(testConfig())
  builtApps.push(app)
  return app
}

export async function closeTestApps() {
  await Promise.all(builtApps.map((app) => app.locals.sessionStore?.close()))
  builtApps.length = 0
}

// An agent keeps cookies between requests, which is what makes a session work.
export function newAgent(app) {
  return request.agent(app)
}

export function apiPath(config, path) {
  return `${config.apiPrefix}${path}`
}

export async function getCsrfToken(agent, config) {
  const response = await agent.get(apiPath(config, '/auth/csrf-token'))
  return response.body?.data?.csrfToken
}

// Reads the session cookie's value out of a response, so a test can prove the
// id changed at login.
export function sessionCookieValue(response, cookieName) {
  const cookies = response.headers['set-cookie'] || []
  const match = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`))
  return match ? match.split(';')[0].split('=')[1] : null
}

export function sessionCookieAttributes(response, cookieName) {
  const cookies = response.headers['set-cookie'] || []
  return cookies.find((cookie) => cookie.startsWith(`${cookieName}=`)) || ''
}

// register → returns { agent, csrfToken, user }
export async function registerUser(app, config, { fullName, email, password }) {
  const agent = newAgent(app)
  const token = await getCsrfToken(agent, config)

  const response = await agent
    .post(apiPath(config, '/auth/register'))
    .set('X-CSRF-Token', token)
    .send({ fullName, email, password })

  return { agent, response, csrfToken: response.body?.data?.csrfToken }
}

export async function loginUser(app, config, { email, password }) {
  const agent = newAgent(app)
  const token = await getCsrfToken(agent, config)

  const response = await agent
    .post(apiPath(config, '/auth/login'))
    .set('X-CSRF-Token', token)
    .send({ email, password })

  return { agent, response, csrfToken: response.body?.data?.csrfToken }
}

export default { buildTestApp, closeTestApps, newAgent, getCsrfToken, registerUser, loginUser }
