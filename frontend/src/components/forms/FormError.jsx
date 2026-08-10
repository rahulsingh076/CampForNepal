// Shown when a submission could not be saved at all.
export default function FormError({ show, message, onRecover }) {
  if (!show) return null

  return (
    <div role="alert" className="space-y-3 text-small font-medium text-danger-700">
      <p>{message || 'We could not save that just now. Please try again.'}</p>
      {onRecover && (
        <button type="button" onClick={onRecover} className="font-semibold underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  )
}
