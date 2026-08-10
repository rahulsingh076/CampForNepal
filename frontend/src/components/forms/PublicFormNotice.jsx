// Shared browser-only and legal notice for public inquiry forms.
import { Link } from 'react-router-dom'
import DemoNotice from '../common/DemoNotice.jsx'
import useSingleton from '../../hooks/useSingleton.js'

export default function PublicFormNotice() {
  const contact = useSingleton('contactDetails')

  return (
    <div className="mt-4 space-y-2">
      <DemoNotice context="form" />
      {contact.data?.responseTime && <p className="text-small text-stone-600">{contact.data.responseTime}</p>}
      <p className="text-small text-stone-600">
        By submitting, you consent to this form retaining the details you provide for this request. Do not include passport, payment, or health-document information. Review the{' '}
        <Link to="/privacy-policy" className="font-medium text-primary-700 hover:text-primary-800">Privacy Policy</Link>,{' '}
        <Link to="/terms-and-conditions" className="font-medium text-primary-700 hover:text-primary-800">Terms and Conditions</Link>, and{' '}
        <Link to="/cancellation-policy" className="font-medium text-primary-700 hover:text-primary-800">Cancellation Policy</Link>.
      </p>
    </div>
  )
}
