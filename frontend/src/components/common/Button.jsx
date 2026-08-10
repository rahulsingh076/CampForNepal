// Action button in three brand variants; renders a link when href is given.
import { Link } from 'react-router-dom'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold ' +
  'transition-colors duration-200'

// A disabled control still has to be readable, so it gets real colours, not opacity.
const DISABLED = 'cursor-not-allowed bg-stone-200 text-stone-600 border border-stone-200'

const VARIANTS = {
  // Amber is the booking CTA colour, so it carries the main action.
  primary: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800',
  secondary:
    'bg-white text-primary-800 border border-stone-200 hover:bg-sand-50 hover:border-stone-300',
  ghost: 'bg-transparent text-primary-700 hover:bg-primary-50',
}

const SIZES = {
  sm: 'text-small px-4 py-2',
  md: 'text-body px-6 py-3',
  lg: 'text-body px-8 py-4',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...rest
}) {
  // An unknown variant or size falls back rather than emitting "undefined".
  const variantClasses = disabled ? DISABLED : VARIANTS[variant] || VARIANTS.primary
  const sizeClasses = SIZES[size] || SIZES.md

  const classes = `${BASE} ${variantClasses} ${sizeClasses} ${
    fullWidth ? 'w-full' : ''
  } ${className}`

  // A disabled link is still clickable, so a disabled button always wins over href.
  if (href && !disabled) {
    // An in-app path must route, not reload the whole application. A hash jump
    // or an external address stays a plain anchor.
    if (href.startsWith('/')) {
      return (
        <Link to={href} className={classes} {...rest}>
          {children}
        </Link>
      )
    }

    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} disabled={disabled} className={classes} {...rest}>
      {children}
    </button>
  )
}
