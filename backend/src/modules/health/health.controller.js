// Health check: is the process up, and can it reach its database.
// HTTP only — it reads state and formats a response, nothing more.
import { databaseState } from '../../config/database.js'
import { sendSuccess } from '../../utils/response.js'

export function getHealth(_req, res) {
  return sendSuccess(res, {
    message: 'Camp For Nepal API is healthy.',
    data: {
      status: 'ok',
      database: databaseState(),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  })
}

export default getHealth
