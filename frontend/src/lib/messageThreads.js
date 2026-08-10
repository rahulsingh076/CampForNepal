// Customer-local read state for mock support threads. A thread becomes unread
// when a support reply is newer than the timestamp recorded for this account.
export function isUnreadForCustomer(thread) {
  const latestSupportReply = [...(thread?.messages || [])]
    .reverse()
    .find((message) => message.from !== 'customer')

  if (!latestSupportReply?.sentAt) return false
  if (!thread?.customerReadAt) return true

  return new Date(latestSupportReply.sentAt) > new Date(thread.customerReadAt)
}

export function unreadThreadCount(threads = []) {
  return threads.filter(isUnreadForCustomer).length
}
