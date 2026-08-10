// Title band at the top of a page, so every page announces itself the same way.
import Breadcrumbs from './Breadcrumbs.jsx'
import Container from './Container.jsx'

export default function PageHeader({ eyebrow, title, description, breadcrumbs, children }) {
  return (
    <div className="on-dark bg-primary-900 py-12 text-sand-200 sm:py-16">
      <Container>
        {breadcrumbs?.length > 0 && (
          <div className="mb-6">
            <Breadcrumbs trail={breadcrumbs} onDark />
          </div>
        )}

        {eyebrow && (
          <p className="text-small font-semibold uppercase tracking-widest text-amber-300">
            {eyebrow}
          </p>
        )}
        <h1 className={`font-display text-h1 text-white ${eyebrow ? 'mt-3' : ''}`}>{title}</h1>
        {description && (
          <p className="readable-text mt-4 text-body text-sand-200">{description}</p>
        )}
        {children && <div className="mt-6">{children}</div>}
      </Container>
    </div>
  )
}
