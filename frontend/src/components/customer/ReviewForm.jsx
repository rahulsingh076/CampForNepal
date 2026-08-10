// Write a review for a completed trip. In demo mode it stays in the local moderation queue.
import { useState } from 'react'
import FormField from '../common/FormField.jsx'
import Modal from '../common/Modal.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { createItem } from '../../lib/dataClient.js'
import { notifyUsers, staffUserIds } from '../../lib/notifications.js'

export default function ReviewForm({ booking, packageItem, open, onClose, onSubmitted }) {
  const { user } = useAuth()
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [reviewText, setReviewText] = useState('')
  const [state, setState] = useState('idle')
  const [problem, setProblem] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (title.trim().length < 4 || reviewText.trim().length < 30) {
      setProblem('Please give your review a short title and at least a few sentences.')
      return
    }

    setState('sending')
    const result = await createItem(
      'reviews',
      {
        customerName: user.fullName,
        country: user.country,
        rating,
        title: title.trim(),
        reviewText: reviewText.trim(),
        packageId: booking.packageId,
        guideId: null,
        userId: user.id,
        bookingId: booking.id,
        verifiedBooking: true,
        status: 'pending',
        adminReply: null,
      },
      { id: user.id, fullName: user.fullName }
    )

    if (result.success) {
      const recipients = await staffUserIds(['admin', 'super_admin'])
      await notifyUsers(recipients, 'review_submitted', {
        fullName: user.fullName,
        packageTitle: packageItem?.title || 'a trip',
        link: '/admin/reviews',
      }, { id: user.id, fullName: user.fullName })
      setState('idle')
      onSubmitted(result.data)
    } else {
      setState('failed')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Review ${packageItem?.title || 'your trip'}`}>
      <form onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend className="text-small font-semibold text-stone-800">Your rating</legend>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="cursor-pointer p-1">
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={`text-h3 ${value <= rating ? 'text-amber-600' : 'text-stone-300'}`}
                >
                  ★
                </span>
                <span className="sr-only">
                  {value} star{value === 1 ? '' : 's'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 space-y-4">
          <FormField
            label="Title"
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="The one thing you would tell a friend"
          />
          <FormField
            label="Your review"
            as="textarea"
            required
            value={reviewText}
            onChange={(event) => setReviewText(event.target.value)}
            hint="What was the trip really like? Honest reviews help other travellers most."
          />
        </div>

        {problem && (
          <p role="alert" className="mt-3 text-small font-medium text-danger-700">
            {problem}
          </p>
        )}
        {state === 'failed' && (
          <p role="alert" className="mt-3 text-small font-medium text-danger-700">
            That could not be saved just now. Please try again.
          </p>
        )}

        <p className="mt-4 text-small text-stone-500">
          This review is saved only in this browser and placed in the demo moderation queue. It is not published publicly.
        </p>

        <button
          type="submit"
          disabled={state === 'sending'}
          className="mt-4 rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state === 'sending' ? 'Saving…' : 'Save for demo moderation'}
        </button>
      </form>
    </Modal>
  )
}
