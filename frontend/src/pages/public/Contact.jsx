// Contact page: a form, the office details, and the emergency line.
import Button from '../../components/common/Button.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import PageHeader from '../../components/common/PageHeader.jsx'
import Section from '../../components/common/Section.jsx'
import ContactForm from '../../components/forms/ContactForm.jsx'
import Reveal from '../../components/motion/Reveal.jsx'
import OfficeDetails from '../../components/sections/OfficeDetails.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'
import useSingleton from '../../hooks/useSingleton.js'

const TITLE = 'Contact us'
const DESCRIPTION =
  'Find office details, call or message on WhatsApp, or record a question in this browser-only form preview.'

export default function Contact() {
  usePageMeta(TITLE, DESCRIPTION)
  const contact = useSingleton('contactDetails')

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />

      <Section>
        <div className="grid gap-10 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <ContactForm />
          </Reveal>

          <Reveal delay={120}>
            {contact.status === 'loading' ? (
              <LoadingState rows={6} label="Loading contact details" />
            ) : contact.status === 'error' ? (
              <ErrorState
                title="We could not load contact details"
                description="The inquiry form is still available. Try loading the office details again before relying on a phone number or map link."
                action={<Button type="button" variant="secondary" onClick={contact.reload}>Try again</Button>}
              />
            ) : (
              <OfficeDetails contact={contact.data} />
            )}
          </Reveal>
        </div>
      </Section>
    </>
  )
}
