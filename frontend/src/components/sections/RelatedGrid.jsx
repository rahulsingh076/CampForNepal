// A band of related records picked by id, used across the detail pages.
import useCollection, { orderByIds } from '../../hooks/useCollection.js'
import LoadingState from '../common/LoadingState.jsx'
import Section from '../common/Section.jsx'
import SectionHeader from '../common/SectionHeader.jsx'
import Reveal from '../motion/Reveal.jsx'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import { isPubliclyListed } from '../../lib/publicGuide.js'

const COLUMNS = {
  2: 'grid gap-6 sm:grid-cols-2',
  3: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
}

export default function RelatedGrid({
  heading,
  description,
  entity,
  ids = [],
  card: Card,
  cardProps = {},
  columns = 3,
  tone = 'sand',
  mapItem,
}) {
  const { status, items } = useCollection(entity, {})

  // Nothing to relate to is not an error, and an empty band is just noise.
  if (!ids.length) return null

  const chosen = orderByIds(items, ids).filter((item) => {
    if (['packages', 'destinations', 'activities'].includes(entity)) return item.status === 'published'
    if (entity === 'guides') return isPubliclyListed(item)
    return true
  })
  // mapItem lets a caller project records before they reach the card.
  const picked = (mapItem ? chosen.map(mapItem) : chosen).filter(Boolean)
  if (status === 'ready' && picked.length === 0) return null

  return (
    <Section tone={tone}>
      <Reveal>
        <SectionHeader title={heading} description={description} />
      </Reveal>

      <div className="mt-10">
        {status === 'loading' ? (
          <LoadingState rows={3} label={`Loading ${heading}`} />
        ) : (
          <StaggerGroup className={COLUMNS[columns]}>
            {picked.map((item) => (
              <Card key={item.id} item={item} {...cardProps} />
            ))}
          </StaggerGroup>
        )}
      </div>
    </Section>
  )
}
