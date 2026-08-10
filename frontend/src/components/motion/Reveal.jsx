// Fades a block in with a small upward drift the first time it scrolls into view.
import useReveal from '../../hooks/useReveal.js'

export default function Reveal({
  as: Tag = 'div',
  distance = 'md',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const { ref, isVisible } = useReveal()

  return (
    // rest comes first so a caller cannot accidentally drop the delay or the
    // visibility attributes by passing its own style.
    <Tag
      {...rest}
      ref={ref}
      className={`reveal ${className}`}
      data-distance={distance}
      data-visible={isVisible}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
