// Wraps an async route handler so a rejected promise reaches the central error
// handler instead of becoming an unhandled rejection.
//
// Express 5 forwards rejections from async handlers on its own, so this is
// belt and braces — but it makes the intent explicit at every route, and it
// keeps the code correct if a handler is ever called outside a router.
//
// It hides nothing: the original error is passed through untouched.
export default function asyncHandler(handler) {
  return function wrapped(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
