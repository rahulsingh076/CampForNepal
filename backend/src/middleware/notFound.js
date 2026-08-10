// Any request that matched no route becomes a structured 404 rather than
// Express's default HTML page, so a client only ever parses one shape.
import ApiError from '../utils/ApiError.js'

export default function notFound(req, _res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}.`))
}
