import { useMemo, useState } from 'react'
import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import AdminFormSection from '../../components/admin/AdminFormSection.jsx'
import ModalForm from '../../components/admin/ModalForm.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import FormField from '../../components/common/FormField.jsx'
import ImageFrame from '../../components/common/ImageFrame.jsx'
import { validateForm } from '../../lib/validators.js'

const TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'reel', label: 'Reel' },
]

const SOURCE_OPTIONS = [
  { value: 'local_asset', label: 'Local build asset' },
  { value: 'external_url', label: 'External URL' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo', label: 'Vimeo' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
]

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
]

const DEFAULTS = {
  title: '',
  slug: '',
  type: 'image',
  sourceType: 'local_asset',
  sourceUrl: '',
  thumbnailUrl: '',
  alt: '',
  caption: '',
  focalPosition: '50% 50%',
  tags: [],
  sourceName: '',
  sourceReference: '',
  photographerOrCreator: '',
  licence: '',
  attributionRequired: false,
  status: 'draft',
  usageLocations: [],
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function safeAssetName(name = '') {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '')
}

function typeFromFile(file) {
  if (file?.type?.startsWith('video/')) return 'video'
  if (file?.type?.startsWith('image/')) return 'image'
  return 'image'
}

function textList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function MediaAssetForm({ open, mode, initialItem, onClose, onSave, busy }) {
  const initial = useMemo(() => ({ ...DEFAULTS, ...(initialItem || {}) }), [initialItem])
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)

  function field(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: null }))
  }

  function localFile(file) {
    if (!file) return
    const filename = safeAssetName(file.name)
    if (!filename) return
    const type = typeFromFile(file)
    field('type', type)
    field('sourceType', 'local_asset')
    field('sourceUrl', `/media/library/${filename}`)
    if (type === 'image') field('thumbnailUrl', `/media/library/${filename}`)
  }

  async function submit(event) {
    event.preventDefault()
    const next = {
      ...values,
      title: values.title.trim(),
      slug: slugify(values.slug || values.title),
      sourceUrl: values.sourceUrl.trim(),
      thumbnailUrl: values.thumbnailUrl.trim(),
      alt: values.alt.trim(),
      caption: values.caption.trim(),
      focalPosition: values.focalPosition.trim() || '50% 50%',
      tags: Array.isArray(values.tags) ? values.tags : textList(values.tags),
      sourceName: values.sourceName.trim(),
      sourceReference: values.sourceReference.trim(),
      photographerOrCreator: values.photographerOrCreator.trim(),
      licence: values.licence.trim(),
      usageLocations: values.usageLocations || [],
    }
    const validation = validateForm(next, {
      title: { required: true, label: 'Title' },
      sourceUrl: { required: true, label: 'Source URL' },
    })
    if (Object.keys(validation).length) return setErrors(validation)
    await onSave(next)
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={`${mode === 'edit' ? 'Edit' : 'Create'} media asset`} submitLabel={mode === 'edit' ? 'Save media' : 'Create media'} busy={busy} dirty={dirty} errors={errors} size="wide">
      <AdminFormSection title="Media source" description="Local build assets must exist in frontend/public/media/library or another shipped public folder before production. No binary file is stored in the data record.">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" required value={values.title} error={errors.title} onChange={(event) => field('title', event.target.value)} />
          <FormField label="Slug" value={values.slug} onChange={(event) => field('slug', event.target.value)} />
          <FormField label="Type" as="select" options={TYPE_OPTIONS} value={values.type} onChange={(event) => field('type', event.target.value)} />
          <FormField label="Source type" as="select" options={SOURCE_OPTIONS} value={values.sourceType} onChange={(event) => field('sourceType', event.target.value)} />
          <FormField className="sm:col-span-2" label="Source URL or local path" required value={values.sourceUrl} error={errors.sourceUrl} onChange={(event) => field('sourceUrl', event.target.value)} />
          <div className="sm:col-span-2">
            <label className="block text-small font-semibold text-stone-800" htmlFor="media-local-file">Choose local file reference</label>
            <input id="media-local-file" type="file" accept="image/*,video/*" onChange={(event) => localFile(event.target.files?.[0])} className="mt-2 block w-full text-small text-stone-700 file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-primary-700 file:px-3 file:text-small file:font-semibold file:text-white" />
            <p className="mt-2 text-small text-stone-600">This fills a /media/library path. It does not copy the file; add that file to frontend/public/media/library for production.</p>
          </div>
          <FormField className="sm:col-span-2" label="Thumbnail/poster URL" value={values.thumbnailUrl} onChange={(event) => field('thumbnailUrl', event.target.value)} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Metadata">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Alt text" value={values.alt} onChange={(event) => field('alt', event.target.value)} />
          <FormField label="Focal position" value={values.focalPosition} onChange={(event) => field('focalPosition', event.target.value)} />
          <FormField className="sm:col-span-2" label="Caption" as="textarea" rows={3} value={values.caption} onChange={(event) => field('caption', event.target.value)} />
          <FormField label="Tags" hint="Comma separated." value={Array.isArray(values.tags) ? values.tags.join(', ') : values.tags} onChange={(event) => field('tags', event.target.value)} />
          <FormField label="Source name" value={values.sourceName} onChange={(event) => field('sourceName', event.target.value)} />
          <FormField label="Source reference" value={values.sourceReference} onChange={(event) => field('sourceReference', event.target.value)} />
          <FormField label="Photographer/creator" value={values.photographerOrCreator} onChange={(event) => field('photographerOrCreator', event.target.value)} />
          <FormField label="Licence" value={values.licence} onChange={(event) => field('licence', event.target.value)} />
          <label className="mt-7 flex items-center gap-3 text-small font-semibold text-stone-800">
            <input type="checkbox" checked={Boolean(values.attributionRequired)} onChange={(event) => field('attributionRequired', event.target.checked)} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />
            Attribution required
          </label>
          <FormField label="Status" as="select" options={STATUS_OPTIONS} value={values.status} onChange={(event) => field('status', event.target.value)} />
        </div>
      </AdminFormSection>

      <AdminFormSection title="Preview">
        <ImageFrame src={values.type === 'image' ? values.sourceUrl : values.thumbnailUrl} alt={values.alt || values.title || 'Media preview'} ratio="wide" />
      </AdminFormSection>
    </ModalForm>
  )
}

export default function MediaLibrary() {
  const columns = [
    { key: 'title', label: 'Media', sortable: true, searchValue: (row) => [row.title, row.tags, row.sourceName, row.sourceReference, row.licence], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.tags?.join(', ') || 'No tags'}</p></div> },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'sourceType', label: 'Source', sortable: true, render: (row) => row.sourceType?.replace(/_/g, ' ') },
    { key: 'usageLocations', label: 'Usage', render: (row) => `${row.usageLocations?.length || 0} use${row.usageLocations?.length === 1 ? '' : 's'}` },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  ]

  return (
    <AdminCrudPage
      entity="mediaAssets"
      title="Media library"
      description="Browse, create, edit, archive, and reuse image/video/reel records. Videos and reels are references only; no social login or binary upload is added."
      columns={columns}
      Form={MediaAssetForm}
      createLabel="Add media"
      emptyState={{ title: 'No media yet', description: 'Add an approved local asset reference or safe external media record.' }}
    />
  )
}

