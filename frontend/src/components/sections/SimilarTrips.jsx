// Other trips of the same kind, so a visitor who is not sold has somewhere to go.
import useCollection from '../../hooks/useCollection.js'
import PackageCard from '../cards/PackageCard.jsx'
import Section from '../common/Section.jsx'
import SectionHeader from '../common/SectionHeader.jsx'
import Reveal from '../motion/Reveal.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'

export default function SimilarTrips({ item }) {
  const { status, items } = useCollection('packages', { filters: { type: item.type } })

  // Prefer trips sharing a destination, then fill up with others of the same type.
  const others = items.filter((row) => row.id !== item.id && row.status === 'published')
  const sameArea = others.filter((row) =>
    row.destinationIds.some((id) => item.destinationIds.includes(id))
  )
  const similar = [...sameArea, ...others.filter((row) => !sameArea.includes(row))].slice(0, 3)

  if (status !== 'ready' || similar.length === 0) return null

  return (
    <Section tone="cream">
      <Reveal>
        <SectionHeader
          title="Similar trips"
          description={`Other ${item.type} itineraries you might weigh up against this one.`}
        />
      </Reveal>

      <div className="mt-10">
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {similar.map((row) => (
            <PackageCard key={row.id} item={row} />
          ))}
        </StaggerGroup>
      </div>
    </Section>
  )
}
