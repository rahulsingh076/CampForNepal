import FormField from '../common/FormField.jsx'
import AdminImageField from './AdminImageField.jsx'
import RelationshipChecklist from './RelationshipChecklist.jsx'

const TYPE_OPTIONS = [
  { value: 'blog', label: 'Blog' },
  { value: 'travel_update', label: 'Travel update' },
  { value: 'announcement', label: 'Announcement' },
]

// The fields stay the same in the composer and an inline card edit, so writing
// and editing never become two subtly different workflows.
export default function PostEditorFields({ values, onField, packages = [], errors = {}, seoOpen, setSeoOpen, compact = false }) {
  const seo = values.seo || {}
  const keywordText = (seo.keywords || []).join(', ')

  function updateSeo(field, value) {
    onField('seo', { ...seo, [field]: value })
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Title" required value={values.title} error={errors.title} onChange={(event) => onField('title', event.target.value)} />
        <FormField label="Category" as="select" options={TYPE_OPTIONS} value={values.contentType} onChange={(event) => onField('contentType', event.target.value)} />
      </div>

      <FormField label="Write the update" required as="textarea" rows={compact ? 7 : 9} value={values.content} error={errors.content} onChange={(event) => onField('content', event.target.value)} />

      <AdminImageField label="Cover image URL" value={values.featuredImage} onChange={(value) => onField('featuredImage', value)} alt={values.featuredImageAlt || ''} onAltChange={(value) => onField('featuredImageAlt', value)} focalPosition={values.featuredImageFocalPosition || '50% 50%'} onFocalPositionChange={(value) => onField('featuredImageFocalPosition', value)} previewAlt={values.title ? `Cover preview for ${values.title}` : 'Cover preview'} ratio="editorial" />

      <RelationshipChecklist
        label="Related packages"
        options={packages.map((item) => ({ id: item.id, label: item.title }))}
        value={values.relatedPackageIds || []}
        onChange={(relatedPackageIds) => onField('relatedPackageIds', relatedPackageIds)}
      />

      <div className="border-t border-stone-200 pt-4">
        <button
          type="button"
          aria-expanded={seoOpen}
          onClick={() => setSeoOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-small font-semibold text-primary-800 hover:bg-primary-50"
        >
          SEO
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={seoOpen ? 'm6 14 6-6 6 6' : 'm6 10 6 6 6-6'} /></svg>
        </button>
        {seoOpen && (
          <div className="mt-4 grid gap-4">
            <FormField label="Meta title" value={seo.metaTitle || ''} onChange={(event) => updateSeo('metaTitle', event.target.value)} />
            <FormField label="Meta description" as="textarea" rows={3} value={seo.metaDescription || ''} onChange={(event) => updateSeo('metaDescription', event.target.value)} />
            <FormField label="Keywords" value={keywordText} onChange={(event) => updateSeo('keywords', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} />
          </div>
        )}
      </div>
    </div>
  )
}
