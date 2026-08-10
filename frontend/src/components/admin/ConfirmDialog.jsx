import Modal from '../common/Modal.jsx'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm this action',
  description,
  confirmLabel = 'Confirm',
  tone = 'danger',
  busy = false,
  itemName,
}) {
  const confirmClasses =
    tone === 'danger'
      ? 'bg-danger-700 text-white hover:bg-danger-800'
      : 'bg-primary-700 text-white hover:bg-primary-800'

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {description && <p className="text-body text-stone-600">{description}</p>}
      {itemName && <p className="mt-4 text-small font-semibold text-stone-900">Affected item: {itemName}</p>}
      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-stone-800 hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-small font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${confirmClasses}`}
        >
          {busy ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
