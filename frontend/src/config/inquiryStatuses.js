export const INQUIRY_PIPELINE = [
  { status: 'new', label: 'New' },
  { status: 'contacted', label: 'Contacted' },
  { status: 'quoted', label: 'Quoted' },
]

export const INQUIRY_SIDE_STATES = [
  { status: 'converted', label: 'Converted' },
  { status: 'lost', label: 'Lost' },
  { status: 'closed', label: 'Closed' },
]

export function inquiryStatusLabel(status) {
  return [...INQUIRY_PIPELINE, ...INQUIRY_SIDE_STATES]
    .find((item) => item.status === status)?.label || String(status || '').replace(/_/g, ' ')
}

export function allowedInquiryTransitions(status) {
  if (status === 'new') return ['contacted', 'lost', 'closed']
  if (status === 'contacted') return ['quoted', 'lost', 'closed']
  if (status === 'quoted') return ['converted', 'lost', 'closed']
  return []
}

export function isOpenInquiry(status) {
  return !['converted', 'lost', 'closed'].includes(status)
}
