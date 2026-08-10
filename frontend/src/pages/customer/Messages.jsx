// Messages: mock support threads. Replies append locally through dataClient.
import { useEffect, useState } from 'react'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import DemoNotice from '../../components/common/DemoNotice.jsx'
import MessageThreadView from '../../components/customer/MessageThreadView.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import { listItems, updateItem } from '../../lib/dataClient.js'
import { formatDate } from '../../lib/formatters.js'
import { isUnreadForCustomer } from '../../lib/messageThreads.js'

export default function Messages() {
  usePageMeta('Messages', 'Your conversations with the Camp for Nepal team.')
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading' })
  const [activeId, setActiveId] = useState(null)
  const [sending, setSending] = useState(false)
  const [replyError, setReplyError] = useState('')

  useEffect(() => {
    let active = true
    listItems('messageThreads', {
      filters: { userId: user.id },
      sort: 'updatedAt',
      direction: 'desc',
      pageSize: 0,
    }).then((result) => {
      if (!active) return
      if (!result.success) {
        setState({ status: 'error' })
        return
      }
      setState({ status: 'ready', threads: result.data })
      setActiveId((current) => current || result.data[0]?.id || null)
    })
    return () => {
      active = false
    }
  }, [user.id])

  async function handleReply(threadId, body) {
    const thread = state.threads.find((row) => row.id === threadId)
    if (!thread) return
    setSending(true)
    setReplyError('')

    const message = { from: 'customer', authorName: user.fullName, body, sentAt: new Date().toISOString() }
    const result = await updateItem(
      'messageThreads',
      threadId,
      { messages: [...thread.messages, message], status: 'open' },
      { id: user.id, fullName: user.fullName }
    )
    setSending(false)

    if (result.success) {
      setState((current) => ({
        ...current,
        threads: current.threads.map((row) => (row.id === threadId ? result.data : row)),
      }))
      return true
    } else {
      setReplyError(result.message || 'Your reply could not be saved in this browser. Please try again.')
      return false
    }
  }

  async function selectThread(thread) {
    setActiveId(thread.id)
    if (!isUnreadForCustomer(thread)) return

    const customerReadAt = new Date().toISOString()
    setState((current) => ({
      ...current,
      threads: current.threads.map((row) => (row.id === thread.id ? { ...row, customerReadAt } : row)),
    }))
    const result = await updateItem('messageThreads', thread.id, { customerReadAt }, { id: user.id, fullName: user.fullName })
    if (!result.success) {
      setState((current) => ({
        ...current,
        threads: current.threads.map((row) => (row.id === thread.id ? thread : row)),
      }))
    }
  }

  if (state.status === 'loading') return <LoadingState label="Loading your messages…" rows={6} />
  if (state.status === 'error') {
    return <ErrorState title="Could not load your messages" description="Please refresh the page to try again." />
  }

  const activeThread = state.threads.find((row) => row.id === activeId)

  return (
    <div>
      <h1 className="font-display text-h2 text-stone-900">Messages</h1>
      <p className="mt-1 text-body text-stone-600">Sample support conversations for your trips, kept in this browser-only demo.</p>
      <DemoNotice className="mt-2" />

      <div className="mt-8">
        {state.threads.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="When you save a message in this demo, its thread appears here on this browser. No message is transmitted."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <nav aria-label="Conversations">
              <ul className="space-y-2">
                {state.threads.map((thread) => (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => selectThread(thread)}
                      aria-current={thread.id === activeId ? 'true' : undefined}
                      className={`w-full rounded-xl border p-4 text-left transition-colors duration-200 ${
                        thread.id === activeId
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-stone-200 bg-white hover:border-stone-400'
                      }`}
                    >
                      <p className="text-small font-semibold text-stone-900">{thread.subject}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-small text-stone-500">
                        {formatDate(thread.updatedAt, { short: true })} · {thread.messages.length} message
                        {thread.messages.length === 1 ? '' : 's'}
                        {isUnreadForCustomer(thread) && <span className="font-semibold text-primary-800">New</span>}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="rounded-xl border border-stone-200 bg-sand-50 p-6 lg:col-span-2">
              {activeThread && (
                <>
                  {replyError && <p role="alert" className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-small text-danger-900">{replyError}</p>}
                  <MessageThreadView
                    thread={activeThread}
                    sending={sending}
                    onReply={(body) => handleReply(activeThread.id, body)}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
