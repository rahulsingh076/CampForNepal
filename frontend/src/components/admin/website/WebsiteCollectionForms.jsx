// Form dialogs for public certificates and practical travel-information pages.
import { useMemo, useState } from 'react'
import AdminImageField from '../AdminImageField.jsx'
import ModalForm from '../ModalForm.jsx'
import RelationshipChecklist from '../RelationshipChecklist.jsx'
import SimpleSectionEditor from '../SimpleSectionEditor.jsx'
import FormField from '../../common/FormField.jsx'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function CertificateForm({ open, mode, initialItem, onClose, onSave, busy }) {
  const initial = {
    title: '', issuer: '', description: '', image: '', imageAlt: '', imageFocalPosition: '50% 50%', registrationNumber: '', issuedDate: '', expiryDate: '', verificationNote: '', displayOrder: 0, status: 'draft',
    ...initialItem,
  }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [initial, values])

  function change(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: null }))
  }

  async function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.title.trim()) nextErrors.title = 'Title is required.'
    if (!values.issuer.trim()) nextErrors.issuer = 'Issuer is required.'
    if (!values.description.trim()) nextErrors.description = 'Description is required.'
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    await onSave({ ...values, title: values.title.trim(), issuer: values.issuer.trim(), description: values.description.trim(), imageAlt: values.imageAlt.trim(), displayOrder: Number(values.displayOrder) || 0 })
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={mode === 'edit' ? 'Edit certificate' : 'Add certificate'} submitLabel={mode === 'edit' ? 'Save certificate' : 'Create certificate'} busy={busy} dirty={dirty} errors={errors} previewPath="/certificates" previewEnabled={mode === 'edit' && values.status === 'published'} size="wide">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Title" required value={values.title} error={errors.title} onChange={(event) => change('title', event.target.value)} />
        <FormField label="Issuer" required value={values.issuer} error={errors.issuer} onChange={(event) => change('issuer', event.target.value)} />
        <FormField label="Status" as="select" options={STATUS_OPTIONS} value={values.status} onChange={(event) => change('status', event.target.value)} />
        <FormField label="Display order" type="number" value={values.displayOrder} onChange={(event) => change('displayOrder', event.target.value)} />
        <AdminImageField label="Credential image URL" value={values.image} onChange={(value) => change('image', value)} alt={values.imageAlt} onAltChange={(value) => change('imageAlt', value)} focalPosition={values.imageFocalPosition} onFocalPositionChange={(value) => change('imageFocalPosition', value)} previewAlt={values.title || 'Credential preview'} className="sm:col-span-2" />
        <FormField label="Description" required as="textarea" rows={5} value={values.description} error={errors.description} onChange={(event) => change('description', event.target.value)} className="sm:col-span-2" />
        <FormField label="Registration number" value={values.registrationNumber} onChange={(event) => change('registrationNumber', event.target.value)} />
        <FormField label="Issued date" type="date" value={values.issuedDate} onChange={(event) => change('issuedDate', event.target.value)} />
        <FormField label="Expiry date" type="date" value={values.expiryDate || ''} onChange={(event) => change('expiryDate', event.target.value || null)} />
        <FormField label="Verification note" as="textarea" rows={3} value={values.verificationNote} onChange={(event) => change('verificationNote', event.target.value)} className="sm:col-span-2" />
      </div>
    </ModalForm>
  )
}

function TravelInfoForm({ open, mode, initialItem, onClose, onSave, busy, packages = [] }) {
  const initial = {
    title: '', slug: '', category: 'before-you-go', summary: '', content: '', sections: [], relatedPackageIds: [], seo: { metaTitle: '', metaDescription: '', keywords: [] }, status: 'draft', updatedAt: '',
    ...initialItem,
  }
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const dirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initial), [initial, values])
  const seo = values.seo || {}

  function change(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: null }))
  }

  async function submit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!values.title.trim()) nextErrors.title = 'Title is required.'
    if (!values.summary.trim()) nextErrors.summary = 'Summary is required.'
    if (!values.content.trim()) nextErrors.content = 'Content is required.'
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    await onSave({ ...values, title: values.title.trim(), slug: values.slug.trim() || slugify(values.title), summary: values.summary.trim(), content: values.content.trim(), updatedAt: new Date().toISOString(), seo: { ...seo, keywords: seo.keywords || [] } })
  }

  return (
    <ModalForm open={open} onClose={onClose} onSubmit={submit} title={mode === 'edit' ? 'Edit travel information' : 'Add travel information'} submitLabel={mode === 'edit' ? 'Save page' : 'Create page'} busy={busy} dirty={dirty} errors={errors} previewPath={`/travel-info/${slugify(values.slug || values.title)}`} previewEnabled={mode === 'edit' && values.status === 'published'} size="xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Title" required value={values.title} error={errors.title} onChange={(event) => change('title', event.target.value)} />
        <FormField label="Slug" value={values.slug} onChange={(event) => change('slug', event.target.value)} />
        <FormField label="Category" value={values.category} onChange={(event) => change('category', event.target.value)} />
        <FormField label="Status" as="select" options={STATUS_OPTIONS} value={values.status} onChange={(event) => change('status', event.target.value)} />
        <FormField label="Summary" required as="textarea" rows={4} value={values.summary} error={errors.summary} onChange={(event) => change('summary', event.target.value)} className="sm:col-span-2" />
        <FormField label="Main content" required as="textarea" rows={10} value={values.content} error={errors.content} onChange={(event) => change('content', event.target.value)} className="sm:col-span-2" />
        <div className="sm:col-span-2"><SimpleSectionEditor label="Detailed sections" value={values.sections || []} onChange={(sections) => change('sections', sections)} /></div>
        <div className="sm:col-span-2"><RelationshipChecklist label="Related packages" options={packages.map((item) => ({ id: item.id, label: item.title }))} value={values.relatedPackageIds || []} onChange={(relatedPackageIds) => change('relatedPackageIds', relatedPackageIds)} /></div>
        <FormField label="SEO title" value={seo.metaTitle || ''} onChange={(event) => change('seo', { ...seo, metaTitle: event.target.value })} />
        <FormField label="SEO keywords" value={(seo.keywords || []).join(', ')} onChange={(event) => change('seo', { ...seo, keywords: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
        <FormField label="SEO description" as="textarea" rows={3} value={seo.metaDescription || ''} onChange={(event) => change('seo', { ...seo, metaDescription: event.target.value })} className="sm:col-span-2" />
      </div>
    </ModalForm>
  )
}

export { CertificateForm, TravelInfoForm }
