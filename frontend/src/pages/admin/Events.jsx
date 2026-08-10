import { useMemo, useState } from 'react'
import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import AdminFormSection from '../../components/admin/AdminFormSection.jsx'
import MediaListEditor from '../../components/admin/MediaListEditor.jsx'
import ModalForm from '../../components/admin/ModalForm.jsx'
import RelationshipChecklist from '../../components/admin/RelationshipChecklist.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import FormField from '../../components/common/FormField.jsx'
import useCollection from '../../hooks/useCollection.js'
import { cleanMediaItems } from '../../lib/media.js'
import { validateForm } from '../../lib/validators.js'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const TYPE_OPTIONS = [
  { value: 'information_session', label: 'Information session' },
  { value: 'cultural_festival', label: 'Cultural festival' },
  { value: 'trekking_departure', label: 'Trekking departure' },
  { value: 'tourism_promotion', label: 'Tourism promotion' },
  { value: 'special_campaign', label: 'Special campaign' },
]

const DEFAULTS = {
  title: '',
  slug: '',
  eventType: 'information_session',
  shortDescription: '',
  fullDescription: '',
  startDateTime: '',
  endDateTime: '',
  timezone: 'Asia/Kathmandu',
  venueName: '',
  address: '',
  mapLink: '',
  organizer: 'Camp For Nepal',
  coverMedia: null,
  gallery: [],
  videos: [],
  relatedPackageIds: [],
  relatedDestinationIds: [],
  ctaLabel: 'Contact us',
  ctaLink: '/contact',
  status: 'draft',
  featured: false,
  seo: { metaTitle: '', metaDescription: '', keywords: [] },
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function textList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function EventForm({ open, mode, initialItem, onClose, onSave, busy, packages = [], destinations = [], mediaAssets = [] }) {
  const initial = useMemo(() => ({ ...DEFAULTS, ...(initialItem || {}) }), [initialItem])
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  function field(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function setSeo(name, value) {
    field('seo', { ...(values.seo || {}), [name]: value })
  }

  async function submit(event) {
    event.preventDefault()
    const cover = cleanMediaItems(Array.isArray(values.coverMedia) ? values.coverMedia : [values.coverMedia]).at(0) || null
    const next = {
      ...values,
      title: values.title.trim(),
      slug: slugify(values.slug || values.title),
      shortDescription: values.shortDescription.trim(),
      fullDescription: values.fullDescription.trim(),
      venueName: values.venueName.trim(),
      address: values.address.trim(),
      mapLink: values.mapLink.trim(),
      organizer: values.organizer.trim(),
      coverMedia: cover,
      gallery: cleanMediaItems(values.gallery),
      videos: cleanMediaItems(values.videos),
      seo: { ...(values.seo || {}), keywords: Array.isArray(values.seo?.keywords) ? values.seo.keywords : textList(values.seo?.keywords) },
    }
    const validation = validateForm(next, {
      title: { required: true, label: 'Title' },
      slug: { required: true, label: 'Slug' },
      shortDescription: { required: true, label: 'Short description' },
      fullDescription: { required: true, label: 'Full description' },
      startDateTime: { required: true, label: 'Start date/time' },
    })
    if (Object.keys(validation).length) return setErrors(validation)
    await onSave(next)
  }

  const coverValue = values.coverMedia ? [values.coverMedia] : []

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={`${mode === 'edit' ? 'Edit' : 'Create'} event`} submitLabel={mode === 'edit' ? 'Save event' : 'Create event'} busy={busy} dirty={dirty} errors={errors} previewPath={`/events/${slugify(values.slug || values.title)}`} previewEnabled={mode === 'edit' && ['published', 'cancelled', 'completed'].includes(values.status)} size="xl">
      <AdminFormSection title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" required value={values.title} error={errors.title} onChange={(event) => field('title', event.target.value)} />
          <FormField label="Slug" required value={values.slug} error={errors.slug} onChange={(event) => field('slug', event.target.value)} />
          <FormField label="Type" as="select" options={TYPE_OPTIONS} value={values.eventType} onChange={(event) => field('eventType', event.target.value)} />
          <FormField label="Status" as="select" options={STATUS_OPTIONS} value={values.status} onChange={(event) => field('status', event.target.value)} />
          <FormField className="sm:col-span-2" label="Short description" required as="textarea" rows={3} value={values.shortDescription} error={errors.shortDescription} onChange={(event) => field('shortDescription', event.target.value)} />
          <FormField className="sm:col-span-2" label="Full description" required as="textarea" rows={7} value={values.fullDescription} error={errors.fullDescription} onChange={(event) => field('fullDescription', event.target.value)} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Schedule and venue">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start date/time" required value={values.startDateTime} error={errors.startDateTime} onChange={(event) => field('startDateTime', event.target.value)} />
          <FormField label="End date/time" value={values.endDateTime || ''} onChange={(event) => field('endDateTime', event.target.value)} />
          <FormField label="Timezone" value={values.timezone} onChange={(event) => field('timezone', event.target.value)} />
          <FormField label="Venue" value={values.venueName} onChange={(event) => field('venueName', event.target.value)} />
          <FormField className="sm:col-span-2" label="Address/location" value={values.address} onChange={(event) => field('address', event.target.value)} />
          <FormField label="Map link" value={values.mapLink} onChange={(event) => field('mapLink', event.target.value)} />
          <FormField label="Organizer" value={values.organizer} onChange={(event) => field('organizer', event.target.value)} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Media">
        <div className="space-y-6">
          <MediaListEditor label="Cover media" value={coverValue} onChange={(items) => field('coverMedia', items[0] || null)} libraryAssets={mediaAssets} addLabel="Add cover" />
          <MediaListEditor label="Gallery media" value={values.gallery || []} onChange={(items) => field('gallery', items)} libraryAssets={mediaAssets} />
          <MediaListEditor label="Videos and reels" value={values.videos || []} onChange={(items) => field('videos', items)} libraryAssets={mediaAssets.filter((asset) => ['video', 'reel'].includes(asset.type))} addLabel="Add video/reel" />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Related content and CTA">
        <div className="grid gap-6">
          <RelationshipChecklist label="Related packages" options={packages.map((item) => ({ id: item.id, label: item.title }))} value={values.relatedPackageIds || []} onChange={(ids) => field('relatedPackageIds', ids)} />
          <RelationshipChecklist label="Related destinations" options={destinations.map((item) => ({ id: item.id, label: item.title }))} value={values.relatedDestinationIds || []} onChange={(ids) => field('relatedDestinationIds', ids)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="CTA label" value={values.ctaLabel} onChange={(event) => field('ctaLabel', event.target.value)} />
            <FormField label="CTA link" value={values.ctaLink} onChange={(event) => field('ctaLink', event.target.value)} />
          </div>
        </div>
      </AdminFormSection>

      <AdminFormSection title="Search metadata">
        <div className="grid gap-4">
          <FormField label="Meta title" value={values.seo?.metaTitle || ''} onChange={(event) => setSeo('metaTitle', event.target.value)} />
          <FormField label="Meta description" as="textarea" rows={3} value={values.seo?.metaDescription || ''} onChange={(event) => setSeo('metaDescription', event.target.value)} />
          <FormField label="Keywords" value={(values.seo?.keywords || []).join(', ')} onChange={(event) => setSeo('keywords', textList(event.target.value))} />
        </div>
      </AdminFormSection>
    </ModalForm>
  )
}

export default function Events() {
  const packages = useCollection('packages', { pageSize: 0 })
  const destinations = useCollection('destinations', { pageSize: 0 })
  const mediaAssets = useCollection('mediaAssets', { pageSize: 0 })
  const columns = [
    { key: 'title', label: 'Event', sortable: true, searchValue: (row) => [row.title, row.eventType, row.shortDescription, row.venueName], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.eventType?.replace(/_/g, ' ')}</p></div> },
    { key: 'startDateTime', label: 'Starts', sortable: true, render: (row) => row.startDateTime?.slice(0, 10) || 'Not set' },
    { key: 'venueName', label: 'Venue' },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <AdminCrudPage
      entity="events"
      title="Events"
      description="Create and manage public events, travel windows, campaigns, and information sessions. No ticket or payment workflow is included."
      columns={columns}
      Form={EventForm}
      formProps={{ packages: packages.items, destinations: destinations.items, mediaAssets: mediaAssets.items }}
      createLabel="Add event"
      emptyState={{ title: 'No events yet', description: 'Create the first draft event with verified details.' }}
    />
  )
}

