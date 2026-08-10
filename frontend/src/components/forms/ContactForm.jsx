// General contact form. Reads query parameters so a "reserve seat" link arrives filled in.
import { Link, useSearchParams } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import useForm from '../../hooks/useForm.js'
import { createInquiry } from '../../lib/createInquiry.js'
import Button from '../common/Button.jsx'
import Card from '../common/Card.jsx'
import FormField from '../common/FormField.jsx'
import FormError from './FormError.jsx'
import FormSuccess from './FormSuccess.jsx'
import FormValidationSummary from './FormValidationSummary.jsx'
import HoneypotField from './HoneypotField.jsx'
import PublicFormNotice from './PublicFormNotice.jsx'
import ExternalEmailActions from '../contact/ExternalEmailActions.jsx'

const RULES = {
  fullName: { label: 'Your name', required: true, max: 80 },
  email: { label: 'Email', required: true, type: 'email' },
  phone: { label: 'Phone', type: 'phone' },
  subject: { label: 'Subject', required: true, max: 120 },
  message: { label: 'Your message', required: true, min: 10, max: 2000 },
}

const FORM_ID = 'contact-request'
const TODAY = new Date().toISOString().slice(0, 10)
const FIELDS = [
  { name: 'fullName', label: 'Your name' },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone or WhatsApp' },
  { name: 'subject', label: 'Subject' },
  { name: 'message', label: 'Your message' },
]

export default function ContactForm() {
  const { country } = useLocale()
  const [params] = useSearchParams()

  // A departure link carries its own context, so the visitor does not retype it.
  const departureId = params.get('departure')
  const tripName = params.get('trip')
  const date = params.get('date')
  const dateLabel = params.get('dateLabel') || date
  const slug = params.get('slug')
  const isSeatRequest = params.get('type') === 'departure' && departureId

  const form = useForm({
    formId: FORM_ID,
    initialValues: {
      fullName: '',
      email: '',
      phone: '',
      subject: isSeatRequest ? `Seat request: ${tripName || 'a departure'}` : '',
      preferredDate: date || '',
      message: isSeatRequest
        ? `I would like to reserve a seat on the departure starting ${dateLabel}. Please confirm availability.`
        : '',
    },
    rules: RULES,
    onSubmit: (values) =>
      createInquiry({
        ...values,
        type: isSeatRequest ? 'package_inquiry' : 'contact',
        country,
        preferredDate: values.preferredDate || null,
      }),
  })

  if (form.state === 'sent') {
    return (
      <FormSuccess
        title="Inquiry saved"
        message="Your message has been saved in this form preview."
        onAgain={form.resetState}
      >
        <ExternalEmailActions inquiry={form.submitResult?.data} contextTitle={isSeatRequest ? tripName : form.submitResult?.data?.subject} />
      </FormSuccess>
    )
  }

  return (
    <Card padding="lg">
      <h2 className="text-h3 font-sans text-stone-900">
        {isSeatRequest ? 'Request this seat' : 'Send us a message'}
      </h2>
      <p className="mt-2 text-small text-stone-600">
        {isSeatRequest
          ? 'We have filled in the departure details. Just add how to reach you.'
          : 'Ask us anything. There is no such thing as a silly question about the Himalaya.'}
      </p>

      {isSeatRequest && (
        <div className="mt-5 rounded-lg border border-stone-200 bg-sand-50 p-4 text-small">
          <p className="text-stone-600">Selected departure</p>
          <p className="mt-1 font-semibold text-stone-900">{tripName || 'Departure request'}</p>
          <p className="mt-1 text-stone-700">{dateLabel}</p>
          <Link to={slug ? `/packages/${slug}` : '/fixed-departures'} className="mt-3 inline-flex font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-700">Choose another departure</Link>
        </div>
      )}

      <form className="relative mt-6 grid gap-5 sm:grid-cols-2" onSubmit={form.handleSubmit} noValidate aria-busy={form.state === 'sending'}>
        <HoneypotField {...form.honeypotProps} />
        <div className="sm:col-span-2">
          <FormValidationSummary errors={form.errors} fields={FIELDS} formId={FORM_ID} show={form.hasSubmitted} />
        </div>

        <FormField
          id={`${FORM_ID}-fullName`}
          name="fullName"
          label="Your name"
          required
          autoComplete="name"
          value={form.values.fullName}
          onChange={form.handleChange('fullName')}
          onBlur={form.handleBlur('fullName')}
          error={form.errors.fullName}
        />
        <FormField
          id={`${FORM_ID}-email`}
          name="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={form.values.email}
          onChange={form.handleChange('email')}
          onBlur={form.handleBlur('email')}
          error={form.errors.email}
        />
        <FormField
          id={`${FORM_ID}-phone`}
          name="phone"
          label="Phone or WhatsApp"
          type="tel"
          optional
          autoComplete="tel"
          inputMode="tel"
          value={form.values.phone}
          onChange={form.handleChange('phone')}
          onBlur={form.handleBlur('phone')}
          error={form.errors.phone}
        />
        <FormField
          id={`${FORM_ID}-subject`}
          name="subject"
          label="Subject"
          required
          value={form.values.subject}
          onChange={form.handleChange('subject')}
          onBlur={form.handleBlur('subject')}
          error={form.errors.subject}
        />
        {isSeatRequest && (
          <FormField
            id={`${FORM_ID}-preferredDate`}
            name="preferredDate"
            label="Preferred departure date"
            type="date"
            min={TODAY}
            value={form.values.preferredDate}
            onChange={form.handleChange('preferredDate')}
            onBlur={form.handleBlur('preferredDate')}
          />
        )}
        <FormField
          id={`${FORM_ID}-message`}
          name="message"
          label="Your message"
          as="textarea"
          required
          className="sm:col-span-2"
          value={form.values.message}
          onChange={form.handleChange('message')}
          onBlur={form.handleBlur('message')}
          error={form.errors.message}
        />

        <div className="sm:col-span-2">
          <FormError show={form.state === 'failed' || form.state === 'blocked'} message={form.submitMessage} onRecover={form.state === 'blocked' ? form.recoverSpamCheck : undefined} />
          <div className="mt-4">
            <Button type="submit" disabled={form.state === 'sending'}>
              {form.state === 'sending' ? 'Saving…' : 'Send message'}
            </Button>
          </div>
          <PublicFormNotice />
        </div>
      </form>
    </Card>
  )
}
