// Gives every request an id, so a response a user reports can be matched to a
// server log line. An inbound X-Request-Id is trusted and reused, which lets a
// proxy or the frontend correlate a call end to end; otherwise one is generated.
import { randomUUID } from 'node:crypto'

// A client-supplied id ends up in logs and response headers, so it is length
// capped and restricted to harmless characters rather than echoed verbatim.
const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/

export default function requestContext(req, res, next) {
  const supplied = req.get('X-Request-Id')
  const requestId = supplied && SAFE_ID.test(supplied) ? supplied : randomUUID()

  req.requestId = requestId
  res.locals.requestId = requestId
  res.setHeader('X-Request-Id', requestId)

  next()
}
