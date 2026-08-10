// URL-backed image field with a safe preview; real file uploads remain a V2 feature.
import FormField from '../common/FormField.jsx'
import ImageFrame from '../common/ImageFrame.jsx'
import { isSafeImageUrl } from '../../lib/urlSafety.js'

const FOCAL_OPTIONS = [
  { value: '50% 50%', label: 'Centre' },
  { value: '50% 25%', label: 'Top centre' },
  { value: '50% 75%', label: 'Bottom centre' },
  { value: '25% 50%', label: 'Left centre' },
  { value: '75% 50%', label: 'Right centre' },
]

export default function AdminImageField({
  label = 'Image URL',
  value = '',
  onChange,
  alt = '',
  onAltChange,
  focalPosition = '50% 50%',
  onFocalPositionChange,
  previewAlt = 'Image preview',
  ratio = 'landscape',
  className = '',
}) {
  const urlError = !value || isSafeImageUrl(value) ? '' : 'Use a full https:// URL or a site-relative /images path.'

  return (
    <div className={`grid gap-4 lg:grid-cols-[minmax(0,1fr),12rem] ${className}`.trim()}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={label} value={value} error={urlError} hint="Use a hosted URL or a local image path. File uploads arrive with V2." onChange={(event) => onChange(event.target.value)} className="sm:col-span-2" />
        {onAltChange && <FormField label="Alternative text" value={alt} hint="Describe the image when it carries information." onChange={(event) => onAltChange(event.target.value)} />}
        {onFocalPositionChange && <FormField label="Focal position" as="select" options={FOCAL_OPTIONS} value={focalPosition || '50% 50%'} onChange={(event) => onFocalPositionChange(event.target.value)} />}
      </div>
      <div className="space-y-2">
        <ImageFrame src={value} alt={alt || previewAlt} ratio={ratio} focalPosition={focalPosition} radius="md" />
        {!value && <p role="status" className="text-small text-stone-600">No image URL yet. Public pages will use their missing-image state.</p>}
      </div>
    </div>
  )
}
