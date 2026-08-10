// Trust bullets: licences, experience, support, and safety.
import Card from '../common/Card.jsx'
import TrustBadge from '../common/TrustBadge.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import SectionShell from './SectionShell.jsx'

export default function WhyChooseUs({ section }) {
  const reasons = section.reassuranceItems || []

  return (
    <SectionShell section={section} tone="cream" isEmpty={reasons.length === 0} emptyTitle="Reassurance details are being prepared">
      <StaggerGroup className="grid gap-6 sm:grid-cols-3">
        {reasons.map((reason) => (
          <Card key={reason.label} padding="lg" className="h-full">
            <TrustBadge
              icon={reason.icon}
              label={reason.label}
              description={reason.description}
            />
          </Card>
        ))}
      </StaggerGroup>
    </SectionShell>
  )
}
