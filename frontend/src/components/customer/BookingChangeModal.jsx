// Cancel or reschedule request for a booking. Creates a browser-only inquiry;
// nothing changes on the booking in this demo.
import { useState } from 'react'
import DemoNotice from '../common/DemoNotice.jsx'
import FormField from '../common/FormField.jsx'
import Modal from '../common/Modal.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { createInquiry } from '../../lib/createInquiry.js'

const COPY = {
  cancel: {
    title: 'Request a cancellation',
    intro: 'Record why you would like to cancel. In this demo, the request stays in this browser and your booking does not change.',
    label: 'Why do you need to cancel?',
    button: 'Save cancellation request',
  },
  reschedule: {
    title: 'Request new dates',
    intro: 'Record the dates that would work better. In this demo, the request stays in this browser and your current booking does not change.',
    label: 'What dates would suit you, and anything we should know?',
    button: 'Save reschedule request',
  },
}

export default function BookingChangeModal({ kind, booking, packageTitle, open, onClose }) {
  const { user } = useAuth()
  const copy = COPY[kind] || COPY.reschedule
  const [message, setMessage] = useState('')
  const [state, setState] = useState('idle')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!message.trim()) {
      setState('invalid')
      return
    }

    setState('sending')
    const result = await createInquiry({
      type: 'booking_change',
      fullName: user.fullName,
      email: user.email,
      country: user.country,
      subject: `${kind === 'cancel' ? 'Cancellation' : 'Reschedule'} request — ${booking.reference} (${packageTitle})`,
      message: message.trim(),
      packageId: booking.packageId,
    })
    setState(result.success ? 'sent' : 'failed')
  }

  function close() {
    setMessage('')
    setState('idle')
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title={copy.title}>
      {state === 'sent' ? (
        <div role="status">
          <p className="text-body font-semibold text-stone-900">Request recorded</p>
          <p className="mt-2 text-small text-stone-600">
            Your booking is unchanged in this demo.
          </p>
          <DemoNotice context="form" className="mt-2" />
          <button
            type="button"
            onClick={close}
            className="mt-6 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <p className="text-small text-stone-600">{copy.intro}</p>

          <div className="mt-4">
            <FormField
              label={copy.label}
              as="textarea"
              required
              value={message}
              onChange={(event) => {
                setMessage(event.target.value)
                if (state === 'invalid') setState('idle')
              }}
              error={state === 'invalid' ? 'A short note is needed so the team knows what to check.' : null}
            />
          </div>

          {state === 'failed' && (
            <p role="alert" className="mt-3 text-small font-medium text-danger-700">
              That could not be saved just now. Please try again in a moment.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={state === 'sending'}
              className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {state === 'sending' ? 'Saving…' : copy.button}
            </button>
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-stone-300 px-4 py-2 text-small font-medium text-stone-800 transition-colors duration-200 hover:border-stone-400"
            >
              Keep booking as it is
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
