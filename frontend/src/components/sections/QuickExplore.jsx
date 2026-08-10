// Three-field shortcut into the filtered list pages, sitting under the hero.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useCollection from '../../hooks/useCollection.js'
import Button from '../common/Button.jsx'
import Container from '../common/Container.jsx'
import FormField from '../common/FormField.jsx'
import Reveal from '../motion/Reveal.jsx'
import { safeInternalPath } from '../../lib/urlSafety.js'

const TRIP_TYPES = [
  { value: '', label: 'Any kind of trip' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'expedition', label: 'Expedition' },
]

const DURATIONS = [
  { value: '', label: 'Any length' },
  { value: 'short', label: 'Up to 7 days' },
  { value: 'medium', label: '8 to 14 days' },
  { value: 'long', label: '15 days or more' },
]

export default function QuickExplore({ content }) {
  const navigate = useNavigate()
  const destinations = useCollection('destinations', { filters: { status: 'published' } })
  const [choice, setChoice] = useState({ destination: '', type: '', duration: '' })

  function update(field, value) {
    setChoice((current) => ({ ...current, [field]: value }))
  }

  // The list pages read these as query parameters when linked from this rail.
  function handleSubmit(event) {
    event.preventDefault()

    const base = choice.type === 'trekking' ? '/trekking' : choice.type === 'expedition' ? '/expeditions' : '/packages'
    const params = new URLSearchParams()
    if (choice.destination) params.set('destination', choice.destination)
    if (choice.type) params.set('type', choice.type)
    if (choice.duration) params.set('duration', choice.duration)

    const query = params.toString()
    navigate(query ? `${base}?${query}` : base)
  }

  return (
    <div className="bg-sand-100 py-10">
      <Container>
        <Reveal>
          <div className="rounded-xl bg-white p-6 shadow-lg ring-1 ring-stone-200 sm:p-8">
            {content?.heading && <h2 className="text-h4 font-display text-stone-900">{content.heading}</h2>}
            {content?.subtext && <p className="readable-text mt-2 text-small text-stone-600">{content.subtext}</p>}

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-4 lg:items-end">
              <FormField
                label="Where do you want to go?"
                as="select"
                value={choice.destination}
                onChange={(event) => update('destination', event.target.value)}
                options={[
                  { value: '', label: 'Anywhere in Nepal' },
                  ...destinations.items.map((item) => ({ value: item.slug, label: `${item.title} - ${item.region}` })),
                ]}
              />

              <FormField
                label="What kind of trip?"
                as="select"
                value={choice.type}
                onChange={(event) => update('type', event.target.value)}
                options={TRIP_TYPES}
              />

              <FormField
                label="How many days?"
                as="select"
                value={choice.duration}
                onChange={(event) => update('duration', event.target.value)}
                options={DURATIONS}
              />

              <Button type="submit" size="lg" fullWidth className="min-h-11">
                {content?.ctaLabel || 'Explore Matching Trips'}
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-small">
              {content?.browsePrompt && <span className="text-stone-600">{content.browsePrompt}</span>}
              <Link to={safeInternalPath(content?.browseLink, '/packages')} className="font-semibold text-primary-700 hover:text-primary-800">
                {content?.browseLabel || 'Browse All Trips'}
              </Link>
            </div>
          </div>
        </Reveal>
      </Container>
    </div>
  )
}
