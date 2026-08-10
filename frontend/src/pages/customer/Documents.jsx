// Documents: metadata for every file across the account's bookings. No uploads.
import { useEffect, useState } from 'react'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import { listItems } from '../../lib/dataClient.js'
import { formatDate } from '../../lib/formatters.js'

function documentLabel(document) {
  const labels = {
    passport: 'Passport copy',
    insurance: 'Travel insurance',
    photo: 'Permit photo',
    form: 'Trip form',
  }
  return `${labels[document.type] || 'Trip document'} (sample metadata)`
}

export default function Documents() {
  usePageMeta('Documents', 'Browser-only document metadata for your demo trips.')
  const { user } = useAuth()
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    listItems('bookings', { filters: { userId: user.id }, sort: 'createdAt', direction: 'desc', pageSize: 0 }).then(
      (result) => {
        if (!active) return
        setState(result.success ? { status: 'ready', bookings: result.data } : { status: 'error' })
      }
    )
    return () => {
      active = false
    }
  }, [user.id])

  if (state.status === 'loading') return <LoadingState label="Loading your documents…" rows={6} />
  if (state.status === 'error') {
    return <ErrorState title="Could not load your documents" description="Please refresh the page to try again." />
  }

  const rows = state.bookings.flatMap((booking) =>
    booking.documents.map((doc) => ({ ...doc, reference: booking.reference }))
  )

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-h2 text-stone-900">Documents</h1>
      <p className="mt-1 text-body text-stone-600">
        Metadata only for this browser demo. No files are uploaded or transmitted here.
        Do not enter passport, payment, health, or identity documents. Secure uploads arrive in Version 2.
      </p>

      <div className="mt-8">
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing on file yet"
            description="When a demo booking has a checklist, its document type and status appear here. No document files are collected in V1."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
            <table className="w-full text-left text-small">
              <thead>
                <tr className="border-b border-stone-200 text-stone-600">
                  <th scope="col" className="px-4 py-3 font-semibold">Document</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Booking</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Received</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.reference}-${row.name}`} className="border-b border-stone-100 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-stone-900">{documentLabel(row)}</td>
                    <td className="px-4 py-3 capitalize text-stone-700">{row.type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} label={row.status === 'verified' ? 'Verified' : 'Received'} />
                    </td>
                    <td className="px-4 py-3 text-stone-700">{row.reference}</td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(row.uploadedAt, { short: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
