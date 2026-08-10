// The licences and memberships that back up everything else on the page.
import useCollection, { orderByIds } from '../../hooks/useCollection.js'
import useSingleton from '../../hooks/useSingleton.js'
import Badge from '../common/Badge.jsx'
import Card from '../common/Card.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import SectionShell from './SectionShell.jsx'

export default function CertificatesSection({ section }) {
  const { status, items, reload } = useCollection('certificates', {
    filters: { status: 'published' },
    sort: 'displayOrder',
    direction: 'asc',
  })

  const picked = orderByIds(items, section.itemIds).slice(0, 6)
  const settings = useSingleton('siteSettings')
  const demoMode = settings.data?.demoMode !== false

  return (
    <SectionShell
      section={section}
      tone="cream"
      status={status}
      isEmpty={picked.length === 0}
      onRetry={reload}
    >
      <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picked.map((item) => (
          <Card key={item.id} padding="lg" className="h-full">
            {demoMode && <Badge tone="info" size="sm">Sample certificate</Badge>}
            <h3 className="text-h4 font-display text-stone-900">{item.title}</h3>
            <p className="mt-1 text-small text-stone-600">{item.issuer}</p>
            <p className="mt-3 line-clamp-3 text-small text-stone-700">{item.description}</p>
            <p className="mt-4 font-mono text-small text-stone-500">{demoMode ? 'Demo reference: ' : ''}{item.registrationNumber}</p>
          </Card>
        ))}
      </StaggerGroup>
    </SectionShell>
  )
}
