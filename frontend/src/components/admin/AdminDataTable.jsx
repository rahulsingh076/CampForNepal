// Consistent admin table with remembered search, sorting, pagination, and row actions.
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import EmptyState from '../common/EmptyState.jsx'
import { readJson, writeJson } from '../../lib/storage.js'

function searchableValues(value) {
  if (typeof value === 'string' || typeof value === 'number') return [String(value)]
  if (Array.isArray(value)) return value.flatMap(searchableValues)
  if (value && typeof value === 'object') return Object.values(value).flatMap(searchableValues)
  return []
}

function columnSearchValues(row, column) {
  if (column.searchable === false) return []
  if (typeof column.searchValue === 'function') return searchableValues(column.searchValue(row))
  if (Array.isArray(column.searchKeys)) {
    return column.searchKeys.flatMap((key) => searchableValues(row[key]))
  }
  return searchableValues(row[column.key])
}

function rowSearchText(row, columns) {
  return columns.flatMap((column) => columnSearchValues(row, column)).join(' ').toLowerCase()
}

function valueFor(row, column) {
  if (typeof column.sortValue === 'function') return column.sortValue(row)
  return row[column.key]
}

function storedState(key) {
  const value = readJson(`admin-table:${key}`, {})
  return {
    search: typeof value.search === 'string' ? value.search : '',
    sortKey: typeof value.sortKey === 'string' ? value.sortKey : '',
    direction: value.direction === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(value.page) && value.page > 0 ? value.page : 1,
  }
}

export default function AdminDataTable({
  columns,
  rows = [],
  rowActions,
  emptyState,
  searchPlaceholder = 'Search records',
  pageSize = 8,
  stateKey,
  activeFilters = [],
  onClearFilters,
}) {
  const location = useLocation()
  const storageKey = stateKey || location.pathname
  const [tableState, setTableState] = useState(() => storedState(storageKey))
  const { search, sortKey, direction, page } = tableState
  const sort = columns.find((column) => column.key === sortKey) || null

  useEffect(() => {
    setTableState(storedState(storageKey))
  }, [storageKey])

  useEffect(() => {
    writeJson(`admin-table:${storageKey}`, tableState)
  }, [storageKey, tableState])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    const next = needle ? rows.filter((row) => rowSearchText(row, columns).includes(needle)) : [...rows]
    if (!sort) return next

    return next.sort((leftRow, rightRow) => {
      const left = valueFor(leftRow, sort)
      const right = valueFor(rightRow, sort)
      const outcome = typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left ?? '').localeCompare(String(right ?? ''))
      return direction === 'desc' ? -outcome : outcome
    })
  }, [columns, direction, rows, search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function update(changes) {
    setTableState((current) => ({ ...current, ...changes }))
  }

  function updateSearch(value) {
    update({ search: value, page: 1 })
  }

  function changeSort(column) {
    if (!column.sortable) return
    if (sortKey === column.key) update({ direction: direction === 'asc' ? 'desc' : 'asc', page: 1 })
    else update({ sortKey: column.key, direction: 'asc', page: 1 })
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 p-4">
        <label className="relative block w-full max-w-sm">
          <span className="sr-only">{searchPlaceholder}</span>
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-stone-300 py-2 pl-9 pr-3 text-small text-stone-900 placeholder:text-stone-500"
          />
        </label>
        <div className="flex items-center gap-3">
          <p aria-live="polite" className="text-small text-stone-600">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </p>
          {search && (
            <button type="button" onClick={() => updateSearch('')} className="min-h-11 rounded-md px-3 py-2 text-small font-semibold text-primary-800 hover:bg-primary-50">
              Clear search
            </button>
          )}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-4 py-3" aria-label="Active filters">
          <span className="text-small font-semibold text-stone-700">Filters:</span>
          {activeFilters.map((filter) => <span key={filter} className="rounded-full bg-sand-100 px-2.5 py-1 text-small text-stone-700">{filter}</span>)}
          {onClearFilters && <button type="button" onClick={onClearFilters} className="min-h-11 rounded-md px-3 py-2 text-small font-semibold text-primary-800 hover:bg-primary-50">Clear filters</button>}
        </div>
      )}

      {pageRows.length === 0 ? (
        <EmptyState
          className="m-4"
          title={emptyState?.title || 'No records found'}
          description={emptyState?.description || (search ? 'Try another search or clear it to see every record.' : 'Records will appear here when available.')}
          action={emptyState?.action || (search ? <button type="button" onClick={() => updateSearch('')} className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Clear search</button> : null)}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-left">
            <caption className="sr-only">Admin records</caption>
            <thead className="bg-sand-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} scope="col" aria-sort={column.sortable ? (sortKey === column.key ? (direction === 'asc' ? 'ascending' : 'descending') : 'none') : undefined} className="px-4 py-3 text-small font-semibold text-stone-700">
                    {column.sortable ? (
                      <button type="button" onClick={() => changeSort(column)} className="inline-flex min-h-11 items-center gap-1 rounded text-left hover:text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700">
                        {column.label}
                        <span className="sr-only">{sortKey === column.key ? `, sorted ${direction === 'asc' ? 'ascending' : 'descending'}` : ', sortable'}</span>
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d={sortKey === column.key && direction === 'desc' ? 'm7 10 5 5 5-5' : 'm7 14 5-5 5 5'} />
                        </svg>
                      </button>
                    ) : column.label}
                  </th>
                ))}
                {rowActions && <th scope="col" className="px-4 py-3 text-right text-small font-semibold text-stone-700">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {pageRows.map((row) => {
                const actions = rowActions?.(row) || []
                return (
                  <tr key={row.id} className="hover:bg-sand-50/70">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 align-middle text-small text-stone-700">
                        {column.render ? column.render(row) : String(row[column.key] ?? '')}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1">
                          {actions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              onClick={action.onClick}
                              disabled={action.disabled}
                              className={`min-h-11 rounded-md px-3 py-2 text-small font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${action.tone === 'danger' ? 'text-danger-700 hover:bg-danger-50' : 'text-primary-700 hover:bg-primary-50'}`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
          <p className="text-small text-stone-600">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => update({ page: Math.max(1, currentPage - 1) })} disabled={currentPage === 1} className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-stone-800 disabled:cursor-not-allowed disabled:opacity-50">Previous</button>
            <button type="button" onClick={() => update({ page: Math.min(totalPages, currentPage + 1) })} disabled={currentPage === totalPages} className="min-h-11 rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-stone-800 disabled:cursor-not-allowed disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
