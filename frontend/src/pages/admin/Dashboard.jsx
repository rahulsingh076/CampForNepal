// The operational overview is intentionally read-only. It is
// fed entirely by dataClient so backend wiring can replace it without a UI rewrite.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import { bookingStatusLabel, normalizeBookingStatus } from '../../config/bookingStatuses.js'
import { canAccessAdminPath } from '../../config/navigation.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { formatDate } from '../../lib/formatters.js'
import { listItems } from '../../lib/dataClient.js'

const SOURCES = ['packages', 'fixedDepartures', 'inquiries', 'bookings', 'reviews', 'blogPosts']

function sortNewest(rows) {
  return [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

function StatIcon({ type }) {
  const paths = {
    packages: <path d="M4 6h16v13H4zM4 10h16M8 3v6M16 3v6" />,
    departures: <path d="M4 7h16v11H4zM4 11h16M8 3v4M16 3v4" />,
    inquiries: <path d="M4 13h4l1 3h6l1-3h4M4 13l2-8h12l2 8v6H4z" />,
    bookings: <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v1a2 2 0 000 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2v-1a2 2 0 000-4V8z" />,
    reviews: <path d="m12 4 2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2 8 13.7 4 9.8l5.5-.8z" />,
    posts: <path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" />,
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  )
}

function StatCard({ label, value, detail, type }) {
  return (
    <div className="border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-small font-semibold text-stone-600">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <StatIcon type={type} />
        </span>
      </div>
      <p className="mt-5 text-h3 text-stone-900">{value}</p>
      <p className="mt-1 text-small text-stone-600">{detail}</p>
    </div>
  )
}

function OperationsDashboard({ role }) {
  const { showToast } = useToast()
  const [state, setState] = useState({ status: 'loading', data: {}, error: '' })

  const loadDashboard = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    const results = await Promise.all(SOURCES.map((entity) => listItems(entity, { pageSize: 0 })))
    const failure = results.find((result) => !result.success)
    if (failure) {
      setState({ status: 'error', data: {}, error: failure.message || 'Dashboard data could not be loaded.' })
      return false
    }

    setState({
      status: 'ready',
      error: '',
      data: Object.fromEntries(SOURCES.map((entity, index) => [entity, results[index].data])),
    })
    return true
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const derived = useMemo(() => {
    const packages = state.data.packages || []
    const departures = state.data.fixedDepartures || []
    const inquiries = state.data.inquiries || []
    const bookings = state.data.bookings || []
    const reviews = state.data.reviews || []
    const posts = state.data.blogPosts || []
    const today = new Date().toISOString().slice(0, 10)

    return {
      packages,
      departures,
      inquiries,
      bookings,
      reviews,
      posts,
      upcomingDepartures: departures.filter(
        (departure) => departure.startDate >= today && !['completed', 'cancelled'].includes(departure.status)
      ),
      openInquiries: inquiries.filter((inquiry) => !['closed', 'lost', 'converted'].includes(inquiry.status)),
      bookedTrips: bookings.filter((booking) => normalizeBookingStatus(booking.status) === 'booked'),
      pendingReviews: reviews.filter((review) => review.status === 'pending'),
      publishedPosts: posts.filter((post) => post.status === 'published'),
      recentInquiries: sortNewest(inquiries).slice(0, 5),
      recentBookings: sortNewest(bookings).slice(0, 5),
    }
  }, [state.data])

  const quickActions = [
    canAccessAdminPath(role, '/admin/inquiries') && { label: 'Open inquiries', path: '/admin/inquiries' },
    canAccessAdminPath(role, '/admin/bookings') && { label: 'Review bookings', path: '/admin/bookings' },
    canAccessAdminPath(role, '/admin/content') && { label: 'Manage catalogue', path: '/admin/content' },
    canAccessAdminPath(role, '/admin/posts') && { label: 'Edit posts', path: '/admin/posts' },
  ].filter(Boolean)

  async function refresh() {
    const success = await loadDashboard()
    showToast(success ? 'Dashboard data refreshed.' : 'Dashboard data could not be refreshed.', success ? 'success' : 'error')
  }

  const inquiryColumns = [
    {
      key: 'fullName',
      label: 'Traveller',
      sortable: true,
      searchValue: (row) => [row.fullName, row.subject],
      render: (row) => (
        <div>
          <p className="font-semibold text-stone-900">{row.fullName}</p>
          <p className="mt-0.5 max-w-sm truncate text-stone-600">{row.subject}</p>
        </div>
      ),
    },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'createdAt', label: 'Received', sortable: true, render: (row) => formatDate(row.createdAt, { short: true }) },
  ]

  const bookingColumns = [
    {
      key: 'reference',
      label: 'Booking',
      sortable: true,
      searchValue: (row) => [row.reference, row.leadTraveller?.fullName],
      render: (row) => (
        <div>
          <p className="font-semibold text-stone-900">{row.reference}</p>
          <p className="mt-0.5 text-stone-600">{row.leadTraveller.fullName}</p>
        </div>
      ),
    },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={normalizeBookingStatus(row.status)} label={bookingStatusLabel(row.status)} /> },
    { key: 'updatedAt', label: 'Updated', sortable: true, render: (row) => formatDate(row.updatedAt, { short: true }) },
  ]

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Operations dashboard"
        description="A live snapshot of the front-office workload in this local demo."
        actions={
          <button
            type="button"
            onClick={refresh}
            title="Refresh dashboard data"
            aria-label="Refresh dashboard data"
            disabled={state.status === 'loading'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 text-stone-700 transition-colors duration-200 hover:border-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M20 11a8 8 0 1 0 2 5.3M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        }
      />

      {state.status === 'error' ? (
        <div className="border border-danger-200 bg-danger-50 p-5 text-danger-900">
          <p className="font-semibold">{state.error}</p>
          <button type="button" onClick={refresh} className="mt-3 text-small font-semibold underline">Try again</button>
        </div>
      ) : (
        <>
          <section aria-label="Business totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Packages" value={derived.packages.length} detail="In the trip catalogue" type="packages" />
            <StatCard label="Upcoming departures" value={derived.upcomingDepartures.length} detail="Not completed or cancelled" type="departures" />
            <StatCard label="Open inquiries" value={derived.openInquiries.length} detail="Awaiting a team outcome" type="inquiries" />
            <StatCard label="Booked trips" value={derived.bookedTrips.length} detail="Not cancelled" type="bookings" />
            <StatCard label="Pending reviews" value={derived.pendingReviews.length} detail="Awaiting moderation" type="reviews" />
            <StatCard label="Published posts" value={derived.publishedPosts.length} detail="Visible on the public journal" type="posts" />
          </section>

          <section aria-labelledby="quick-actions-title" className="border-y border-stone-200 py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="quick-actions-title" className="text-h4 font-sans text-stone-900">Quick actions</h2>
                <p className="mt-1 text-small text-stone-600">Jump to the main admin areas.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickActions.length ? (
                  quickActions.map((action) => (
                    <Link key={action.path} to={action.path} className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 transition-colors duration-200 hover:border-primary-600 hover:bg-primary-50">
                      {action.label}
                    </Link>
                  ))
                ) : (
                  <span className="text-small text-stone-600">No quick actions available.</span>
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-8 xl:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-h4 font-sans text-stone-900">Recent inquiries</h2>
                  <p className="mt-1 text-small text-stone-600">Newest messages submitted through the site.</p>
                </div>
                {canAccessAdminPath(role, '/admin/inquiries') && <Link to="/admin/inquiries" className="text-small font-semibold text-primary-700 hover:text-primary-900">View all</Link>}
              </div>
              <AdminDataTable
                columns={inquiryColumns}
                rows={derived.recentInquiries}
                pageSize={5}
                searchPlaceholder="Search recent inquiries"
                emptyState={{ title: 'No inquiries yet', description: 'New website inquiries will appear here.' }}
              />
            </div>

            <div className="min-w-0">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-h4 font-sans text-stone-900">Recent bookings</h2>
                  <p className="mt-1 text-small text-stone-600">The latest booked or cancelled records.</p>
                </div>
                {canAccessAdminPath(role, '/admin/bookings') && <Link to="/admin/bookings" className="text-small font-semibold text-primary-700 hover:text-primary-900">View all</Link>}
              </div>
              <AdminDataTable
                columns={bookingColumns}
                rows={derived.recentBookings}
                pageSize={5}
                searchPlaceholder="Search recent bookings"
                emptyState={{ title: 'No bookings yet', description: 'New booking records will appear here.' }}
              />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { role } = useAuth()

  return <OperationsDashboard role={role} />
}
