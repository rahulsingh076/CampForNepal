// Account state. Only what the current auth scope genuinely needs — speculative states
// (pending, invited, archived) would be dead branches nothing sets.
export const USER_STATUSES = Object.freeze(['active', 'suspended'])

export const DEFAULT_USER_STATUS = 'active'

// A suspended account cannot sign in, and cannot keep using a session it
// already had — requireAuth destroys it on the next request.
export const ACTIVE_USER_STATUS = 'active'
export const SUSPENDED_USER_STATUS = 'suspended'
