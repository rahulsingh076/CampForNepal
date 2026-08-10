// The trust band: licences and memberships, shown compactly.
import { Link } from 'react-router-dom'
import useCollection from '../../hooks/useCollection.js'
import Card from '../common/Card.jsx'
import Section from '../common/Section.jsx'
import SectionHeader from '../common/SectionHeader.jsx'
import Reveal from '../motion/Reveal.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'

export default function CertificatesBand() {
  const { status, items } = useCollection('certificates', {
    filters: { status: 'published' },
    sort: 'displayOrder',
    direction: 'asc',
  })

  if (status !== 'ready' || items.length === 0) return null

  return (
    <Section tone="primary">
      <Reveal>
        <SectionHeader
          title="Sample credential records"
          description="These illustrative records show the certificate layout. They are not real-world evidence of licences, insurance, or registration."
          onDark
        />
      </Reveal>

      <div className="mt-10">
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <Card key={item.id} padding="md" className="h-full">
              <h3 className="text-body font-semibold text-stone-900">{item.title}</h3>
              <p className="mt-1 text-small text-stone-600">{item.issuer}</p>
              <p className="mt-2 font-mono text-small text-stone-500">{item.registrationNumber}</p>
            </Card>
          ))}
        </StaggerGroup>
      </div>

      <Reveal className="mt-10">
        <Link
          to="/certificates"
          className="inline-flex items-center gap-2 text-body font-semibold text-amber-300 hover:text-amber-200"
        >
          See sample certificate records
          <span aria-hidden="true">→</span>
        </Link>
      </Reveal>
    </Section>
  )
}
