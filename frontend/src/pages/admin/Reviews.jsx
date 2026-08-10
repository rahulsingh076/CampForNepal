import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import useCollection from '../../hooks/useCollection.js'
import { updateItem } from '../../lib/dataClient.js'
import { formatDate } from '../../lib/formatters.js'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

export default function Reviews() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const reviews = useCollection('reviews', { sort: 'createdAt', direction: 'desc', pageSize: 0 })
  const packages = useCollection('packages', { pageSize: 0 })
  const collectionStatus = [reviews, packages].some((collection) => collection.status === 'error') ? 'error' : [reviews, packages].some((collection) => collection.status === 'loading') ? 'loading' : 'ready'

  async function change(review, changes, message) {
    const result = await updateItem('reviews', review.id, changes, user)
    if (!result.success) return showToast(result.message || 'Could not update the review.', 'error')
    reviews.reload()
    showToast(message)
  }

  const columns = [
    { key: 'title', label: 'Review', sortable: true, searchValue: (row) => [row.title, row.customerName], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.customerName} · {row.rating}/5</p></div> },
    { key: 'packageId', label: 'Trip', sortable: true, searchValue: (row) => packages.items.find((item) => item.id === row.packageId)?.title || '', render: (row) => packages.items.find((item) => item.id === row.packageId)?.title || (row.guideId ? 'Guide review' : 'General review') },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'featured', label: 'Homepage', sortable: true, render: (row) => row.featured ? 'Featured' : 'Not featured' },
    { key: 'createdAt', label: 'Received', sortable: true, render: (row) => formatDate(row.createdAt, { short: true }) },
  ]

  function actions(row) {
    return [
      ...(row.status !== 'published' ? [{ label: 'Approve', onClick: () => change(row, { status: 'published' }, 'Review approved.') }] : []),
      ...(row.status !== 'rejected' ? [{ label: 'Reject', tone: 'danger', onClick: () => change(row, { status: 'rejected', featured: false }, 'Review rejected.') }] : []),
      { label: row.featured ? 'Remove feature' : 'Feature on home', disabled: row.status !== 'published', onClick: () => change(row, { featured: !row.featured }, row.featured ? 'Removed from homepage.' : 'Review featured on homepage.') },
    ]
  }

  function retry() { reviews.reload(); packages.reload() }
  return <div className="space-y-6"><AdminPageHeader title="Review moderation" description="Approve or reject customer reviews, then choose the ones that lead the homepage." />{collectionStatus === 'loading' ? <LoadingState label="Loading reviews" rows={8} /> : collectionStatus === 'error' ? <ErrorState title="We could not load reviews" description="Try again to refresh the moderation queue." action={<button type="button" onClick={retry} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Try again</button>} /> : <AdminDataTable columns={columns} rows={reviews.items} rowActions={actions} searchPlaceholder="Search reviews" emptyState={{ title: 'No reviews to moderate', description: 'Customer reviews will arrive here for moderation.' }} />}</div>
}
