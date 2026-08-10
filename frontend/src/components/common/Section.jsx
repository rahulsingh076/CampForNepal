// A full-width page band: sets the background tone and the vertical rhythm.
import Container from './Container.jsx'

const TONES = {
  sand: 'bg-sand-50 text-stone-700',
  cream: 'bg-cream text-stone-700',
  white: 'bg-white text-stone-700',
  // on-dark flips heading colours, which otherwise stay stone-900 and vanish.
  primary: 'bg-primary-800 text-sand-50 on-dark',
}

const SPACING = {
  none: '',
  tight: 'py-12 sm:py-16',
  default: 'py-16 sm:py-24',
  loose: 'py-24 sm:py-32',
}

export default function Section({
  tone = 'sand',
  spacing = 'default',
  width = 'default',
  className = '',
  children,
  ...rest
}) {
  return (
    <section className={`${TONES[tone]} ${SPACING[spacing]} ${className}`} {...rest}>
      <Container width={width}>{children}</Container>
    </section>
  )
}
