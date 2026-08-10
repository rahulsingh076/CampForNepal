// Preview scaffolding: form controls with labels, hints, and error text.
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import FormField from '../../components/common/FormField.jsx'

const GROUP_SIZES = [
  { value: '1', label: '1 traveller' },
  { value: '2', label: '2 travellers' },
  { value: '4', label: '3 to 4 travellers' },
]

export default function FormPreview() {
  return (
    <Card padding="lg">
      <h3 className="text-h4 font-display text-stone-900">Form fields</h3>
      <p className="mt-2 text-small text-stone-600">
        Every control has a real label tied to its input. Tab through them to see the
        focus ring.
      </p>

      <form className="mt-6 grid gap-6 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
        <FormField label="Full name" placeholder="Your name" required />
        <FormField
          label="Email address"
          type="email"
          placeholder="you@example.com"
          hint="We only use this to reply to your enquiry."
        />
        <FormField
          label="Phone number"
          type="tel"
          defaultValue="not-a-number"
          error="Enter a valid phone number, including the country code."
        />
        <FormField label="Group size" as="select" options={GROUP_SIZES} />
        <FormField
          label="Tell us about your trip"
          as="textarea"
          placeholder="Where would you like to go, and when?"
          className="sm:col-span-2"
        />
        <FormField label="Disabled field" disabled defaultValue="Not editable" />
        <div className="flex items-end">
          <Button type="submit">Send enquiry</Button>
        </div>
      </form>
    </Card>
  )
}
