// Small rounded label used for tags, categories, and counts.
const TONES = {
  neutral: 'bg-stone-100 text-stone-800',
  brand: 'bg-primary-100 text-primary-800',
  cta: 'bg-amber-100 text-amber-900',
  info: 'bg-glacier-100 text-glacier-800',
  success: 'bg-success-100 text-success-800',
  danger: 'bg-danger-100 text-danger-800',
}

const SIZES = {
  sm: 'text-small px-2 py-0.5',
  md: 'text-small px-3 py-1',
}

export default function Badge({ tone = 'neutral', size = 'md', className = '', children, ...rest }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${TONES[tone]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </span>
  )
}
