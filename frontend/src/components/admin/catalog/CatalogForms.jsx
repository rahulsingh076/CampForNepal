import { useMemo, useState } from 'react'
import AdminFormSection from '../AdminFormSection.jsx'
import AdminImageField from '../AdminImageField.jsx'
import FaqEditor from '../FaqEditor.jsx'
import ItineraryEditor from '../ItineraryEditor.jsx'
import MediaListEditor from '../MediaListEditor.jsx'
import ModalForm from '../ModalForm.jsx'
import RelationshipChecklist from '../RelationshipChecklist.jsx'
import StringListEditor from '../StringListEditor.jsx'
import FormField from '../../common/FormField.jsx'
import { cleanMediaItems } from '../../../lib/media.js'
import { validateForm } from '../../../lib/validators.js'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

const PACKAGE_TYPES = ['tour', 'trekking', 'expedition'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))
const DIFFICULTIES = ['easy', 'moderate', 'challenging', 'strenuous', 'extreme'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))
const DEPARTURE_STATUSES = ['draft', 'booking_open', 'almost_full', 'guaranteed', 'closed', 'cancelled', 'completed'].map((value) => ({ value, label: value.replace(/_/g, ' ') }))
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function cleanStrings(items = []) {
  return items.map((item) => String(item || '').trim()).filter(Boolean)
}

function numberOrEmpty(value) {
  return value === '' || value === null || value === undefined ? '' : String(value)
}

function useEditor(initialItem, defaults) {
  const initial = useMemo(() => ({ ...defaults, ...(initialItem || {}) }), [defaults, initialItem])
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const snapshot = JSON.stringify(initial)

  function field(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  return { values, errors, setErrors, field, dirty: JSON.stringify(values) !== snapshot }
}

function SeoFields({ values, field }) {
  const seo = values.seo || {}
  function update(name, value) {
    field('seo', { ...seo, [name]: value })
  }

  return (
    <div className="grid gap-4">
      <FormField label="Meta title" value={seo.metaTitle || ''} onChange={(event) => update('metaTitle', event.target.value)} />
      <FormField label="Meta description" as="textarea" rows={3} value={seo.metaDescription || ''} onChange={(event) => update('metaDescription', event.target.value)} />
      <StringListEditor label="SEO keywords" value={seo.keywords || []} onChange={(keywords) => update('keywords', keywords)} addLabel="Add keyword" />
    </div>
  )
}

function GalleryFields({ values, field, mediaAssets = [] }) {
  return <MediaListEditor label="Gallery media" value={values.gallery || []} onChange={(gallery) => field('gallery', gallery)} hint="Use current demo image URLs, approved local build assets, or media-library records with captions, alt text, focal points, and source/licence metadata." addLabel="Add media" libraryAssets={mediaAssets} />
}

function StatusControl({ values, field, options = STATUS_OPTIONS, featured = false }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Publication status" as="select" options={options} value={values.status} onChange={(event) => field('status', event.target.value)} />
      {featured && (
        <label className="mt-7 flex items-center gap-3 text-small font-semibold text-stone-800">
          <input type="checkbox" checked={Boolean(values.featured)} onChange={(event) => field('featured', event.target.checked)} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />
          Feature this trip
        </label>
      )}
    </div>
  )
}

const DESTINATION_DEFAULTS = {
  title: '', slug: '', region: '', shortDescription: '', fullDescription: '', gallery: [], bestSeason: [],
  mapInfo: { latitude: '', longitude: '', elevationMetres: '', nearestAirport: '' }, relatedPackageIds: [], relatedGuideIds: [],
  seo: { metaTitle: '', metaDescription: '', keywords: [] }, status: 'draft',
}

export function DestinationForm({ open, mode, initialItem, onClose, onSave, busy, packages = [], guides = [], mediaAssets = [] }) {
  const form = useEditor(initialItem, DESTINATION_DEFAULTS)
  const mapInfo = form.values.mapInfo || {}

  function setMap(name, value) {
    form.field('mapInfo', { ...mapInfo, [name]: value })
  }

  async function submit(event) {
    event.preventDefault()
    const values = {
      ...form.values,
      title: form.values.title.trim(),
      slug: slugify(form.values.slug || form.values.title),
      region: form.values.region.trim(),
      shortDescription: form.values.shortDescription.trim(),
      fullDescription: form.values.fullDescription.trim(),
      gallery: cleanMediaItems(form.values.gallery),
      bestSeason: cleanStrings(form.values.bestSeason),
      mapInfo: {
        latitude: Number(mapInfo.latitude) || 0,
        longitude: Number(mapInfo.longitude) || 0,
        elevationMetres: Number(mapInfo.elevationMetres) || 0,
        nearestAirport: mapInfo.nearestAirport?.trim() || '',
      },
      seo: { ...form.values.seo, keywords: cleanStrings(form.values.seo?.keywords) },
    }
    const errors = validateForm(values, {
      title: { required: true, label: 'Title' }, slug: { required: true, label: 'Slug' }, region: { required: true, label: 'Region' },
      shortDescription: { required: true, label: 'Short description' }, fullDescription: { required: true, label: 'Full description' },
    })
    if (Object.keys(errors).length) return form.setErrors(errors)
    await onSave(values)
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={`${mode === 'edit' ? 'Edit' : 'Create'} destination`} submitLabel={mode === 'edit' ? 'Save destination' : 'Create destination'} busy={busy} dirty={form.dirty} errors={form.errors} previewPath={`/destinations/${slugify(form.values.slug || form.values.title)}`} previewEnabled={mode === 'edit' && form.values.status === 'published'} size="wide">
      <AdminFormSection title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Destination name" required value={form.values.title} error={form.errors.title} onChange={(event) => form.field('title', event.target.value)} />
          <FormField label="Slug" required hint="Leave this readable; it becomes the public URL." value={form.values.slug} error={form.errors.slug} onChange={(event) => form.field('slug', event.target.value)} />
          <FormField label="Region" required value={form.values.region} error={form.errors.region} onChange={(event) => form.field('region', event.target.value)} />
          <StringListEditor label="Best season" value={form.values.bestSeason} onChange={(value) => form.field('bestSeason', value)} addLabel="Add month" />
          <FormField className="sm:col-span-2" label="Short description" required as="textarea" rows={3} value={form.values.shortDescription} error={form.errors.shortDescription} onChange={(event) => form.field('shortDescription', event.target.value)} />
          <FormField className="sm:col-span-2" label="Full description" required as="textarea" rows={8} value={form.values.fullDescription} error={form.errors.fullDescription} onChange={(event) => form.field('fullDescription', event.target.value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection title="Location facts">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Latitude" type="number" step="any" value={numberOrEmpty(mapInfo.latitude)} onChange={(event) => setMap('latitude', event.target.value)} />
          <FormField label="Longitude" type="number" step="any" value={numberOrEmpty(mapInfo.longitude)} onChange={(event) => setMap('longitude', event.target.value)} />
          <FormField label="Highest point (m)" type="number" min="0" value={numberOrEmpty(mapInfo.elevationMetres)} onChange={(event) => setMap('elevationMetres', event.target.value)} />
          <FormField label="Nearest airport" value={mapInfo.nearestAirport || ''} onChange={(event) => setMap('nearestAirport', event.target.value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection title="Related content">
        <div className="grid gap-6">
          <RelationshipChecklist label="Related packages" options={packages.map((item) => ({ id: item.id, label: item.title }))} value={form.values.relatedPackageIds || []} onChange={(value) => form.field('relatedPackageIds', value)} />
          <RelationshipChecklist label="Related guides" options={guides.map((item) => ({ id: item.id, label: item.fullName }))} value={form.values.relatedGuideIds || []} onChange={(value) => form.field('relatedGuideIds', value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection title="Gallery"><GalleryFields values={form.values} field={form.field} mediaAssets={mediaAssets} /></AdminFormSection>
      <AdminFormSection title="Search metadata"><SeoFields values={form.values} field={form.field} /></AdminFormSection>
      <AdminFormSection title="Visibility"><StatusControl values={form.values} field={form.field} /></AdminFormSection>
    </ModalForm>
  )
}

const ACTIVITY_DEFAULTS = {
  title: '', slug: '', category: 'trekking', difficulty: 'moderate', bestSeason: [], shortDescription: '', fullDescription: '', safetyNotes: [], requiredPermits: [],
  relatedDestinationIds: [], relatedPackageIds: [], gallery: [], seo: { metaTitle: '', metaDescription: '', keywords: [] }, status: 'draft',
}

export function ActivityForm({ open, mode, initialItem, onClose, onSave, busy, destinations = [], packages = [], mediaAssets = [] }) {
  const form = useEditor(initialItem, ACTIVITY_DEFAULTS)

  async function submit(event) {
    event.preventDefault()
    const values = {
      ...form.values,
      title: form.values.title.trim(), slug: slugify(form.values.slug || form.values.title), category: form.values.category.trim(),
      shortDescription: form.values.shortDescription.trim(), fullDescription: form.values.fullDescription.trim(),
      bestSeason: cleanStrings(form.values.bestSeason), safetyNotes: cleanStrings(form.values.safetyNotes), requiredPermits: cleanStrings(form.values.requiredPermits), gallery: cleanMediaItems(form.values.gallery),
      seo: { ...form.values.seo, keywords: cleanStrings(form.values.seo?.keywords) },
    }
    const errors = validateForm(values, {
      title: { required: true, label: 'Title' }, slug: { required: true, label: 'Slug' }, category: { required: true, label: 'Category' },
      shortDescription: { required: true, label: 'Short description' }, fullDescription: { required: true, label: 'Full description' },
    })
    if (Object.keys(errors).length) return form.setErrors(errors)
    await onSave(values)
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={`${mode === 'edit' ? 'Edit' : 'Create'} activity`} submitLabel={mode === 'edit' ? 'Save activity' : 'Create activity'} busy={busy} dirty={form.dirty} errors={form.errors} previewPath={`/things-to-do/${slugify(form.values.slug || form.values.title)}`} previewEnabled={mode === 'edit' && form.values.status === 'published'} size="wide">
      <AdminFormSection title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Activity name" required value={form.values.title} error={form.errors.title} onChange={(event) => form.field('title', event.target.value)} />
          <FormField label="Slug" required value={form.values.slug} error={form.errors.slug} onChange={(event) => form.field('slug', event.target.value)} />
          <FormField label="Category" required value={form.values.category} error={form.errors.category} onChange={(event) => form.field('category', event.target.value)} />
          <FormField label="Difficulty" as="select" options={DIFFICULTIES} value={form.values.difficulty} onChange={(event) => form.field('difficulty', event.target.value)} />
          <div className="sm:col-span-2"><StringListEditor label="Best season" value={form.values.bestSeason} onChange={(value) => form.field('bestSeason', value)} addLabel="Add month" /></div>
          <FormField className="sm:col-span-2" label="Short description" required as="textarea" rows={3} value={form.values.shortDescription} error={form.errors.shortDescription} onChange={(event) => form.field('shortDescription', event.target.value)} />
          <FormField className="sm:col-span-2" label="Full description" required as="textarea" rows={8} value={form.values.fullDescription} error={form.errors.fullDescription} onChange={(event) => form.field('fullDescription', event.target.value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection title="Safety and permits"><div className="grid gap-6"><StringListEditor label="Safety notes" value={form.values.safetyNotes} onChange={(value) => form.field('safetyNotes', value)} addLabel="Add note" /><StringListEditor label="Required permits" value={form.values.requiredPermits} onChange={(value) => form.field('requiredPermits', value)} addLabel="Add permit" /></div></AdminFormSection>
      <AdminFormSection title="Related content"><div className="grid gap-6"><RelationshipChecklist label="Related destinations" options={destinations.map((item) => ({ id: item.id, label: item.title }))} value={form.values.relatedDestinationIds || []} onChange={(value) => form.field('relatedDestinationIds', value)} /><RelationshipChecklist label="Related packages" options={packages.map((item) => ({ id: item.id, label: item.title }))} value={form.values.relatedPackageIds || []} onChange={(value) => form.field('relatedPackageIds', value)} /></div></AdminFormSection>
      <AdminFormSection title="Gallery"><GalleryFields values={form.values} field={form.field} mediaAssets={mediaAssets} /></AdminFormSection>
      <AdminFormSection title="Search metadata"><SeoFields values={form.values} field={form.field} /></AdminFormSection>
      <AdminFormSection title="Visibility"><StatusControl values={form.values} field={form.field} /></AdminFormSection>
    </ModalForm>
  )
}

const PACKAGE_DEFAULTS = {
  title: '', slug: '', type: 'trekking', category: 'trekking', region: '', destinationIds: [], activityIds: [], shortDescription: '', overview: '',
  price: '', discountPrice: '', duration: { days: '', nights: '' }, difficulty: 'moderate', maxElevationMetres: '', walkingPerDay: '', accommodation: '', meals: '', bestSeason: [], groupSize: { min: '', max: '' }, highlights: [], itinerary: [], costIncludes: [], costExcludes: [], gearList: [], permits: [], routeMap: '', gallery: [], faq: [], reviewsSummary: { averageRating: 0, totalReviews: 0 }, seo: { metaTitle: '', metaDescription: '', keywords: [] }, status: 'draft', featured: false,
}

export function PackageForm({ open, mode, initialItem, onClose, onSave, busy, destinations = [], activities = [], mediaAssets = [] }) {
  const form = useEditor(initialItem, PACKAGE_DEFAULTS)
  const duration = form.values.duration || {}
  const groupSize = form.values.groupSize || {}

  function setDuration(name, value) { form.field('duration', { ...duration, [name]: value }) }
  function setGroupSize(name, value) { form.field('groupSize', { ...groupSize, [name]: value }) }

  async function submit(event) {
    event.preventDefault()
    const values = {
      ...form.values,
      title: form.values.title.trim(), slug: slugify(form.values.slug || form.values.title), category: form.values.category.trim(), region: form.values.region.trim(),
      shortDescription: form.values.shortDescription.trim(), overview: form.values.overview.trim(), price: Number(form.values.price),
      discountPrice: form.values.discountPrice === '' || form.values.discountPrice === null ? null : Number(form.values.discountPrice),
      duration: { days: Number(duration.days), nights: Number(duration.nights) }, groupSize: { min: Number(groupSize.min), max: Number(groupSize.max) },
      maxElevationMetres: Number(form.values.maxElevationMetres) || 0, bestSeason: cleanStrings(form.values.bestSeason), highlights: cleanStrings(form.values.highlights),
      itinerary: (form.values.itinerary || []).map((day, index) => ({ ...day, day: index + 1, title: day.title?.trim() || `Day ${index + 1}`, description: day.description?.trim() || '', elevationMetres: Number(day.elevationMetres) || 0, walkingHours: day.walkingHours?.trim() || '', accommodation: day.accommodation?.trim() || '', meals: day.meals?.trim() || '', media: cleanMediaItems(day.media || []) })),
      costIncludes: cleanStrings(form.values.costIncludes), costExcludes: cleanStrings(form.values.costExcludes), gearList: cleanStrings(form.values.gearList), permits: cleanStrings(form.values.permits), gallery: cleanMediaItems(form.values.gallery),
      faq: (form.values.faq || []).map((item) => ({ question: item.question?.trim(), answer: item.answer?.trim() })).filter((item) => item.question && item.answer),
      seo: { ...form.values.seo, keywords: cleanStrings(form.values.seo?.keywords) },
    }
    const errors = validateForm(values, {
      title: { required: true, label: 'Title' }, slug: { required: true, label: 'Slug' }, region: { required: true, label: 'Region' },
      shortDescription: { required: true, label: 'Short description' }, overview: { required: true, label: 'Overview' }, price: { required: true, label: 'Price' },
    })
    if (Number.isNaN(values.price) || values.price <= 0) errors.price = 'Price must be greater than zero.'
    if (values.discountPrice !== null && (Number.isNaN(values.discountPrice) || values.discountPrice <= 0 || values.discountPrice >= values.price)) errors.discountPrice = 'Discount price must be positive and lower than the regular price.'
    if (!values.duration.days || values.duration.days < 1) errors.duration = 'Duration needs at least one day.'
    if (values.groupSize.min < 1 || values.groupSize.max < values.groupSize.min) errors.groupSize = 'Set a valid minimum and maximum group size.'
    if (Object.keys(errors).length) return form.setErrors(errors)
    await onSave(values)
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={`${mode === 'edit' ? 'Edit' : 'Create'} package`} submitLabel={mode === 'edit' ? 'Save package' : 'Create package'} busy={busy} dirty={form.dirty} errors={form.errors} previewPath={`/packages/${slugify(form.values.slug || form.values.title)}`} previewEnabled={mode === 'edit' && form.values.status === 'published'} sections={[{ id: 'package-basics', label: 'Basics' }, { id: 'package-facts', label: 'Facts' }, { id: 'package-pricing', label: 'Pricing' }, { id: 'package-itinerary', label: 'Itinerary' }, { id: 'package-includes', label: 'Includes' }, { id: 'package-gear', label: 'Gear' }, { id: 'package-faq', label: 'FAQ' }, { id: 'package-gallery', label: 'Gallery' }, { id: 'package-seo', label: 'SEO' }, { id: 'package-visibility', label: 'Visibility' }]} size="xl">
      <AdminFormSection id="package-basics" title="Basics" description="The core trip information visitors use to decide whether to explore further.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Package name" required value={form.values.title} error={form.errors.title} onChange={(event) => form.field('title', event.target.value)} />
          <FormField label="Slug" required value={form.values.slug} error={form.errors.slug} onChange={(event) => form.field('slug', event.target.value)} />
          <FormField label="Trip type" as="select" options={PACKAGE_TYPES} value={form.values.type} onChange={(event) => form.field('type', event.target.value)} />
          <FormField label="Category" value={form.values.category} onChange={(event) => form.field('category', event.target.value)} />
          <FormField label="Region" required value={form.values.region} error={form.errors.region} onChange={(event) => form.field('region', event.target.value)} />
          <FormField label="Difficulty" as="select" options={DIFFICULTIES} value={form.values.difficulty} onChange={(event) => form.field('difficulty', event.target.value)} />
          <FormField className="sm:col-span-2" label="Short description" required as="textarea" rows={3} value={form.values.shortDescription} error={form.errors.shortDescription} onChange={(event) => form.field('shortDescription', event.target.value)} />
          <FormField className="sm:col-span-2" label="Overview" required as="textarea" rows={8} value={form.values.overview} error={form.errors.overview} onChange={(event) => form.field('overview', event.target.value)} />
          <RelationshipChecklist label="Destinations" options={destinations.map((item) => ({ id: item.id, label: item.title }))} value={form.values.destinationIds || []} onChange={(value) => form.field('destinationIds', value)} />
          <RelationshipChecklist label="Activities" options={activities.map((item) => ({ id: item.id, label: item.title }))} value={form.values.activityIds || []} onChange={(value) => form.field('activityIds', value)} />
          <StringListEditor label="Best season" value={form.values.bestSeason} onChange={(value) => form.field('bestSeason', value)} addLabel="Add month" />
          <StringListEditor label="Highlights" value={form.values.highlights} onChange={(value) => form.field('highlights', value)} addLabel="Add highlight" />
        </div>
      </AdminFormSection>
      <AdminFormSection id="package-facts" title="Trip facts">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="Duration days" type="number" min="1" value={numberOrEmpty(duration.days)} error={form.errors.duration} onChange={(event) => setDuration('days', event.target.value)} />
          <FormField label="Duration nights" type="number" min="0" value={numberOrEmpty(duration.nights)} onChange={(event) => setDuration('nights', event.target.value)} />
          <FormField label="Maximum elevation (m)" type="number" min="0" value={numberOrEmpty(form.values.maxElevationMetres)} onChange={(event) => form.field('maxElevationMetres', event.target.value)} />
          <FormField label="Walking per day" value={form.values.walkingPerDay || ''} onChange={(event) => form.field('walkingPerDay', event.target.value)} />
          <FormField label="Accommodation" value={form.values.accommodation || ''} onChange={(event) => form.field('accommodation', event.target.value)} />
          <FormField label="Meals" value={form.values.meals || ''} onChange={(event) => form.field('meals', event.target.value)} />
          <FormField label="Minimum group size" type="number" min="1" value={numberOrEmpty(groupSize.min)} error={form.errors.groupSize} onChange={(event) => setGroupSize('min', event.target.value)} />
          <FormField label="Maximum group size" type="number" min="1" value={numberOrEmpty(groupSize.max)} onChange={(event) => setGroupSize('max', event.target.value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection id="package-pricing" title="Pricing" description="Only the trip price and optional discounted price are managed here.">
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Regular price (USD)" required type="number" min="1" value={numberOrEmpty(form.values.price)} error={form.errors.price} onChange={(event) => form.field('price', event.target.value)} /><FormField label="Discount price (USD)" type="number" min="1" value={numberOrEmpty(form.values.discountPrice)} error={form.errors.discountPrice} onChange={(event) => form.field('discountPrice', event.target.value)} /></div>
      </AdminFormSection>
      <AdminFormSection id="package-itinerary" title="Itinerary builder"><ItineraryEditor value={form.values.itinerary} onChange={(value) => form.field('itinerary', value)} mediaAssets={mediaAssets} /></AdminFormSection>
      <AdminFormSection id="package-includes" title="What's included"><div className="grid gap-6 sm:grid-cols-2"><StringListEditor label="Included" value={form.values.costIncludes} onChange={(value) => form.field('costIncludes', value)} addLabel="Add included item" /><StringListEditor label="Excluded" value={form.values.costExcludes} onChange={(value) => form.field('costExcludes', value)} addLabel="Add excluded item" /></div></AdminFormSection>
      <AdminFormSection id="package-gear" title="Gear and permits"><div className="grid gap-6 sm:grid-cols-2"><StringListEditor label="Gear list" value={form.values.gearList} onChange={(value) => form.field('gearList', value)} addLabel="Add gear" /><StringListEditor label="Permit list" value={form.values.permits} onChange={(value) => form.field('permits', value)} addLabel="Add permit" /></div></AdminFormSection>
      <AdminFormSection id="package-faq" title="Questions"><FaqEditor value={form.values.faq} onChange={(value) => form.field('faq', value)} /></AdminFormSection>
      <AdminFormSection id="package-gallery" title="Gallery"><GalleryFields values={form.values} field={form.field} mediaAssets={mediaAssets} /></AdminFormSection>
      <AdminFormSection id="package-seo" title="Search metadata"><SeoFields values={form.values} field={form.field} /></AdminFormSection>
      <AdminFormSection id="package-visibility" title="Visibility"><StatusControl values={form.values} field={form.field} featured /></AdminFormSection>
    </ModalForm>
  )
}

const DEPARTURE_DEFAULTS = {
  packageId: '', title: '', startDate: '', endDate: '', durationDays: '', totalSeats: '', bookedSeats: 0, price: '', status: 'draft', guaranteed: false, assignedGuideIds: [], internalNotes: '',
}

export function DepartureForm({ open, mode, initialItem, onClose, onSave, busy, packages = [], guides = [] }) {
  const form = useEditor(initialItem, DEPARTURE_DEFAULTS)

  async function submit(event) {
    event.preventDefault()
    const values = {
      ...form.values, packageId: form.values.packageId, title: form.values.title.trim(), startDate: form.values.startDate, endDate: form.values.endDate,
      durationDays: Number(form.values.durationDays), totalSeats: Number(form.values.totalSeats), bookedSeats: Number(form.values.bookedSeats), price: Number(form.values.price), internalNotes: form.values.internalNotes.trim(),
    }
    const errors = validateForm(values, {
      packageId: { required: true, label: 'Package' }, title: { required: true, label: 'Departure title' }, startDate: { required: true, label: 'Start date' }, endDate: { required: true, label: 'End date' },
      durationDays: { required: true, label: 'Duration' }, totalSeats: { required: true, label: 'Total seats' }, price: { required: true, label: 'Price' },
    })
    if (!values.durationDays || values.durationDays < 1) errors.durationDays = 'Duration must be at least one day.'
    if (!values.totalSeats || values.totalSeats < 1) errors.totalSeats = 'Total seats must be at least one.'
    if (values.bookedSeats < 0 || values.bookedSeats > values.totalSeats) errors.bookedSeats = 'Booked seats cannot exceed total seats.'
    if (!values.price || values.price <= 0) errors.price = 'Price must be greater than zero.'
    if (values.startDate && !ISO_DATE.test(values.startDate)) errors.startDate = 'Use YYYY-MM-DD.'
    if (values.endDate && !ISO_DATE.test(values.endDate)) errors.endDate = 'Use YYYY-MM-DD.'
    if (values.startDate && values.endDate && values.endDate < values.startDate) errors.endDate = 'End date cannot be before the start date.'
    if (Object.keys(errors).length) return form.setErrors(errors)
    await onSave(values)
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={mode === 'edit' ? 'Edit fixed departure' : 'Create fixed departure'} submitLabel={mode === 'edit' ? 'Save departure' : 'Create departure'} busy={busy} dirty={form.dirty} errors={form.errors} size="wide">
      <AdminFormSection title="Schedule">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField className="sm:col-span-2" label="Package" required as="select" options={[{ value: '', label: 'Select a package' }, ...packages.map((item) => ({ value: item.id, label: item.title }))]} value={form.values.packageId} error={form.errors.packageId} onChange={(event) => form.field('packageId', event.target.value)} />
          <FormField className="sm:col-span-2" label="Departure title" required value={form.values.title} error={form.errors.title} onChange={(event) => form.field('title', event.target.value)} />
          <FormField label="Start date" required placeholder="YYYY-MM-DD" hint="Use YYYY-MM-DD." value={form.values.startDate} error={form.errors.startDate} onChange={(event) => form.field('startDate', event.target.value)} />
          <FormField label="End date" required placeholder="YYYY-MM-DD" hint="Use YYYY-MM-DD." value={form.values.endDate} error={form.errors.endDate} onChange={(event) => form.field('endDate', event.target.value)} />
          <FormField label="Duration days" required type="number" min="1" value={numberOrEmpty(form.values.durationDays)} error={form.errors.durationDays} onChange={(event) => form.field('durationDays', event.target.value)} />
          <FormField label="Departure price (USD)" required type="number" min="1" value={numberOrEmpty(form.values.price)} error={form.errors.price} onChange={(event) => form.field('price', event.target.value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection title="Capacity and status">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Total seats" required type="number" min="1" value={numberOrEmpty(form.values.totalSeats)} error={form.errors.totalSeats} onChange={(event) => form.field('totalSeats', event.target.value)} />
          <FormField label="Booked seats" type="number" min="0" value={numberOrEmpty(form.values.bookedSeats)} error={form.errors.bookedSeats} onChange={(event) => form.field('bookedSeats', event.target.value)} />
          <FormField label="Departure status" as="select" options={DEPARTURE_STATUSES} value={form.values.status} onChange={(event) => form.field('status', event.target.value)} />
          <label className="mt-7 flex items-center gap-3 text-small font-semibold text-stone-800"><input type="checkbox" checked={Boolean(form.values.guaranteed)} onChange={(event) => form.field('guaranteed', event.target.checked)} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />Guaranteed to run</label>
        </div>
      </AdminFormSection>
      <AdminFormSection title="Guides and notes"><div className="grid gap-6"><RelationshipChecklist label="Assigned guides" options={guides.map((item) => ({ id: item.id, label: item.fullName }))} value={form.values.assignedGuideIds || []} onChange={(value) => form.field('assignedGuideIds', value)} /><FormField label="Internal notes" as="textarea" rows={7} hint="Visible only in this admin demo." value={form.values.internalNotes} onChange={(event) => form.field('internalNotes', event.target.value)} /></div></AdminFormSection>
    </ModalForm>
  )
}

const GUIDE_DEFAULTS = {
  fullName: '', slug: '', photo: '', photoAlt: '', photoSourceName: '', photoFocalPosition: '50% 50%', bio: '', guideType: 'trekking', languages: [], regions: [], experienceYears: '', certifications: [], pricePerDay: '', verificationStatus: 'pending', rating: 0, totalReviews: 0, availabilityStatus: 'available', summitsOrTrips: '', publicProfile: true, status: 'published',
}

export function GuideForm({ open, mode, initialItem, onClose, onSave, busy }) {
  const form = useEditor(initialItem, GUIDE_DEFAULTS)

  async function submit(event) {
    event.preventDefault()
    const values = {
      ...form.values, fullName: form.values.fullName.trim(), slug: slugify(form.values.slug || form.values.fullName), photo: form.values.photo.trim(), photoAlt: form.values.photoAlt.trim(), photoSourceName: form.values.photoSourceName.trim(), bio: form.values.bio.trim(), guideType: form.values.guideType.trim(),
      languages: cleanStrings(form.values.languages), regions: cleanStrings(form.values.regions), certifications: cleanStrings(form.values.certifications), experienceYears: Number(form.values.experienceYears), pricePerDay: Number(form.values.pricePerDay), summitsOrTrips: form.values.summitsOrTrips.trim(),
    }
    const errors = validateForm(values, { fullName: { required: true, label: 'Full name' }, slug: { required: true, label: 'Slug' }, bio: { required: true, label: 'Biography' }, guideType: { required: true, label: 'Guide type' } })
    if (!values.experienceYears || values.experienceYears < 0) errors.experienceYears = 'Experience years must be zero or more.'
    if (!values.pricePerDay || values.pricePerDay <= 0) errors.pricePerDay = 'Day rate must be greater than zero.'
    if (Object.keys(errors).length) return form.setErrors(errors)
    await onSave(values)
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={`${mode === 'edit' ? 'Edit' : 'Create'} guide`} submitLabel={mode === 'edit' ? 'Save guide' : 'Create guide'} busy={busy} dirty={form.dirty} errors={form.errors} previewPath={`/guides/${slugify(form.values.slug || form.values.fullName)}`} previewEnabled={mode === 'edit' && form.values.status === 'published' && form.values.publicProfile} sections={[{ id: 'guide-profile', label: 'Profile' }, { id: 'guide-expertise', label: 'Expertise' }, { id: 'guide-visibility', label: 'Visibility' }, { id: 'guide-documents', label: 'V2 documents' }]} size="wide">
      <AdminFormSection id="guide-profile" title="Public profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full name" required value={form.values.fullName} error={form.errors.fullName} onChange={(event) => form.field('fullName', event.target.value)} />
          <FormField label="Slug" required value={form.values.slug} error={form.errors.slug} onChange={(event) => form.field('slug', event.target.value)} />
          <AdminImageField label="Guide photo URL" value={form.values.photo} onChange={(value) => form.field('photo', value)} alt={form.values.photoAlt} onAltChange={(value) => form.field('photoAlt', value)} focalPosition={form.values.photoFocalPosition} onFocalPositionChange={(value) => form.field('photoFocalPosition', value)} previewAlt={form.values.fullName || 'Guide photo preview'} ratio="portrait" className="sm:col-span-2" />
          <FormField className="sm:col-span-2" label="Owner-approved photo source" hint="Public guide portraits remain hidden until this identifies the approved source or owner record." optional value={form.values.photoSourceName} onChange={(event) => form.field('photoSourceName', event.target.value)} />
          <FormField label="Guide type" required value={form.values.guideType} error={form.errors.guideType} onChange={(event) => form.field('guideType', event.target.value)} />
          <FormField label="Availability" as="select" options={['available', 'on_trip', 'unavailable'].map((value) => ({ value, label: value.replace(/_/g, ' ') }))} value={form.values.availabilityStatus} onChange={(event) => form.field('availabilityStatus', event.target.value)} />
          <FormField label="Experience years" required type="number" min="0" value={numberOrEmpty(form.values.experienceYears)} error={form.errors.experienceYears} onChange={(event) => form.field('experienceYears', event.target.value)} />
          <FormField label="Day rate (USD)" required type="number" min="1" value={numberOrEmpty(form.values.pricePerDay)} error={form.errors.pricePerDay} onChange={(event) => form.field('pricePerDay', event.target.value)} />
          <FormField className="sm:col-span-2" label="Trips or summits" value={form.values.summitsOrTrips} onChange={(event) => form.field('summitsOrTrips', event.target.value)} />
          <FormField className="sm:col-span-2" label="Biography" required as="textarea" rows={8} value={form.values.bio} error={form.errors.bio} onChange={(event) => form.field('bio', event.target.value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection id="guide-expertise" title="Expertise"><div className="grid gap-6 sm:grid-cols-2"><StringListEditor label="Languages" value={form.values.languages} onChange={(value) => form.field('languages', value)} addLabel="Add language" /><StringListEditor label="Regions" value={form.values.regions} onChange={(value) => form.field('regions', value)} addLabel="Add region" /><StringListEditor label="Certifications" value={form.values.certifications} onChange={(value) => form.field('certifications', value)} addLabel="Add certification" /></div></AdminFormSection>
      <AdminFormSection id="guide-visibility" title="Verification and visibility">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-small font-semibold text-stone-800"><input type="checkbox" checked={form.values.verificationStatus === 'verified'} onChange={(event) => form.field('verificationStatus', event.target.checked ? 'verified' : 'pending')} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />Verified guide</label>
          <label className="flex items-center gap-3 text-small font-semibold text-stone-800"><input type="checkbox" checked={Boolean(form.values.publicProfile)} onChange={(event) => form.field('publicProfile', event.target.checked)} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />Show public profile</label>
          <FormField label="Account status" as="select" options={[{ value: 'published', label: 'Active' }, { value: 'suspended', label: 'Suspended' }]} value={form.values.status} onChange={(event) => form.field('status', event.target.value)} />
        </div>
      </AdminFormSection>
      <AdminFormSection id="guide-documents" title="Private documents (V2)" description="Document collection is intentionally unavailable in this frontend-only demo.">
        <div className="grid gap-4 sm:grid-cols-2"><FormField label="Government licence record" disabled value="Available in Version 2" onChange={() => {}} /><FormField label="Insurance document" disabled value="Available in Version 2" onChange={() => {}} /></div>
      </AdminFormSection>
    </ModalForm>
  )
}
