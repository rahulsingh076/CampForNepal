// The fixed choices offered on the custom trip form.

export const BUDGET_RANGES = [
  { value: '', label: 'Not sure yet' },
  { value: 'under1500', label: 'Under $1,500 per person' },
  { value: '1500to3000', label: '$1,500 to $3,000 per person' },
  { value: '3000to6000', label: '$3,000 to $6,000 per person' },
  { value: 'over6000', label: 'Over $6,000 per person' },
]

export const TRIP_TYPES = [
  { value: '', label: 'Help me decide' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'expedition', label: 'Peak climbing or expedition' },
  { value: 'tour', label: 'Cultural or wildlife tour' },
  { value: 'mixed', label: 'A mix of these' },
]

export const DATE_FLEXIBILITY = [
  { value: '', label: 'Not sure yet' },
  { value: 'fixed', label: 'My dates are fixed' },
  { value: 'a_few_days', label: 'I can move them by a few days' },
  { value: 'open', label: 'I am open to suggestions' },
]

export const TRIP_DURATIONS = [
  { value: '', label: 'Not sure yet' },
  { value: '1_3_days', label: '1 to 3 days' },
  { value: '4_7_days', label: '4 to 7 days' },
  { value: '8_14_days', label: '8 to 14 days' },
  { value: '15_plus_days', label: '15 days or more' },
]

export const COMFORT_LEVELS = [
  { value: '', label: 'Not sure yet' },
  { value: 'simple', label: 'Simple and practical' },
  { value: 'comfortable', label: 'Comfortable where possible' },
  { value: 'premium', label: 'More comfort and private transport' },
]

export const YES_NO = [
  { value: '', label: 'Not sure yet' },
  { value: 'yes', label: 'Yes please' },
  { value: 'no', label: 'No, I will arrange it' },
]

// Written into the inquiry message so the CRM sees the whole brief in one place.
export function summariseBrief(values, labels = {}) {
  const lines = [
    ['Nationality', values.nationality],
    ['Interested in', labels.destination || values.destinationInterest],
    ['Trip type', labels.tripType || values.tripType],
    ['Travel date', values.preferredDate],
    ['Date flexibility', labels.flexibility || values.dateFlexibility],
    ['Approximate duration', labels.duration || values.tripDuration],
    ['Travellers', values.groupSize],
    ['Budget', labels.budget || values.budgetRange],
    ['Comfort', labels.comfort || values.comfortLevel],
    ['Writes to me in', labels.language || values.language],
    ['Guide requested', labels.guideRequested || values.guideRequested],
    ['Guide language', values.guideRequested === 'yes' ? labels.guideLanguage || values.guideLanguage : ''],
    ['Hotels needed', labels.hotel || values.hotelNeeded],
    ['Hotel preferences', values.hotelNeeded === 'yes' ? values.hotelDetails : ''],
    ['Transport needed', labels.transport || values.transportNeeded],
    ['Transport preferences', values.transportNeeded === 'yes' ? values.transportDetails : ''],
    ['Travel preferences', values.specialPreferences],
  ].filter(([, value]) => value)

  const brief = lines.map(([label, value]) => `${label}: ${value}`).join('\n')
  return values.message ? `${values.message}\n\n---\n${brief}` : brief
}

const labelFor = (options, value) => options.find((option) => option.value === value)?.label || ''

// Turns the whole brief into one inquiry record for the CRM.
export function buildCustomTripInquiry(values, { destinations = [], languages = [] }) {
  return {
    type: 'custom_trip',
    fullName: values.fullName,
    email: values.email,
    phone: values.phone,
    country: values.country,
    preferredDate: values.preferredDate || null,
    groupSize: values.groupSize ? Number(values.groupSize) : null,
    subject: 'Custom trip request',
    message: summariseBrief(values, {
      destination: destinations.find((row) => row.id === values.destinationInterest)?.title,
      tripType: labelFor(TRIP_TYPES, values.tripType),
      flexibility: labelFor(DATE_FLEXIBILITY, values.dateFlexibility),
      duration: labelFor(TRIP_DURATIONS, values.tripDuration),
      budget: labelFor(BUDGET_RANGES, values.budgetRange),
      comfort: labelFor(COMFORT_LEVELS, values.comfortLevel),
      language: languages.find((row) => row.code === values.language)?.name,
      guideLanguage: languages.find((row) => row.code === values.guideLanguage)?.name,
      guideRequested: labelFor(YES_NO, values.guideRequested),
      hotel: labelFor(YES_NO, values.hotelNeeded),
      transport: labelFor(YES_NO, values.transportNeeded),
    }),
  }
}
