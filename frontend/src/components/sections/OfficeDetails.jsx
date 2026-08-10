// Where we are, how to reach us, and the line that is answered at 3am.
import Card from '../common/Card.jsx'
import DemoNotice from '../common/DemoNotice.jsx'
import ExternalEmailActions from '../contact/ExternalEmailActions.jsx'
import CallbackButton from '../forms/CallbackButton.jsx'
import { safeExternalUrl } from '../../lib/urlSafety.js'

export default function OfficeDetails({ contact }) {
  if (!contact) return null

  const whatsappDigits = contact.whatsappEnabled === false ? '' : contact.whatsapp?.replace(/[^\d]/g, '')
  const publicEmail = contact.emailEnabled === false ? '' : contact.publicEmail || contact.email
  const mapLink = safeExternalUrl(contact.mapLink)

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h2 className="text-h4 font-display text-stone-900">{contact.companyName}</h2>

        <address className="mt-4 not-italic text-body text-stone-700">
          {(contact.addressLines || []).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </address>

        <dl className="mt-6 space-y-3 text-small">
          <div>
            <dt className="text-stone-600">Office</dt>
            <dd className="mt-0.5">
              <a href={`tel:${(contact.phone || '').replace(/\s/g, '')}`} className="font-medium text-primary-700 hover:text-primary-800">
                {contact.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-stone-600">Email</dt>
            <dd className="mt-0.5 font-medium text-primary-800">{publicEmail || 'Not configured'}</dd>
          </div>
          {contact.emailEnabled !== false && contact.supportEmail && (
            <div>
              <dt className="text-stone-600">Support email</dt>
              <dd className="mt-0.5 font-medium text-primary-800">{contact.supportEmail}</dd>
            </div>
          )}
          <div>
            <dt className="text-stone-600">Hours</dt>
            <dd className="mt-0.5 text-stone-700">{contact.officeHours}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-col gap-3">
          <ExternalEmailActions contact={contact} />
          {whatsappDigits && (
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-4 py-3 text-small font-semibold text-white transition-colors duration-200 hover:bg-primary-800"
            >
              Message us on WhatsApp
            </a>
          )}
          <CallbackButton className="inline-flex items-center justify-center rounded-lg border border-stone-300 px-4 py-3 text-small font-semibold text-primary-800 transition-colors duration-200 hover:border-stone-400" />
        </div>

        <div className="mt-6 flex aspect-landscape items-center justify-center rounded-lg bg-sand-200 text-center">
          {mapLink ? <a href={mapLink} target="_blank" rel="noreferrer noopener" className="px-4 text-small font-semibold text-primary-700 hover:text-primary-800">Open office map</a> : <p className="px-4 text-small text-stone-600">{contact.mapEmbedNote}</p>}
        </div>
      </Card>

      {/* Deliberately loud. Someone reading this may be having a bad day. */}
      <div className="rounded-xl border-2 border-danger-500 bg-danger-50 p-6">
        <h2 className="text-h4 font-display text-danger-900">Urgent support</h2>
        <p className="mt-2 text-small text-stone-700">
          {contact.emergencyContactWording || 'If you are travelling with us and something has gone wrong, call or message this line now.'}{' '}
          Normal website inquiries may not be monitored continuously. This demo contact panel is not an emergency service; for an immediate emergency, call local emergency services.
        </p>
        <DemoNotice context="contact" className="mt-2" />

        <div className="mt-4 flex flex-col gap-3">
          <a
            href={`tel:${(contact.emergencyPhone || '').replace(/\s/g, '')}`}
            className="inline-flex items-center justify-center rounded-lg bg-danger-600 px-4 py-3 text-body font-semibold text-white transition-colors duration-200 hover:bg-danger-700"
          >
            {contact.emergencyPhone}
          </a>
          {whatsappDigits && contact.emergencyPhone && (
            <a
              href={`https://wa.me/${contact.emergencyPhone.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center rounded-lg border border-danger-500 px-4 py-3 text-small font-semibold text-danger-800"
            >
              Emergency WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
