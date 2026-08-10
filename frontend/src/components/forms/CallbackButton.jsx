// Opens the callback form in a modal. Sits in the header and the footer.
import { useState } from 'react'
import Modal from '../common/Modal.jsx'
import CallbackForm from './CallbackForm.jsx'

export default function CallbackButton({ className = '', label = 'Request a callback' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Ask us to call you">
        <CallbackForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  )
}
