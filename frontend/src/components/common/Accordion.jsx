// One collapsible list, used for both the itinerary and the FAQ.
import { useId, useState } from 'react'

export default function Accordion({ items, defaultOpen = 0, openAllLabel }) {
  const [openIndexes, setOpenIndexes] = useState(defaultOpen >= 0 ? [defaultOpen] : [])
  // Namespaced per instance: a trip page mounts two accordions, and index-only
  // ids would collide so the FAQ's aria-controls pointed at the itinerary.
  const instanceId = useId()

  const allOpen = items.length > 0 && openIndexes.length === items.length

  function toggle(index) {
    setOpenIndexes((current) => (
      current.includes(index) ? current.filter((value) => value !== index) : [index]
    ))
  }

  function toggleAll() {
    setOpenIndexes(allOpen ? [] : items.map((_, index) => index))
  }

  return (
    <div>
      {openAllLabel && items.length > 1 && (
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={toggleAll} aria-pressed={allOpen} className="min-h-11 rounded-md px-3 py-2 text-small font-semibold text-primary-800 hover:bg-primary-50">
            {allOpen ? 'Close all' : openAllLabel}
          </button>
        </div>
      )}
      <div className="divide-y divide-stone-200 overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index)
        const panelId = `${instanceId}-panel-${index}`
        const buttonId = `${instanceId}-button-${index}`

        return (
          <div key={item.key || index}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex w-full items-start gap-4 px-6 py-5 text-left transition-colors duration-200 hover:bg-sand-50"
              >
                {item.marker && (
                  <span className="mt-0.5 shrink-0 rounded-md bg-primary-50 px-2 py-1 text-small font-semibold text-primary-800">
                    {item.marker}
                  </span>
                )}

                <span className="flex-1">
                  <span className="block text-body font-semibold text-stone-900">
                    {item.title}
                  </span>
                  {item.meta && (
                    <span className="mt-1 block text-small text-stone-600">{item.meta}</span>
                  )}
                </span>

                <svg
                  className={`mt-1 h-5 w-5 shrink-0 text-stone-500 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </h3>

            <div id={panelId} role="region" aria-labelledby={buttonId} className={`${isOpen ? 'block' : 'hidden print:block'} px-6 pb-6`}>
              {item.content}
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}
