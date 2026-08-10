// Standard heading block for a section: small eyebrow, title, and supporting text.
const ALIGN = {
  left: 'text-left',
  center: 'text-center mx-auto',
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  onDark = false,
  headingLevel = 'h2',
}) {
  const Heading = headingLevel
  const titleColor = onDark ? 'text-white' : 'text-stone-900'
  const eyebrowColor = onDark ? 'text-amber-300' : 'text-amber-700'
  const descColor = onDark ? 'text-sand-200' : 'text-stone-600'

  return (
    <div className={`max-w-2xl ${ALIGN[align]}`}>
      {eyebrow && (
        <p className={`text-small font-semibold uppercase tracking-widest ${eyebrowColor}`}>
          {eyebrow}
        </p>
      )}
      <Heading className={`text-h2 font-display ${titleColor} ${eyebrow ? 'mt-3' : ''}`}>
        {title}
      </Heading>
      {description && <p className={`mt-4 text-body ${descColor}`}>{description}</p>}
    </div>
  )
}
