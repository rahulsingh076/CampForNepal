import ImageFrame from '../common/ImageFrame.jsx'
import FormField from '../common/FormField.jsx'
import { mediaAssetToGalleryItem, mediaFocalPosition, mediaSrc, mediaType } from '../../lib/media.js'

const TYPE_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video link' },
  { value: 'reel', label: 'Reel link' },
]

const FOCAL_OPTIONS = [
  { value: '50% 50%', label: 'Centre' },
  { value: '50% 25%', label: 'Top centre' },
  { value: '50% 75%', label: 'Bottom centre' },
  { value: '25% 50%', label: 'Left centre' },
  { value: '75% 50%', label: 'Right centre' },
]

function editableItem(item) {
  if (typeof item === 'string') return { type: 'image', src: item, focalPosition: '50% 50%' }
  return {
    type: mediaType(item),
    sourceType: item?.sourceType || '',
    src: mediaSrc(item),
    alt: item?.alt || item?.altText || '',
    caption: item?.caption || '',
    focalPosition: mediaFocalPosition(item),
    photographer: item?.photographer || '',
    sourceName: item?.sourceName || '',
    sourceUrl: item?.sourceUrl || '',
    licenceName: item?.licenceName || item?.licenseName || '',
    licenceUrl: item?.licenceUrl || item?.licenseUrl || '',
    thumbnailSrc: item?.thumbnailSrc || item?.poster || item?.posterSrc || item?.thumbnailUrl || '',
    mediaId: item?.mediaId || item?.id || '',
  }
}

function safeAssetName(name = '') {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-|-$/g, '')
}

function typeFromFile(file) {
  if (file?.type?.startsWith('video/')) return 'video'
  if (file?.type?.startsWith('image/')) return 'image'
  return 'image'
}

function IconButton({ label, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:border-primary-600 hover:text-primary-800 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  )
}

export default function MediaListEditor({ label, value = [], onChange, hint, addLabel = 'Add media', libraryAssets = [] }) {
  const items = value.length ? value : []
  const selectableAssets = libraryAssets.filter((asset) => asset.status === 'published')
  const controlId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  function change(index, field, nextValue) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...editableItem(item), [field]: nextValue } : item)))
  }

  function remove(index) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index))
  }

  function move(index, direction) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= items.length) return
    const next = [...items]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    onChange(next)
  }

  function addFromLibrary(assetId) {
    const asset = selectableAssets.find((item) => item.id === assetId)
    const media = mediaAssetToGalleryItem(asset)
    if (media) onChange([...items, media])
  }

  function useLocalFile(index, file) {
    if (!file) return
    const filename = safeAssetName(file.name)
    if (!filename) return
    const type = typeFromFile(file)
    const path = `/media/library/${filename}`
    onChange(items.map((item, itemIndex) => (
      itemIndex === index
        ? { ...editableItem(item), type, sourceType: 'local_asset', src: path, thumbnailSrc: type === 'image' ? path : editableItem(item).thumbnailSrc }
        : item
    )))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-small font-semibold text-stone-800">{label}</p>
          {hint && <p className="mt-1 text-small text-stone-600">{hint}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {selectableAssets.length > 0 && (
            <label className="sr-only" htmlFor={`${controlId}-library-select`}>Add from media library</label>
          )}
          {selectableAssets.length > 0 && (
            <select
              id={`${controlId}-library-select`}
              defaultValue=""
              onChange={(event) => {
                addFromLibrary(event.target.value)
                event.target.value = ''
              }}
              className="min-h-9 rounded-md border border-stone-300 bg-white px-3 text-small text-stone-800"
            >
              <option value="">Add from library</option>
              {selectableAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title}</option>)}
            </select>
          )}
          <button
            type="button"
            onClick={() => onChange([...items, { type: 'image', src: '', focalPosition: '50% 50%' }])}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-small font-semibold text-primary-800 hover:border-primary-600 hover:bg-primary-50"
          >
            {addLabel}
          </button>
        </div>
      </div>

      <div className="mt-3 divide-y divide-stone-200 border-y border-stone-200">
        {items.map((item, index) => {
          const draft = editableItem(item)
          return (
            <div key={`${index}-${draft.src}`} className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr),10rem]">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={`Media ${index + 1} type`} as="select" options={TYPE_OPTIONS} value={draft.type} onChange={(event) => change(index, 'type', event.target.value)} />
                <FormField label="URL" value={draft.src} onChange={(event) => change(index, 'src', event.target.value)} />
                <div>
                  <label className="block text-small font-semibold text-stone-800" htmlFor={`${controlId}-${index}-file`}>Local build asset</label>
                  <input
                    id={`${controlId}-${index}-file`}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => useLocalFile(index, event.target.files?.[0])}
                    className="mt-2 block w-full text-small text-stone-700 file:mr-3 file:min-h-11 file:rounded-md file:border-0 file:bg-primary-700 file:px-3 file:text-small file:font-semibold file:text-white"
                  />
                  <p className="mt-2 text-small text-stone-600">Adds a /media/library reference. Place the file in frontend/public/media/library before production.</p>
                </div>
                {draft.type !== 'image' && <FormField label="Poster image URL" value={draft.thumbnailSrc} onChange={(event) => change(index, 'thumbnailSrc', event.target.value)} />}
                <FormField label="Alternative text" value={draft.alt} onChange={(event) => change(index, 'alt', event.target.value)} />
                <FormField label="Focal position" as="select" options={FOCAL_OPTIONS} value={draft.focalPosition || '50% 50%'} onChange={(event) => change(index, 'focalPosition', event.target.value)} />
                <FormField className="sm:col-span-2" label="Caption" value={draft.caption} onChange={(event) => change(index, 'caption', event.target.value)} />
                <FormField label="Photographer" value={draft.photographer} onChange={(event) => change(index, 'photographer', event.target.value)} />
                <FormField label="Source name" value={draft.sourceName} onChange={(event) => change(index, 'sourceName', event.target.value)} />
                <FormField label="Source URL" value={draft.sourceUrl} onChange={(event) => change(index, 'sourceUrl', event.target.value)} />
                <FormField label="Licence" value={draft.licenceName} onChange={(event) => change(index, 'licenceName', event.target.value)} />
                <FormField label="Licence URL" value={draft.licenceUrl} onChange={(event) => change(index, 'licenceUrl', event.target.value)} />
                <div className="flex items-end gap-2">
                  <IconButton label={`Move ${label} item up`} onClick={() => move(index, -1)} disabled={index === 0}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 14 6-6 6 6" /></svg>
                  </IconButton>
                  <IconButton label={`Move ${label} item down`} onClick={() => move(index, 1)} disabled={index === items.length - 1}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 10 6 6 6-6" /></svg>
                  </IconButton>
                  <IconButton label={`Remove ${label} item`} onClick={() => remove(index)}>
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </IconButton>
                </div>
              </div>
              <ImageFrame src={draft.type === 'image' ? draft.src : draft.thumbnailSrc} alt={draft.alt || draft.caption || 'Media preview'} focalPosition={draft.focalPosition} ratio="landscape" radius="md" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
