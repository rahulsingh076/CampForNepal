// One support conversation: the messages, and a reply box that appends locally.
import { useState } from 'react'
import { formatDate } from '../../lib/formatters.js'

export default function MessageThreadView({ thread, onReply, sending = false }) {
  const [draft, setDraft] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!draft.trim() || sending) return
    const saved = await onReply(draft.trim())
    if (saved) setDraft('')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 pb-4">
        <h2 className="text-h4 font-display text-stone-900">{thread.subject}</h2>
        <p className="mt-1 text-small text-stone-600">
          Started {formatDate(thread.createdAt, { withTime: true })}
          {thread.status === 'closed' && ' · Closed — replying reopens it'}
        </p>
      </div>

      <ol className="flex-1 space-y-4 overflow-y-auto py-4" aria-label="Messages">
        {thread.messages.map((message, index) => (
          <li
            key={`${message.sentAt}-${index}`}
            className={message.from === 'customer' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={`max-w-md rounded-xl px-4 py-3 ${
                message.from === 'customer'
                  ? 'bg-primary-700 text-white'
                  : 'border border-stone-200 bg-white text-stone-900'
              }`}
            >
              <p className={`text-small font-semibold ${message.from === 'customer' ? 'text-primary-100' : 'text-stone-600'}`}>
                {message.authorName} · {formatDate(message.sentAt, { short: true, withTime: true })}
              </p>
              <p className="mt-1 text-small leading-relaxed">{message.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit} className="border-t border-stone-200 pt-4">
        <label htmlFor={`reply-${thread.id}`} className="block text-small font-semibold text-stone-800">
          Reply
        </label>
        <textarea
          id={`reply-${thread.id}`}
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write your message…"
          className="mt-2 w-full rounded-lg border border-stone-500 bg-white px-4 py-3 text-body text-stone-900 placeholder:text-stone-500"
        />
        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="max-w-sm text-small text-stone-500">Your demo reply is saved in this browser only. No message is sent to Camp For Nepal.</p>
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Saving…' : 'Save reply'}
          </button>
        </div>
      </form>
    </div>
  )
}
