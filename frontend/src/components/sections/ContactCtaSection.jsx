// Closing band: talk to a person, ask for a custom trip, or send an inquiry.
// The support line is written for the visitor's own country.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import { getItem, getSingleton } from '../../lib/dataClient.js'
import { safeInternalPath } from '../../lib/urlSafety.js'
import Section from '../common/Section.jsx'
import SectionHeader from '../common/SectionHeader.jsx'
import DemoNotice from '../common/DemoNotice.jsx'
import Reveal from '../motion/Reveal.jsx'

export default function ContactCtaSection({ section }) {
  const locale = useLocale()
  const [contact, setContact] = useState(null)
  const [country, setCountry] = useState(null)

  useEffect(() => {
    let active = true
    getSingleton('contactDetails').then((result) => {
      if (active) setContact(result.success ? result.data : null)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    getItem('countries', locale.country).then((result) => {
      if (active) setCountry(result.success ? result.data : null)
    })
    return () => {
      active = false
    }
  }, [locale.country])

  const whatsappDigits = contact?.whatsappEnabled === false ? '' : contact?.whatsapp?.replace(/[^\d]/g, '')

  // Section already supplies the Container, so this must not add another.
  return (
    <Section tone="primary">
      <>
        <Reveal>
          <SectionHeader title={section.heading} description={section.subtext} onDark />
        </Reveal>

        {country?.suggestedSupportText && (
          <Reveal delay={100}>
            <p className="readable-text mt-6 text-body text-sand-100">
              {country.suggestedSupportText}
            </p>
          </Reveal>
        )}

        <Reveal delay={180}>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link
              to={safeInternalPath(section.ctaLink, '/custom-trip')}
              className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-8 py-4 text-body font-semibold text-white transition-colors duration-200 hover:bg-amber-700"
            >
              {section.ctaLabel || 'Plan My Trip'}
            </Link>

            {whatsappDigits && (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center rounded-lg border border-sand-200/40 px-8 py-4 text-body font-semibold text-white transition-colors duration-200 hover:bg-white/10"
              >
                {section.whatsappLabel || 'Message us on WhatsApp'}
              </a>
            )}

            <Link
              to={safeInternalPath(section.inquiryLink, '/contact')}
              className="inline-flex items-center justify-center rounded-lg border border-sand-200/40 px-8 py-4 text-body font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              {section.inquiryLabel || 'Ask a question'}
            </Link>
          </div>
        </Reveal>

        {section.reassurance && (
          <p className="readable-text mt-6 text-small text-sand-200">{section.reassurance}</p>
        )}

        {section.supportLinks?.length > 0 && (
          <Reveal delay={240}>
            <nav aria-label="Planning support" className="mt-8">
              <ul className="flex flex-wrap gap-x-5 gap-y-3 text-small">
                {section.supportLinks.map((link) => (
                  <li key={link.path}>
                    <Link to={safeInternalPath(link.path, '/contact')} className="font-semibold text-amber-300 hover:text-amber-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>
        )}

        {contact?.officeHours && (
          <p className="readable-text mt-8 text-small text-sand-300">{contact.officeHours}</p>
        )}
        <DemoNotice context="contact" className="mt-3 text-sand-300" />
      </>
    </Section>
  )
}
