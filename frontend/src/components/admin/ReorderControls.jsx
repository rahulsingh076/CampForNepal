// Buttons are naturally keyboard-operable; the parent list can also expose
// Alt+Arrow shortcuts through onKeyDown for fast editorial reordering.
export default function ReorderControls({ label, index, total, onMove }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-md border border-stone-300" aria-label={`Reorder ${label}`}>
      <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${label} up`} className="flex h-11 w-11 items-center justify-center text-stone-700 hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-40">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m7 14 5-5 5 5" /></svg>
      </button>
      <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${label} down`} className="flex h-11 w-11 items-center justify-center border-l border-stone-300 text-stone-700 hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-40">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
      </button>
    </div>
  )
}
