// Preview scaffolding: cards, image frames, badges, and trust markers.
import Badge from '../../components/common/Badge.jsx'
import Card from '../../components/common/Card.jsx'
import ImageFrame from '../../components/common/ImageFrame.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import TrustBadge from '../../components/common/TrustBadge.jsx'

const BADGE_TONES = ['neutral', 'brand', 'cta', 'info', 'success', 'danger']
const STATUSES = ['draft', 'pending', 'confirmed', 'completed', 'cancelled']
const RATIOS = ['hero', 'wide', 'editorial', 'landscape', 'document', 'square', 'portrait']

export default function SurfacesPreview() {
  return (
    <div className="space-y-8">
      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Badges</h3>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {BADGE_TONES.map((tone) => (
            <Badge key={tone} tone={tone}>
              {tone}
            </Badge>
          ))}
        </div>

        <h3 className="mt-10 text-h4 font-display text-stone-900">Status badges</h3>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {STATUSES.map((status) => (
            <StatusBadge key={status} status={status} label={status.replace('_', ' ')} />
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Image frames</h3>
        <p className="mt-2 text-small text-stone-600">
          Fixed ratios keep cards aligned. No photography is loaded yet, so each frame
          shows its placeholder.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {RATIOS.map((ratio) => (
            <div key={ratio}>
              <ImageFrame ratio={ratio} alt={`${ratio} ratio placeholder`} />
              <p className="mt-2 text-small font-mono text-stone-500">{ratio}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padding="lg">
          <h3 className="text-h4 font-display text-stone-900">Trust markers</h3>
          <div className="mt-6 space-y-5">
            <TrustBadge
              icon="shield"
              label="Verified operator"
              description="Licence and insurance checked before listing."
            />
            <TrustBadge
              icon="check"
              label="Free cancellation"
              description="Change your plans up to the cut-off date."
            />
            <TrustBadge icon="support" label="Talk to a human before you book" />
          </div>
        </Card>

        <Card padding="none">
          <ImageFrame ratio="wide" radius="none" alt="Card media placeholder" />
          <div className="p-6">
            <Badge tone="brand">Sample tag</Badge>
            <h3 className="mt-3 text-h4 font-display text-stone-900">A card with media</h3>
            <p className="mt-2 text-body text-stone-600">
              This is the shape most listings will take: framed image, tag, title, and
              a short supporting line.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
