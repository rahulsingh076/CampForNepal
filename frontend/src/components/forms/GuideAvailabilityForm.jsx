// Asks whether a guide is free for a set of dates. Same pipeline as every
// other form: shared validation, honeypot, and dataClient.
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
  message: { label: 'What you have in mind', required: true, min: 10, max: 1500 },
}

const FORM_ID = 'guide-request'
const TODAY = new Date().toISOString().slice(0, 10)
const FIELDS = [
  { name: 'fullName', label: 'Your name' },
  { name: 'email', label: 'Email' },
  { name: 'phone', label: 'Phone or WhatsApp' },
  { name: 'message', label: 'What you have in mind?' },
]

export default function GuideAvailabilityForm({ guide }) {
  const { country } = useLocale()

  const form = useForm({
    formId: FORM_ID,
    initialValues: {
      fullName: '',
      email: '',
      phone: '',
      preferredDate: '',
      groupSize: '',
      message: '',
    },
    rules: RULES,
    onSubmit: (values) =>
      createInquiry({
        ...values,
        type: 'guide_request',
        guideId: guide.id,
        country,
        subject: `Availability request for ${guide.fullName}`,
        groupSize: values.groupSize ? Number(values.groupSize) : null,
      }),
  })

  if (form.state === 'sent') {
    return (
      <FormSuccess
        title="Guide request saved"
        message={`Your request for ${guide.fullName} has been saved in this form preview.`}
        onAgain={form.resetState}
        againLabel="Send another request"
      >
        <ExternalEmailActions inquiry={form.submitResult?.data} contextTitle={guide.fullName} />
      </FormSuccess>
    )
  }

  return (
    <Card padding="lg">
      <h3 className="text-h4 font-sans text-stone-900">
        Check {guide.fullName}&rsquo;s availability
      </h3>
      <p className="mt-2 text-small text-stone-600">
        No payment and no commitment. This checks availability through an inquiry.
      </p>

      <div className="mt-5 rounded-lg border border-stone-200 bg-sand-50 p-4 text-small">
        <p className="text-stone-600">Selected guide</p>
        <p className="mt-1 font-semibold text-stone-900">{guide.fullName}</p>
        <Link to="/guides" className="mt-3 inline-flex font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-700">Choose another guide</Link>
      </div>

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
          id={`${FORM_ID}-preferredDate`}
          name="preferredDate"
          label="Roughly when"
          type="date"
          min={TODAY}
          optional
          value={form.values.preferredDate}
          onChange={form.handleChange('preferredDate')}
          onBlur={form.handleBlur('preferredDate')}
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
          id={`${FORM_ID}-message`}
          name="message"
          label="What do you have in mind?"
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
              {form.state === 'sending' ? 'Saving…' : 'Send request'}
            </Button>
          </div>
          <PublicFormNotice />
        </div>
      </form>
    </Card>
  )
}
