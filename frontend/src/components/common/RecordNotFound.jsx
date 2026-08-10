// Shown when a slug in the address bar does not match anything we have.
import { Link } from 'react-router-dom'
import usePageMeta from '../../hooks/usePageMeta.js'
import PageHeader from './PageHeader.jsx'
import Section from './Section.jsx'

export default function RecordNotFound({ title, description, backLabel, backPath }) {
  usePageMeta(title, description)

  return (
    <>
      <PageHeader eyebrow="Not found" title={title} description={description} />
      <Section width="narrow">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-body font-semibold text-primary-700 hover:text-primary-800"
        >
          <span aria-hidden="true">←</span>
          {backLabel}
        </Link>
      </Section>
    </>
  )
}
