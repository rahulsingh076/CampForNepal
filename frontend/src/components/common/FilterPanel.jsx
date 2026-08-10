// Shared listing filters: compact desktop controls and an explicit mobile sheet.
import { useState } from 'react'
import Button from './Button.jsx'
import FormField from './FormField.jsx'
import MobileFilterDrawer from './MobileFilterDrawer.jsx'

function valuesFrom(filters) {
  return Object.fromEntries(filters.map((filter) => [filter.name, filter.value]))
}

function isSearch(filter) {
  return filter.control === 'search'
}

export default function FilterPanel({ filters, onApply, onClear, resultCount, totalCount }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const values = valuesFrom(filters)
  const activeFilters = filters.filter((filter) => filter.value && filter.countsAsFilter !== false)
  const appliedCount = activeFilters.length
  const activeSort = filters.find((filter) => filter.control === 'sort' && filter.value)

  function applyChange(name, value) {
    const nextValues = { ...values, [name]: value }
    if (onApply) {
      onApply(nextValues)
      return
    }
    filters.find((filter) => filter.name === name)?.onChange?.(value)
  }

  function applyAll(nextValues) {
    if (onApply) {
      onApply(nextValues)
      return
    }
    filters.forEach((filter) => {
      if (filter.value !== nextValues[filter.name]) filter.onChange?.(nextValues[filter.name])
    })
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200 sm:p-6">
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <div>
          <p className="text-small font-semibold text-stone-900">Filter results</p>
          <p className="mt-1 text-small text-stone-600">{appliedCount ? `${appliedCount} filter${appliedCount === 1 ? '' : 's'} applied` : 'All results'}</p>
        </div>
        <div className="flex items-center gap-3">
          {appliedCount > 0 && (
            <button type="button" onClick={onClear} className="min-h-11 text-small font-semibold text-primary-800 underline underline-offset-4">
              Clear all
            </button>
          )}
          <button type="button" onClick={() => setDrawerOpen(true)} className="inline-flex min-h-11 items-center rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">
            Filters{appliedCount ? ` (${appliedCount})` : ''}
          </button>
        </div>
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-4 lg:items-end">
        {filters.map((filter) => (
          <FormField
            key={filter.name}
            label={filter.label}
            as={isSearch(filter) ? 'input' : 'select'}
            type={isSearch(filter) ? 'search' : undefined}
            placeholder={filter.placeholder}
            value={filter.value}
            onChange={(event) => applyChange(filter.name, event.target.value)}
            options={isSearch(filter) ? [] : [{ value: '', label: filter.anyLabel }, ...filter.options]}
          />
        ))}

        {appliedCount > 0 && (
          <Button variant="secondary" className="min-h-11" onClick={onClear}>
            Clear all
          </Button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => {
            const label = filter.options.find((option) => option.value === filter.value)?.label || filter.value
            return (
              <li key={filter.name}>
                <button type="button" onClick={() => applyChange(filter.name, '')} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-small font-medium text-primary-800 hover:bg-primary-100">
                  {filter.label}: {label}
                  <span aria-hidden="true">×</span>
                  <span className="sr-only">Remove {filter.label} filter</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {activeSort && (
        <p className="mt-4 text-small text-stone-600">
          Sorted by {activeSort.options.find((option) => option.value === activeSort.value)?.label || activeSort.value}
        </p>
      )}

      <p className={`${activeSort ? 'mt-2' : 'mt-4'} text-small text-stone-600`} role="status" aria-live="polite">
        {resultCount} of {totalCount} results
      </p>

      <MobileFilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} filters={filters} onApply={applyAll} onReset={onClear} />
    </div>
  )
}
