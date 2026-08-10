// Centers page content at a consistent max width with responsive side gutters.
const WIDTHS = {
  narrow: 'max-w-3xl',
  default: 'max-w-screen-xl',
  wide: 'max-w-screen-2xl',
}

export default function Container({ width = 'default', className = '', children }) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${WIDTHS[width]} ${className}`}>
      {children}
    </div>
  )
}
