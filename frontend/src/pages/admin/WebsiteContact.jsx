// Admin editor for public company contact settings.
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StringListEditor from '../../components/admin/StringListEditor.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import FormField from '../../components/common/FormField.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import useSingletonEditor from '../../hooks/useSingletonEditor.js'

export default function WebsiteContact() {
  const editor = useSingletonEditor('contactDetails')
  if (editor.status === 'loading' || !editor.draft) return <LoadingState rows={7} label="Loading contact details" />
  if (editor.status === 'error') return <ErrorState title="Could not load contact details" description={editor.error} action={<button type="button" onClick={editor.reload} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white">Try again</button>} />
  const contact = editor.draft
  const update = (field, value) => editor.setDraft((current) => ({ ...current, [field]: value }))

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Contact details" description="Keep office details, emergency contacts, map destination, and WhatsApp current across the public site." actions={<button type="button" onClick={() => editor.save('Contact details saved.')} disabled={!editor.dirty || editor.busy} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">{editor.busy ? 'Saving...' : 'Save contact details'}</button>} />
      <WebsiteNav />
      <section className="border border-stone-200 bg-white p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Company name" value={contact.companyName || ''} onChange={(event) => update('companyName', event.target.value)} />
          <FormField label="Tagline" value={contact.tagline || ''} onChange={(event) => update('tagline', event.target.value)} />
          <FormField label="Office phone" value={contact.phone || ''} onChange={(event) => update('phone', event.target.value)} />
          <FormField label="WhatsApp number" value={contact.whatsapp || ''} onChange={(event) => update('whatsapp', event.target.value)} />
          <FormField label="Public email" type="email" value={contact.publicEmail || contact.email || ''} onChange={(event) => update('publicEmail', event.target.value)} />
          <FormField label="Primary email" type="email" value={contact.email || ''} onChange={(event) => update('email', event.target.value)} />
          <FormField label="Support email" type="email" value={contact.supportEmail || ''} onChange={(event) => update('supportEmail', event.target.value)} />
          <FormField label="Emergency phone" value={contact.emergencyPhone || ''} onChange={(event) => update('emergencyPhone', event.target.value)} />
          <FormField label="Facebook Page URL" value={contact.facebookPageUrl || ''} onChange={(event) => update('facebookPageUrl', event.target.value)} />
          <FormField label="Facebook Messenger URL" value={contact.facebookMessengerUrl || ''} onChange={(event) => update('facebookMessengerUrl', event.target.value)} />
          <FormField label="Instagram URL" value={contact.instagramUrl || ''} onChange={(event) => update('instagramUrl', event.target.value)} />
          <FormField label="Map link" value={contact.mapLink || ''} onChange={(event) => update('mapLink', event.target.value)} />

          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-small font-semibold text-stone-800">
            <input type="checkbox" checked={contact.emailEnabled !== false} onChange={(event) => update('emailEnabled', event.target.checked)} className="h-5 w-5 rounded border-stone-500 text-primary-700 focus:ring-primary-700" />
            Email enabled
          </label>
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-stone-200 px-4 py-3 text-small font-semibold text-stone-800">
            <input type="checkbox" checked={contact.whatsappEnabled !== false} onChange={(event) => update('whatsappEnabled', event.target.checked)} className="h-5 w-5 rounded border-stone-500 text-primary-700 focus:ring-primary-700" />
            WhatsApp enabled
          </label>

          <FormField label="Office hours" as="textarea" rows={4} value={contact.officeHours || ''} onChange={(event) => update('officeHours', event.target.value)} className="sm:col-span-2" />
          <FormField label="Response-time message" as="textarea" rows={3} value={contact.responseTime || ''} onChange={(event) => update('responseTime', event.target.value)} className="sm:col-span-2" />
          <FormField label="Emergency-contact wording" as="textarea" rows={3} value={contact.emergencyContactWording || ''} onChange={(event) => update('emergencyContactWording', event.target.value)} className="sm:col-span-2" />
          <FormField label="Map note" as="textarea" rows={4} value={contact.mapEmbedNote || ''} onChange={(event) => update('mapEmbedNote', event.target.value)} className="sm:col-span-2" />
        </div>
        <div className="mt-6 border-t border-stone-200 pt-5">
          <StringListEditor label="Office address lines" value={contact.addressLines || []} onChange={(addressLines) => update('addressLines', addressLines)} addLabel="Add address line" />
        </div>
      </section>
    </div>
  )
}
