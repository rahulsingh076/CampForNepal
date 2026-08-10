// "Call me instead" — the shortest form on the site, shown inside a modal.
import { useLocale } from '../../contexts/LocaleContext.jsx'
import useForm from '../../hooks/useForm.js'
import { createInquiry } from '../../lib/createInquiry.js'
import Button from '../common/Button.jsx'
import FormField from '../common/FormField.jsx'
import FormError from './FormError.jsx'
import FormSuccess from './FormSuccess.jsx'
import FormValidationSummary from './FormValidationSummary.jsx'
import HoneypotField from './HoneypotField.jsx'
import PublicFormNotice from './PublicFormNotice.jsx'
import ExternalEmailActions from '../contact/ExternalEmailActions.jsx'

const RULES = {
  fullName: { label: 'Your name', required: true, max: 80 },
  phone: { label: 'Phone number', required: true, type: 'phone' },
}

const FORM_ID = 'callback-request'
const FIELDS = [
  { name: 'fullName', label: 'Your name' },
  { name: 'phone', label: 'Phone number' },
]

const WHEN = [
  { value: 'morning', label: 'Morning, Nepal time' },
  { value: 'afternoon', label: 'Afternoon, Nepal time' },
  { value: 'evening', label: 'Evening, Nepal time' },
  { value: 'any', label: 'Any time is fine' },
]

export default function CallbackForm({ onDone }) {
  const { country } = useLocale()

  const form = useForm({
    formId: FORM_ID,
    initialValues: { fullName: '', phone: '', when: 'any', message: '' },
    rules: RULES,
    onSubmit: (values) =>
      createInquiry({
        type: 'callback',
        fullName: values.fullName,
        email: '',
        phone: values.phone,
        country,
        subject: 'Callback request',
        message: `Best time to call: ${WHEN.find((w) => w.value === values.when)?.label}\n\n${values.message}`,
      }),
  })

  if (form.state === 'sent') {
    return (
      <FormSuccess
        title="Callback request saved"
        message="Your preferred callback time has been saved in this form preview."
        onAgain={onDone}
        againLabel="Close"
      >
        <ExternalEmailActions inquiry={form.submitResult?.data} contextTitle="Callback request" />
      </FormSuccess>
    )
  }

  return (
    <form className="relative grid gap-5" onSubmit={form.handleSubmit} noValidate aria-busy={form.state === 'sending'}>
      <HoneypotField {...form.honeypotProps} />
      <FormValidationSummary errors={form.errors} fields={FIELDS} formId={FORM_ID} show={form.hasSubmitted} />

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
        id={`${FORM_ID}-phone`}
        name="phone"
        label="Phone number, with country code"
        type="tel"
        required
        autoComplete="tel"
        inputMode="tel"
        value={form.values.phone}
        onChange={form.handleChange('phone')}
        onBlur={form.handleBlur('phone')}
        error={form.errors.phone}
        hint="For example +82 10 1234 5678"
      />
      <FormField
        id={`${FORM_ID}-when`}
        name="when"
        label="Best time to reach you"
        as="select"
        optional
        value={form.values.when}
        onChange={form.handleChange('when')}
        onBlur={form.handleBlur('when')}
        options={WHEN}
      />
      <FormField
        id={`${FORM_ID}-message`}
        name="message"
        label="Anything we should read first?"
        as="textarea"
        optional
        value={form.values.message}
        onChange={form.handleChange('message')}
        onBlur={form.handleBlur('message')}
      />

      <FormError show={form.state === 'failed' || form.state === 'blocked'} message={form.submitMessage} onRecover={form.state === 'blocked' ? form.recoverSpamCheck : undefined} />

      <Button type="submit" fullWidth disabled={form.state === 'sending'}>
        {form.state === 'sending' ? 'Saving…' : 'Request a callback'}
      </Button>
      <PublicFormNotice />
    </form>
  )
}
