// HTTP for inquiries: read the request, call the service, send the envelope.
import {
  INQUIRY_PRIORITIES,
  isInquiryPriority,
} from '../../constants/inquiryPriorities.js'
import { INQUIRY_STATUSES } from '../../constants/inquiryStatuses.js'
import { INQUIRY_TYPES } from '../../constants/inquiryTypes.js'
import {
  buildPageMeta,
  escapeRegex,
  parseDateRange,
  parseEnum,
  parsePagination,
  parseSearch,
  parseSort,
  sortToObject,
} from '../../database/publicQuery.js'
import asyncHandler from '../../middleware/asyncHandler.js'
import ApiError from '../../utils/ApiError.js'
import { hashIdempotencyKey, readIdempotencyKey } from '../../utils/inquiryIdempotency.js'
import { toPlainText } from '../../utils/plainText.js'
import { sendSuccess } from '../../utils/response.js'
import inquiryService from './inquiry.service.js'
import {
  serializeInquiryDetail,
  serializeInquiryListItem,
  serializePublicInquiry,
} from './inquiry.serializer.js'
import { validateInquirySubmission } from './inquiry.validation.js'

const EMERGENCY_MESSAGE =
  'Your request has been recorded. This website form does not guarantee immediate ' +
  'emergency assistance. Use the published phone or WhatsApp contact for urgent help.'

// A hidden field no person sees. Anything in it came from a bot filling every
// input on the page.
//
// The response is a normal-looking 201 with a real-shaped reference code. A
// bot told "spam detected" learns to work around the check; one told "thank
// you" reports success and moves on. Nothing personal is stored.
function honeypotTriggered(body, config) {
  const value = body[config.inquiry.honeypotField]
  return typeof value === 'string' && value.trim() !== ''
}

export const createInquiry = asyncHandler(async (req, res) => {
  const config = req.app.locals.config

  if (honeypotTriggered(req.body, config)) {
    // Deliberately stores nothing at all — not even a flagged record. Keeping
    // spam submissions would mean keeping the personal details inside them.
    return sendSuccess(res, {
      status: 201,
      message: 'Your inquiry has been recorded.',
      data: { referenceCode: null, status: 'new', submittedAt: new Date().toISOString() },
    })
  }

  const idempotencyKey = readIdempotencyKey(req)
  const idempotencyKeyHash = hashIdempotencyKey(idempotencyKey)

  // A retry of a request that already succeeded returns the original result
  // rather than filing a second inquiry.
  if (idempotencyKeyHash) {
    const existing = await inquiryService.findByIdempotencyHash(idempotencyKeyHash)
    if (existing) {
      return sendSuccess(res, {
        status: 201,
        message: 'Your inquiry has been recorded.',
        data: serializePublicInquiry(existing),
      })
    }
  }

  const clean = validateInquirySubmission(req.body, config)

  const inquiry = await inquiryService.createInquiry(clean, {
    config,
    // Only from a verified session. Anonymous submissions are the norm.
    userId: req.session?.userId || null,
    idempotencyKeyHash,
    acceptLanguage: req.get('Accept-Language') || '',
  })

  return sendSuccess(res, {
    status: 201,
    message: clean.type === 'emergency' ? EMERGENCY_MESSAGE : 'Your inquiry has been recorded.',
    data: serializePublicInquiry(inquiry),
  })
})

// ------------------------------------------------------------------ staff

const SORTABLE = ['createdAt', 'updatedAt', 'followUpAt', 'referenceCode']

// Only these fields are searched, and the pattern is escaped — an unescaped
// term lets somebody send `.*` and match everything, or a catastrophic
// backtracking pattern and hang the process.
const SEARCH_FIELDS = [
  'referenceCode',
  'contact.fullName',
  'contact.email',
  'contact.phone',
  'contact.whatsapp',
  'subject',
]

// req.query never reaches Mongoose. Every value is parsed by name into a
// filter this function builds.
function buildFilter(query) {
  const filter = {}

  const type = parseEnum(query.type, 'type', INQUIRY_TYPES)
  if (type) filter.type = type

  const status = parseEnum(query.status, 'status', INQUIRY_STATUSES)
  if (status) filter.status = status

  const priority = parseEnum(query.priority, 'priority', INQUIRY_PRIORITIES)
  if (priority) filter.priority = priority

  // `unassigned=true` and an explicit assignee are mutually exclusive; the
  // explicit one wins because it is the more specific request.
  if (query.assignedToUserId) {
    filter.assignedToUserId = String(query.assignedToUserId)
  } else if (String(query.unassigned).toLowerCase() === 'true') {
    filter.assignedToUserId = null
  }

  if (query.country) {
    filter['contact.country'] = String(query.country).slice(0, 100)
  }

  const created = parseDateRange(query.createdFrom, query.createdTo, {
    fromName: 'createdFrom',
    toName: 'createdTo',
  })
  if (created) filter.createdAt = created

  const followUp = parseDateRange(query.followUpFrom, query.followUpTo, {
    fromName: 'followUpFrom',
    toName: 'followUpTo',
  })
  if (followUp) filter.followUpAt = followUp

  const search = parseSearch(query.search)
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    filter.$or = SEARCH_FIELDS.map((field) => ({ [field]: pattern }))
  }

  return filter
}

export const listInquiries = asyncHandler(async (req, res) => {
  const config = req.app.locals.config
  const { page, limit } = parsePagination(req.query, config)
  const sort = parseSort(req.query.sort, SORTABLE, '-createdAt')

  const filter = buildFilter(req.query)
  const { items, total } = await inquiryService.listInquiries({
    filter,
    sort: sortToObject(sort),
    page,
    limit,
  })

  return sendSuccess(res, {
    message: 'Inquiries retrieved successfully.',
    data: items.map(serializeInquiryListItem),
    meta: buildPageMeta({ page, limit, total }),
  })
})

export const getInquiry = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.findInquiryForStaff(req.params.id)
  return sendSuccess(res, {
    message: 'Inquiry retrieved successfully.',
    data: serializeInquiryDetail(inquiry),
  })
})

async function respondWithDetail(req, res, message) {
  const inquiry = await inquiryService.findInquiryForStaff(req.params.id)
  return sendSuccess(res, { message, data: serializeInquiryDetail(inquiry) })
}

export const updateStatus = asyncHandler(async (req, res) => {
  const { status, fromStatus, reason } = req.body || {}

  if (typeof status !== 'string') throw ApiError.badRequest('Choose a status.')
  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    throw ApiError.badRequest('A reason must be text.')
  }

  await inquiryService.changeStatus(req.params.id, {
    fromStatus: typeof fromStatus === 'string' ? fromStatus : null,
    toStatus: status,
    // From the session, never the body — an actor a client could choose is not
    // an audit trail.
    actorUserId: req.auth.userId,
    reason,
  })

  return respondWithDetail(req, res, 'The status has been updated.')
})

export const updateAssignment = asyncHandler(async (req, res) => {
  const value = (req.body || {}).assignedToUserId

  if (value !== null && typeof value !== 'string') {
    throw ApiError.badRequest('Choose a member of staff, or null to unassign.')
  }

  await inquiryService.assignInquiry(req.params.id, value === '' ? null : value)
  return respondWithDetail(req, res, 'The assignment has been updated.')
})

export const updateFollowUp = asyncHandler(async (req, res) => {
  const value = (req.body || {}).followUpAt

  let followUpAt = null
  if (value !== null && value !== undefined && value !== '') {
    if (typeof value !== 'string') throw ApiError.badRequest('A follow-up date must be a date.')
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) throw ApiError.badRequest('That follow-up date could not be read.')
    // A date in the past is allowed on purpose: staff record overdue follow-ups
    // and backfill ones they made by phone yesterday.
    followUpAt = parsed
  }

  await inquiryService.setFollowUp(req.params.id, followUpAt)
  return respondWithDetail(req, res, followUpAt ? 'The follow-up date has been set.' : 'The follow-up date has been cleared.')
})

export const updatePriority = asyncHandler(async (req, res) => {
  const { priority } = req.body || {}

  if (!isInquiryPriority(priority)) {
    throw ApiError.badRequest(`Choose one of: ${INQUIRY_PRIORITIES.join(', ')}.`)
  }

  await inquiryService.setPriority(req.params.id, priority)
  return respondWithDetail(req, res, 'The priority has been updated.')
})

export const addNote = asyncHandler(async (req, res) => {
  const config = req.app.locals.config
  const { text } = req.body || {}

  if (typeof text !== 'string') throw ApiError.badRequest('Write a note first.')
  const plain = toPlainText(text)
  if (!plain) throw ApiError.badRequest('Write a note first.')
  if (plain.length > config.inquiry.maxNoteLength) {
    throw ApiError.badRequest(`A note cannot be longer than ${config.inquiry.maxNoteLength} characters.`)
  }

  await inquiryService.addNote(req.params.id, { authorUserId: req.auth.userId, text: plain })
  return respondWithDetail(req, res, 'Your note has been added.')
})

export default {
  createInquiry,
  listInquiries,
  getInquiry,
  updateStatus,
  updateAssignment,
  updateFollowUp,
  updatePriority,
  addNote,
}
