// External compose choices for email contact; Camp For Nepal never sends email here.
import { useState } from 'react'
import useSingleton from '../../hooks/useSingleton.js'
import { isSafeEmail } from '../../lib/urlSafety.js'

const SENSITIVE_WORDS = /\b(passport|identity|card|cvv|bank|password|otp|pin|medical|scan)\b/i

function cleanText(value) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function messageExcerpt(value) {
  const text = cleanText(value)
  if (!text || SENSITIVE_WORDS.test(text)) return ''
  return text.length > 700 ? `${text.slice(0, 697)}...` : text
}

function publicEmailFrom(contact) {
  if (!contact || contact.emailEnabled === false) return ''
  return [contact.publicEmail, contact.email]
    .map(cleanText)
    .find((email) => isSafeEmail(email)) || ''
}

function emailDraft(inquiry, contextTitle) {
  const reference = cleanText(inquiry?.referenceCode)
  const title = cleanText(contextTitle || inquiry?.packageTitle || inquiry?.guideName || inquiry?.subject || 'Travel inquiry')
  const subject = ['Camp For Nepal Inquiry', reference, title].filter(Boolean).join(' - ')
  const excerpt = messageExcerpt(inquiry?.message)
  const lines = [
    'Hello Camp For Nepal team,',
    '',
    reference && `Inquiry reference: ${reference}`,
    title && `Topic: ${title}`,
    inquiry?.preferredDate && `Preferred travel date: ${cleanText(inquiry.preferredDate)}`,
    inquiry?.groupSize && `Number of travellers: ${cleanText(inquiry.groupSize)}`,
    excerpt && '',
    excerpt && `Message: ${excerpt}`,
    '',
    'Please review this inquiry and reply when you can.',
  ].filter(Boolean)

  return { subject, body: lines.join('\n') }
}

function composerLinks(email, draft) {
  const subject = encodeURIComponent(draft.subject)
  const body = encodeURIComponent(draft.body)
  return {
    mailto: `mailto:${email}?subject=${subject}&body=${body}`,
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${subject}&body=${body}`,
  }
}

function copyWithFallback(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)

  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '-9999px'
  document.body.appendChild(area)
  area.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(area)
  return copied ? Promise.resolve() : Promise.reject(new Error('copy failed'))
}

export default function ExternalEmailActions({ inquiry, contextTitle = '', contact: providedContact, className = '' }) {
  const contactState = useSingleton('contactDetails')
  const [status, setStatus] = useState('')
  const contact = providedContact || contactState.data
  const preparing = !providedContact && contactState.status === 'loading'
  const email = publicEmailFrom(contact)
  const draft = emailDraft(inquiry, contextTitle)
  const links = email ? composerLinks(email, draft) : null

  async function copyEmail() {
    if (!email) {
      setStatus('Email contact is not configured.')
      return
    }
    try {
      await copyWithFallback(email)
      setStatus('Email address copied.')
    } catch {
      setStatus('Could not copy the email address.')
    }
  }

  return (
    <section aria-label="External email actions" className={`rounded-lg border border-stone-200 bg-sand-50 p-4 ${className}`}>
      {inquiry && (
        <p className="text-small font-medium text-stone-800">
          Your inquiry has been saved. No email has been sent yet. Open your email application, review the prepared message, and press Send.
        </p>
      )}

      {email ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <a
            href={links.mailto}
            aria-label={`Open Email App to contact ${email}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-small font-semibold text-white transition-colors duration-200 hover:bg-amber-700"
          >
            Open Email App
          </a>
          <a
            href={links.gmail}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Open Gmail to contact ${email}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-3 text-small font-semibold text-primary-800 transition-colors duration-200 hover:border-stone-400 hover:bg-sand-50"
          >
            Open Gmail
          </a>
          <button
            type="button"
            onClick={copyEmail}
            aria-label={`Copy email address ${email}`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-3 text-small font-semibold text-primary-800 transition-colors duration-200 hover:border-stone-400 hover:bg-sand-50"
          >
            Copy Email Address
          </button>
        </div>
      ) : preparing ? (
        <p className="mt-3 text-small text-stone-700">Preparing email contact options.</p>
      ) : (
        <p className="mt-3 text-small text-stone-700">Email contact is not configured. Use another public contact option.</p>
      )}

      {status && <p role="status" className="mt-3 text-small font-medium text-primary-800">{status}</p>}
    </section>
  )
}
