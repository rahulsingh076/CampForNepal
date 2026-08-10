// The one response shape the whole API speaks.
//
//   { success, message, data, meta }
//
// The frontend's mock dataClient already returns exactly this, so replacing its
// internals with fetch calls must not require a single component change. Every
// controller goes through here rather than calling res.json directly.

export function buildEnvelope({ success, message = '', data = null, meta = {} }) {
  return { success, message, data, meta }
}

// requestId is attached by the requestContext middleware and echoed on every
// response, so a report from a user can be traced to a specific log line.
function metaFor(res, extra = {}) {
  return { requestId: res.locals.requestId, ...extra }
}

export function sendSuccess(res, { message = '', data = null, meta = {}, status = 200 } = {}) {
  return res.status(status).json(
    buildEnvelope({ success: true, message, data, meta: metaFor(res, meta) })
  )
}

export function sendFailure(res, { message, data = null, meta = {}, status = 400 }) {
  return res.status(status).json(
    buildEnvelope({ success: false, message, data, meta: metaFor(res, meta) })
  )
}

export default sendSuccess
