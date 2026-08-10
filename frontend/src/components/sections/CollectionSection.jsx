// The shape most homepage sections share: a picked list of records in a grid.
import useCollection, { orderByIds } from '../../hooks/useCollection.js'
import StaggerGroup from '../motion/StaggerGroup.jsx'
import SectionShell from './SectionShell.jsx'

const COLUMNS = {
  2: 'grid gap-6 sm:grid-cols-2',
  3: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4',
}

export default function CollectionSection({
  section,
  entity,
  card: Card,
  cardProps = {},
  filters,
  sort,
  direction,
  limit,
  columns = 3,
  tone = 'sand',
  mapItem,
}) {
  const { status, items, reload } = useCollection(entity, { filters, sort, direction })

  // The CMS picks both the records and their order; a filtered section falls
  // back to whatever the query returned.
  const chosen = orderByIds(items, section.itemIds).slice(0, limit || section.itemIds?.length || 6)

  // mapItem lets a section hand the card a projection rather than a raw record,
  // which is how guides drop their private fields before rendering.
  const picked = mapItem ? chosen.map(mapItem) : chosen

  return (
    <SectionShell
      section={section}
      tone={tone}
      status={status}
      isEmpty={picked.length === 0}
      onRetry={reload}
    >
      <StaggerGroup className={COLUMNS[columns]}>
        {picked.map((item) => (
          <Card key={item.id} item={item} {...cardProps} />
        ))}
      </StaggerGroup>
    </SectionShell>
  )
}
