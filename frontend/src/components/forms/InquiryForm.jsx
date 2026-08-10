// Inquiry about a specific trip or departure, prefilled with what we know.
import { Link } from 'react-router-dom'
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
  message: { label: 'Your message', required: true, min: 10, max: 1500 },
}

const FORM_ID = 'package-inquiry'
const TODAY = new Date().toISOString().slice(0, 10)
const FIELDS = [
  { name: 'fullName', label: 'Your name' },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone or WhatsApp' },
  { name: 'message', label: 'Your message' },
]

export default function InquiryForm({ trip, departure, onDone }) {
  const { country } = useLocale()

  const prefilled = departure
    ? `I would like to join the ${trip?.title || 'trip'} departing ${departure.startDate}. Could you confirm a seat is still available?`
    : trip
      ? `I am interested in the ${trip.title}. Could you tell me more about dates and availability?`
      : ''

  const form = useForm({
    formId: FORM_ID,
    initialValues: {
      fullName: '',
      email: '',
      phone: '',
      groupSize: '',
      preferredDate: departure?.startDate || '',
      message: prefilled,
    },
    rules: RULES,
    onSubmit: (values) =>
      createInquiry({
        ...values,
        type: 'package_inquiry',
        country,
        packageId: trip?.id || null,
        groupSize: values.groupSize ? Number(values.groupSize) : null,
        subject: departure
          ? `Seat request: ${trip?.title} on ${values.preferredDate || departure.startDate}`
          : `Inquiry: ${trip?.title || 'general'}`,
      }),
  })

  if (form.state === 'sent') {
    return (
      <FormSuccess
        title="Inquiry saved"
        message={`Your question about ${trip?.title || 'this trip'} has been saved in this form preview.`}
        onAgain={onDone || form.resetState}
        againLabel={onDone ? 'Close' : 'Send another'}
      >
        <ExternalEmailActions inquiry={form.submitResult?.data} contextTitle={trip?.title} />
      </FormSuccess>
    )
  }

  return (
    <Card padding="lg">
      <h3 className="text-h4 font-sans text-stone-900">
        {departure ? 'Request a seat' : 'Ask about this trip'}
      </h3>
      <p className="mt-2 text-small text-stone-600">
        No payment and no commitment — this is a question, not a booking.
      </p>

      {trip && (
        <div className="mt-5 rounded-lg border border-stone-200 bg-sand-50 p-4 text-small">
          <p className="text-stone-600">Selected trip</p>
          <p className="mt-1 font-semibold text-stone-900">{trip.title}</p>
          {departure && <p className="mt-1 text-stone-700">Requested departure: {departure.startDate}</p>}
          <Link to="/packages" className="mt-3 inline-flex font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-700">Choose another trip</Link>
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
          hint="Optional, but it speeds things up."
        />
        <FormField
          id={`${FORM_ID}-groupSize`}
          name="groupSize"
          label="How many of you"
          type="number"
          min="1"
          optional
          inputMode="numeric"
          value={form.values.groupSize}
          onChange={form.handleChange('groupSize')}
          onBlur={form.handleBlur('groupSize')}
        />
        <FormField
          id={`${FORM_ID}-preferredDate`}
          name="preferredDate"
          label={departure ? 'Preferred departure date' : 'Preferred travel date'}
          type="date"
          min={TODAY}
          optional
          value={form.values.preferredDate}
          onChange={form.handleChange('preferredDate')}
          onBlur={form.handleBlur('preferredDate')}
        />
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
              {form.state === 'sending' ? 'Saving…' : 'Send inquiry'}
            </Button>
          </div>
          <PublicFormNotice />
        </div>
      </form>
    </Card>
  )
}
