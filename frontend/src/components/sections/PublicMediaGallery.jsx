import Container from '../common/Container.jsx'
import ImageFrame from '../common/ImageFrame.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import { mediaGallery } from '../../lib/media.js'

const WATCH_LABELS = {
  video: 'Open video',
  reel: 'Open reel',
}

function mediaCaption(media, fallbackCaption) {
  return media.caption || fallbackCaption || ''
}

function MediaCredit({ media }) {
  if (!media.credit) return null
  return <span className="block text-caption text-stone-500">{media.credit}</span>
}

function MediaTile({ media, caption, ratio }) {
  const body = (
    <ImageFrame
      src={media.imageSrc}
      ratio={ratio}
      alt={media.alt || caption}
      focalPosition={media.focalPosition}
      radius="lg"
    />
  )
  const actionLabel = WATCH_LABELS[media.type]

  return (
    <figure className="min-w-0">
      {actionLabel ? (
        <a href={media.src} target="_blank" rel="noopener noreferrer" className="group block">
          <div className="relative">
            {body}
            <span className="absolute left-3 top-3 rounded-full bg-stone-950/80 px-3 py-1 text-caption font-semibold uppercase tracking-widest text-white">
              {actionLabel}
            </span>
          </div>
        </a>
      ) : (
        body
      )}
      {(caption || media.credit) && (
        <figcaption className="mt-2 space-y-1 text-small text-stone-600">
          {caption && <span className="line-clamp-2">{caption}</span>}
          <MediaCredit media={media} />
        </figcaption>
      )}
    </figure>
  )
}

export default function PublicMediaGallery({
  item,
  fallbackCaptions = [],
  ratio = 'wide',
  className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4',
}) {
  const gallery = mediaGallery(item)
  if (!gallery.length) return null

  return (
    <div className="bg-sand-100 py-10">
      <Container>
        <StaggerGroup className={className}>
          {gallery.map((media, index) => (
            <MediaTile
              key={`${media.type}-${media.imageSrc || media.src}-${index}`}
              media={media}
              caption={mediaCaption(media, fallbackCaptions[index])}
              ratio={ratio}
            />
          ))}
        </StaggerGroup>
      </Container>
    </div>
  )
}
