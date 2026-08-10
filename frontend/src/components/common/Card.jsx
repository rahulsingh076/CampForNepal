// Surface container for content sitting on the sand background.
const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export default function Card({
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...rest
}) {
  // Interactive cards lift on hover; regular cards keep the resting shadow.
  const interactiveClasses = interactive
    ? 'transition-shadow duration-300 hover:shadow-lg'
    : ''

  return (
    <div
      className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-stone-200/70 ${PADDING[padding]} ${interactiveClasses} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
