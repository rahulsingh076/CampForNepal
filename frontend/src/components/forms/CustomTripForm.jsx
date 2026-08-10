// The full custom-trip brief, split into three calm stages without changing its CRM payload.
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLocale } from '../../contexts/LocaleContext.jsx'
import useCollection from '../../hooks/useCollection.js'
import useForm from '../../hooks/useForm.js'
import {
  BUDGET_RANGES,
  COMFORT_LEVELS,
  DATE_FLEXIBILITY,
  TRIP_DURATIONS,
  TRIP_TYPES,
  YES_NO,
  buildCustomTripInquiry,
} from '../../config/customTripOptions.js'
import { createInquiry } from '../../lib/createInquiry.js'
import Button from '../common/Button.jsx'
import Card from '../common/Card.jsx'
import FormField from '../common/FormField.jsx'
import FormError from './FormError.jsx'
import FormStepProgress from './FormStepProgress.jsx'
import FormSuccess from './FormSuccess.jsx'
import FormValidationSummary from './FormValidationSummary.jsx'
import HoneypotField from './HoneypotField.jsx'
import PublicFormNotice from './PublicFormNotice.jsx'
import ExternalEmailActions from '../contact/ExternalEmailActions.jsx'

const FORM_ID = 'custom-trip'
const TODAY = new Date().toISOString().slice(0, 10)

const RULES = {
  fullName: { label: 'Your name', required: true, max: 80 },
  email: { label: 'Email', required: true, type: 'email' },
  phone: { label: 'Phone', required: true, type: 'phone' },
  message: { label: 'What you have in mind', required: true, min: 20, max: 2000 },
  consent: { label: 'Consent', required: true },
}

const STEPS = [
  { shortLabel: 'Trip', title: 'Your Nepal Trip Idea', fields: [] },
  { shortLabel: 'Preferences', title: 'Your Travel Preferences', fields: [] },
  {
    shortLabel: 'Contact',
    title: 'Contact and Review',
    fields: [
      { name: 'fullName', label: 'Your name' },
      { name: 'email', label: 'Email' },
      { name: 'phone', label: 'WhatsApp or phone' },
      { name: 'message', label: 'What you have in mind' },
      { name: 'consent', label: 'Consent' },
    ],
  },
]

export default function CustomTripForm() {
  const locale = useLocale()
  const countries = useCollection('countries', {})
  const languages = useCollection('languages', {})
  const destinations = useCollection('destinations', { filters: { status: 'published' } })
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedStep = Number.parseInt(searchParams.get('step') || '1', 10) - 1
  const initialStep = Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep < STEPS.length ? requestedStep : 0
  const [step, setStep] = useState(initialStep)
  const headingRef = useRef(null)
  const hasMounted = useRef(false)

  const form = useForm({
    formId: FORM_ID,
    initialValues: {
      fullName: '', email: '', phone: '', country: locale.country, language: locale.language,
      nationality: '', destinationInterest: '', preferredDate: '', groupSize: '', budgetRange: '',
      dateFlexibility: '', tripDuration: '', tripType: '', comfortLevel: '',
      guideRequested: '', guideLanguage: locale.language, hotelNeeded: '', hotelDetails: '',
      transportNeeded: '', transportDetails: '', specialPreferences: '', message: '', consent: false,
    },
    rules: RULES,
    onSubmit: (values) => createInquiry(buildCustomTripInquiry(values, {
      destinations: destinations.items,
      languages: languages.items,
    })),
  })

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    headingRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (initialStep !== step) setStep(initialStep)
  }, [initialStep, step])

  if (form.state === 'sent') {
    return (
      <FormSuccess
        title="Trip brief saved"
        message="Your preferences have been saved in this form preview."
        onAgain={() => { form.resetState(); setActiveStep(0, true) }}
        againLabel="Start another brief"
      >
        <ExternalEmailActions inquiry={form.submitResult?.data} contextTitle="Custom trip request" />
      </FormSuccess>
    )
  }

  const field = (name, label, extra = {}) => (
    <FormField
      id={`${FORM_ID}-${name}`}
      name={name}
      label={label}
      value={form.values[name]}
      onChange={form.handleChange(name)}
      onBlur={form.handleBlur(name)}
      error={form.errors[name]}
      {...extra}
    />
  )

  const destination = destinations.items.find((item) => item.id === form.values.destinationInterest)
  const selectedTripType = TRIP_TYPES.find((item) => item.value === form.values.tripType)?.label
  const selectedBudget = BUDGET_RANGES.find((item) => item.value === form.values.budgetRange)?.label

  function setActiveStep(nextStep, replace = false) {
    const next = Math.max(0, Math.min(nextStep, STEPS.length - 1))
    const nextParams = new URLSearchParams(searchParams)
    if (next === 0) nextParams.delete('step')
    else nextParams.set('step', String(next + 1))
    setStep(next)
    setSearchParams(nextParams, { replace })
  }

  function nextStep() {
    const errors = form.validateFields(STEPS[step].fields.map((fieldItem) => fieldItem.name))
    if (Object.keys(errors).length === 0) setActiveStep(step + 1)
  }

  return (
    <Card padding="lg">
      <form className="relative" onSubmit={form.handleSubmit} noValidate aria-busy={form.state === 'sending'}>
        <HoneypotField {...form.honeypotProps} />
        <FormStepProgress steps={STEPS} currentStep={step} />

        <div className="mt-8">
          <p className="text-small font-semibold text-primary-800">Step {step + 1} of {STEPS.length}</p>
          <h3 ref={headingRef} tabIndex={-1} className="mt-2 text-h4 font-sans text-stone-900">{STEPS[step].title}</h3>
          <p className="mt-2 text-small text-stone-600">
            {step === 0 && 'Start with the broad shape. You can leave anything undecided.'}
            {step === 1 && 'A few practical preferences help us understand the kind of trip you want.'}
            {step === 2 && 'Review the outline, then share only the contact details needed for this request.'}
          </p>
        </div>

        <FormValidationSummary errors={form.errors} fields={STEPS[step].fields} formId={FORM_ID} show={form.hasSubmitted} />

        {step === 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {field('destinationInterest', 'Where would you like to go?', {
              as: 'select',
              options: [{ value: '', label: 'Not decided yet' }, ...destinations.items.map((item) => ({ value: item.id, label: item.title }))],
            })}
            {field('tripType', 'What kind of trip?', { as: 'select', options: TRIP_TYPES })}
            {field('preferredDate', 'When would you like to travel?', {
              type: 'date', min: TODAY, onInput: form.handleChange('preferredDate'), hint: 'Choose a date if you know it; a rough timeframe is fine in your notes.', className: 'sm:col-span-2',
            })}
            {field('dateFlexibility', 'How flexible are your dates?', { as: 'select', options: DATE_FLEXIBILITY, optional: true })}
            {field('tripDuration', 'How long would you like to travel?', { as: 'select', options: TRIP_DURATIONS, optional: true })}
          </div>
        )}

        {step === 1 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {field('groupSize', 'How many people are travelling?', { type: 'number', min: '1', inputMode: 'numeric', optional: true })}
            {field('budgetRange', 'Budget per person', { as: 'select', options: BUDGET_RANGES, optional: true, hint: 'A range is enough. It helps us suggest something honest.' })}
            {field('comfortLevel', 'Comfort level', { as: 'select', options: COMFORT_LEVELS, optional: true })}
            {field('hotelNeeded', 'Hotels in Kathmandu or Pokhara', { as: 'select', options: YES_NO, optional: true })}
            {form.values.hotelNeeded === 'yes' && field('hotelDetails', 'Hotel preferences', {
              as: 'textarea', optional: true, hint: 'For example, room type, neighbourhood, or number of nights.',
            })}
            {field('transportNeeded', 'Internal flights and transport', { as: 'select', options: YES_NO, optional: true })}
            {form.values.transportNeeded === 'yes' && field('transportDetails', 'Transport preferences', {
              as: 'textarea', optional: true, hint: 'For example, flights, private vehicle, or a route you would like to avoid.',
            })}
            {field('guideRequested', 'Would you like a guide?', { as: 'select', options: YES_NO, optional: true })}
            {form.values.guideRequested === 'yes' && field('guideLanguage', 'Guide language preference', {
              as: 'select', options: languages.items.map((item) => ({ value: item.code, label: item.name })), optional: true,
            })}
            {field('specialPreferences', 'Travel preferences', {
              as: 'textarea', optional: true, className: 'sm:col-span-2', hint: 'For example, a slower pace, family needs, interests, or accessibility considerations. Please do not include medical records.',
            })}
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {field('fullName', 'Your name', { required: true, autoComplete: 'name' })}
            {field('email', 'Email', { type: 'email', required: true, autoComplete: 'email', inputMode: 'email' })}
            {field('phone', 'WhatsApp or phone', { type: 'tel', required: true, autoComplete: 'tel', inputMode: 'tel', hint: 'Include a country code if you would like a call.' })}
            {field('country', 'Where you are based', {
              as: 'select', optional: true, options: countries.items.map((item) => ({ value: item.countryCode, label: item.countryName })),
            })}
            {field('language', 'Language for written replies', {
              as: 'select', optional: true, options: languages.items.map((item) => ({ value: item.code, label: item.name })),
            })}
            {field('nationality', 'Nationality, if you would like permit or visa guidance', {
              optional: true, autoComplete: 'country-name', hint: 'Optional. We do not need passport or identity-document details in this form.', className: 'sm:col-span-2',
            })}
            {field('message', 'Anything else we should know?', {
              as: 'textarea', required: true, className: 'sm:col-span-2', hint: 'Example: a slower pace, a celebration, interests, or a route you are considering.',
            })}

            <div className="sm:col-span-2">
              <label htmlFor={`${FORM_ID}-consent`} className="flex items-start gap-3 text-small text-stone-700">
                <input
                  id={`${FORM_ID}-consent`}
                  name="consent"
                  type="checkbox"
                  checked={form.values.consent}
                  onChange={form.handleChange('consent')}
                  onBlur={form.handleBlur('consent')}
                  aria-invalid={form.errors.consent ? true : undefined}
                  aria-describedby={form.errors.consent ? `${FORM_ID}-consent-error` : undefined}
                  className="mt-0.5 h-5 w-5 rounded border-stone-500 text-primary-700 focus:ring-primary-700"
                />
                <span>I consent to this browser-only form retaining these details for this trip request. I will not include passport, payment, health, or identity-document information.</span>
              </label>
              {form.errors.consent && <p id={`${FORM_ID}-consent-error`} role="alert" className="mt-2 text-small font-medium text-danger-700">{form.errors.consent}</p>}
            </div>

            <section aria-label="Review your trip outline" className="sm:col-span-2 rounded-lg border border-stone-200 bg-sand-50 p-4">
              <h4 className="font-sans font-semibold text-stone-900">Review your trip outline</h4>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-small sm:grid-cols-2">
                <div><dt className="text-stone-600">Destination</dt><dd className="font-medium text-stone-900">{destination?.title || 'Not decided yet'}</dd></div>
                <div><dt className="text-stone-600">Trip type</dt><dd className="font-medium text-stone-900">{selectedTripType || 'Not decided yet'}</dd></div>
                <div><dt className="text-stone-600">Travel date</dt><dd className="font-medium text-stone-900">{form.values.preferredDate || 'Not decided yet'}</dd></div>
                <div><dt className="text-stone-600">Budget</dt><dd className="font-medium text-stone-900">{selectedBudget || 'Not decided yet'}</dd></div>
              </dl>
              <p className="mt-3 text-small text-stone-600">Use Back to update any preference before you submit.</p>
            </section>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:justify-between">
          {step > 0 ? <Button variant="secondary" onClick={() => setActiveStep(step - 1)}>Back</Button> : <span />}
          {step < STEPS.length - 1 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button type="submit" disabled={form.state === 'sending'}>{form.state === 'sending' ? 'Saving...' : 'Send my brief'}</Button>
          )}
        </div>

        {step === STEPS.length - 1 && (
          <div className="mt-4">
            <FormError show={form.state === 'failed' || form.state === 'blocked'} message={form.submitMessage} onRecover={form.state === 'blocked' ? form.recoverSpamCheck : undefined} />
            <PublicFormNotice />
          </div>
        )}
      </form>
    </Card>
  )
}
