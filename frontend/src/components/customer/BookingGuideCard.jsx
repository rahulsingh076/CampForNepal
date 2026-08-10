// Small card for the guide assigned to a booking's departure. Public fields only.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../common/Badge.jsx'
import ImageFrame from '../common/ImageFrame.jsx'
import useSingleton from '../../hooks/useSingleton.js'
import { getItem } from '../../lib/dataClient.js'
import { toPublicGuide } from '../../lib/publicGuide.js'

export default function BookingGuideCard({ guideId }) {
  const [guide, setGuide] = useState(null)
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  useEffect(() => {
    if (!guideId) return
    let active = true
    getItem('guides', guideId).then((result) => {
      // The projection strips private fields (day rate, licence numbers).
      if (active && result.success) setGuide(toPublicGuide(result.data))
    })
    return () => {
      active = false
    }
  }, [guideId])

  if (!guide) return null

  return (
    <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-white p-4">
      <div className="w-16 shrink-0">
        <ImageFrame ratio="square" radius="lg" src={guide.photo} alt={guide.hasApprovedPortrait ? guide.fullName : ''} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-body font-semibold text-stone-900">{guide.fullName}</p>
          {guide.isVerified && (
            <Badge tone="success" size="sm">
              {demoMode ? 'Sample verification' : 'Verified guide'}
            </Badge>
          )}
        </div>
        <p className="mt-0.5 text-small text-stone-600">
          {guide.guideType} · {guide.experienceYears} years
        </p>
        <Link
          to={`/guides/${guide.slug}`}
          className="mt-1 inline-block text-small font-semibold text-primary-700 hover:text-primary-800"
        >
          View profile
        </Link>
      </div>
    </div>
  )
}
