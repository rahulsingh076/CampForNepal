// Reveals its children one after another instead of all at once.
import { Children } from 'react'
import Reveal from './Reveal.jsx'

// Capped so a long grid never leaves its last card waiting seconds to appear.
const MAX_STEPS = 4

export default function StaggerGroup({
  step = 90,
  distance = 'md',
  className = '',
  children,
}) {
  // toArray drops null and false, so a conditionally-rendered child does not
  // leave an empty animated wrapper behind and does not shift the delays.
  const items = Children.toArray(children)

  return (
    <div className={className}>
      {items.map((child, index) => (
        // h-full so a card still stretches when this sits inside a grid.
        <Reveal
          key={child.key || index}
          distance={distance}
          delay={Math.min(index, MAX_STEPS) * step}
          className="h-full"
        >
          {child}
        </Reveal>
      ))}
    </div>
  )
}
