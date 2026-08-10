// Promise wrappers for express-session's callback API, so auth code can await
// them and a failure becomes a rejected promise the error handler sees.
//
// These matter for correctness, not just style: regenerate() and save() are
// asynchronous, and responding before save() completes can send a cookie for a
// session the store has not yet written.
export function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()))
  })
}

export function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()))
  })
}

export function destroySession(req) {
  return new Promise((resolve, reject) => {
    if (!req.session) return resolve()
    req.session.destroy((error) => (error ? reject(error) : resolve()))
  })
}

export default { regenerateSession, saveSession, destroySession }
