export default function PrintButton({ label = 'Print', className = '' }) {
  function printPage() {
    window.print()
  }

  return (
    <button
      type="button"
      onClick={printPage}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-stone-800 hover:border-primary-600 hover:text-primary-800 print:hidden ${className}`}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M7 8V4h10v4M7 18H5a2 2 0 01-2-2v-5a2 2 0 012-2h14a2 2 0 012 2v5a2 2 0 01-2 2h-2M7 14h10v7H7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  )
}
