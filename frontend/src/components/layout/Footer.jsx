// Site footer: link columns, social links, and the legal line, all from the CMS.
import { Link } from 'react-router-dom'
import { SITE_NAME } from '../../config/siteIdentity.js'
import CallbackButton from '../forms/CallbackButton.jsx'
import BrandLogo from './BrandLogo.jsx'
import { isSafeExternalUrl, isSafeInternalPath } from '../../lib/urlSafety.js'

export default function Footer({ footer, contact, companyName = SITE_NAME }) {
  if (!footer) return null

  const phone = contact?.phone || footer.contactBlock?.phone
  const email = contact?.emailEnabled === false ? '' : contact?.publicEmail || contact?.email || footer.contactBlock?.email
  const whatsappDigits = contact?.whatsappEnabled === false ? '' : contact?.whatsapp?.replace(/[^\d]/g, '')
  const columns = (footer.columns || []).map((column) => ({ ...column, links: (column.links || []).filter((link) => isSafeInternalPath(link.path)) }))
  const legalLinks = (footer.legalLinks || []).filter((link) => isSafeInternalPath(link.path))
  const socialLinks = (footer.socialLinks || []).filter((social) => isSafeExternalUrl(social.url))

  return (
    <footer className="on-dark bg-primary-900 py-16 text-sand-200">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex rounded-md bg-white px-2 py-1" aria-label={`${companyName} home`}>
          <BrandLogo className="h-16" alt={companyName} />
        </Link>
        <div className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <div key={column.heading}>
              <h2 className="text-small font-semibold uppercase tracking-widest text-amber-300">
                {column.heading}
              </h2>
              {/* Links carry their own 44px tap height, so the list no longer
                  needs extra vertical rhythm between rows. */}
              <ul className="mt-2">
                {column.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="inline-flex min-h-11 items-center text-small text-sand-200 transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {footer.contactBlock && (
          <div className="mt-12 border-t border-primary-700 pt-8">
            <h2 className="font-display text-h4 text-white">{footer.contactBlock.heading}</h2>
            {footer.contactBlock.body && <p className="readable-text mt-2 text-small text-sand-300">{footer.contactBlock.body}</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-small">
              {phone && <a href={`tel:${phone.replace(/\s/g, '')}`} className="inline-flex min-h-11 items-center font-semibold text-amber-300 hover:text-amber-200">{phone}</a>}
              {email && <Link to="/contact" className="inline-flex min-h-11 items-center font-semibold text-amber-300 hover:text-amber-200">{email}</Link>}
              {whatsappDigits && <a href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-11 items-center font-semibold text-amber-300 hover:text-amber-200">WhatsApp</a>}
            </div>
          </div>
        )}

        {footer.trustStatement && (
          <p className="mt-8 max-w-3xl text-small text-sand-300">{footer.trustStatement}</p>
        )}

        <div className="mt-12 border-t border-primary-700 pt-8">
          <h2 className="font-display text-h4 text-white">{footer.newsletterHeading}</h2>
          <p className="readable-text mt-2 text-small text-sand-300">{footer.newsletterSubtext}</p>
          <div className="mt-4">
            <CallbackButton className="rounded-lg border border-sand-200/40 px-4 py-2 text-small font-semibold text-white transition-colors duration-200 hover:bg-white/10" />
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-primary-700 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-sand-300">{footer.copyrightLine || companyName}</p>

          <ul className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className="inline-flex min-h-11 items-center text-small text-sand-300 transition-colors duration-200 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="flex flex-wrap gap-4">
            {socialLinks.map((social) => (
              <li key={social.platform}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center text-small text-sand-300 transition-colors duration-200 hover:text-white"
                >
                  {social.platform}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
