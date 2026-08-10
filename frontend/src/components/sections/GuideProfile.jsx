// The upper half of a guide page: photo, verification, and who they are.
import Badge from '../common/Badge.jsx'
import Card from '../common/Card.jsx'
import DemoNotice from '../common/DemoNotice.jsx'
import ImageFrame from '../common/ImageFrame.jsx'
import Reveal from '../motion/Reveal.jsx'
import useSingleton from '../../hooks/useSingleton.js'

export default function GuideProfile({ guide, languageNames }) {
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <Reveal>
        <ImageFrame ratio="portrait" src={guide.photo} alt={guide.hasApprovedPortrait ? guide.photoAlt || guide.fullName : ''} focalPosition={guide.photoFocalPosition} />
        {!guide.hasApprovedPortrait && <p className="mt-3 text-small text-stone-600">Portrait owner-required. This sample profile does not use a stand-in person image.</p>}
      </Reveal>

      <Reveal delay={120} className="lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          {demoMode && <Badge tone="info">Sample guide profile</Badge>}
          {guide.isVerified && (
            <Badge tone="success">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {demoMode ? 'Sample verification' : 'Verified guide'}
            </Badge>
          )}
          <Badge tone="neutral">{guide.guideType}</Badge>
          {guide.rating > 0 && (
            <span className="text-small text-stone-700">
              <span aria-hidden="true" className="text-amber-600">
                ★
              </span>{' '}
              {demoMode ? 'Sample rating: ' : ''}{guide.rating} from {guide.totalReviews}{' '}
              {demoMode ? 'sample reviews' : 'reviews'}
            </span>
          )}
        </div>

        <div className="mt-6 space-y-4">
          {guide.bio.split('\n\n').map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="readable-text text-body text-stone-700">
              {paragraph}
            </p>
          ))}
        </div>

        <Card padding="lg" className="mt-8">
          <dl className="grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-small text-stone-600">Experience</dt>
              <dd className="mt-1 text-body font-semibold text-stone-900">
                {demoMode ? 'Sample experience: ' : ''}{guide.experienceYears} years
              </dd>
            </div>
            <div>
              <dt className="text-small text-stone-600">Speaks</dt>
              <dd className="mt-1 text-body font-semibold text-stone-900">
                {guide.languages.map((code) => languageNames[code] || code).join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-small text-stone-600">Works in</dt>
              <dd className="mt-1 text-body font-semibold text-stone-900">
                {guide.regions.join(', ')}
              </dd>
            </div>
            {guide.summitsOrTrips && (
              <div className="sm:col-span-3">
                <dt className="text-small text-stone-600">{demoMode ? 'Sample record' : 'On the record'}</dt>
                <dd className="mt-1 text-body font-semibold text-stone-900">
                  {guide.summitsOrTrips}
                </dd>
              </div>
            )}
          </dl>
        </Card>
        {demoMode && <DemoNotice context="evidence" className="mt-4" />}
      </Reveal>
    </div>
  )
}
