import { useState } from 'react'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminSaveBar from '../../components/admin/AdminSaveBar.jsx'
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import FormField from '../../components/common/FormField.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import useLocaleOptions from '../../hooks/useLocaleOptions.js'
import useSingletonEditor from '../../hooks/useSingletonEditor.js'
import { resetDemoData } from '../../lib/dataClient.js'

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'notifications', label: 'Notification templates' },
  { key: 'payments', label: 'Payments (V2)', locked: true },
  { key: 'demo', label: 'Demo controls' },
]

export default function Settings() {
  const editor = useSingletonEditor('siteSettings')
  const templateEditor = useSingletonEditor('notificationTemplates')
  const localeOptions = useLocaleOptions()
  const { showToast } = useToast()
  const [tab, setTab] = useState('general')
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)
  if (editor.status === 'loading' || templateEditor.status === 'loading' || !editor.draft || !templateEditor.draft) return <LoadingState rows={6} label="Loading settings" />
  if (editor.status === 'error' || templateEditor.status === 'error') return <ErrorState title="Could not load settings" description={editor.error || templateEditor.error} action={<button type="button" onClick={() => { editor.reload(); templateEditor.reload() }} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white">Try again</button>} />

  const settings = editor.draft
  function update(field, value) { editor.setDraft((current) => ({ ...current, [field]: value })) }
  function updateTemplate(key, field, value) { templateEditor.setDraft((current) => ({ ...current, templates: { ...current.templates, [key]: { ...current.templates[key], [field]: value } } })) }

  async function reset() {
    setResetting(true)
    const result = await resetDemoData()
    setResetting(false)
    if (!result.success) return showToast(result.message || 'Could not reset the demo.', 'error')
    setConfirmReset(false)
    editor.reload()
    templateEditor.reload()
    showToast('Demo data reset. The audit log has returned to its seed entries.', 'info')
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settings" description="Set site-wide defaults and manage the frontend-only demo data." />
      <div className="flex flex-wrap gap-2 border-b border-stone-200" role="tablist" aria-label="Settings sections">{TABS.map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} onClick={() => setTab(item.key)} className={`border-b-2 px-3 py-3 text-small font-semibold ${tab === item.key ? 'border-primary-700 text-primary-800' : 'border-transparent text-stone-600 hover:text-primary-800'}`}>{item.locked && <span aria-hidden="true">Locked · </span>}{item.label}</button>)}</div>
      {tab === 'general' && <section className="border border-stone-200 bg-white p-5"><div className="grid gap-4 sm:grid-cols-2"><FormField label="Site name" value={settings.siteName || ''} onChange={(event) => update('siteName', event.target.value)} /><FormField label="Default language" as="select" options={localeOptions.languages.map((item) => ({ value: item.code, label: item.name }))} value={settings.defaultLanguage || 'en'} onChange={(event) => update('defaultLanguage', event.target.value)} /><FormField label="Default currency" as="select" options={localeOptions.currencies.map((item) => ({ value: item.code, label: `${item.code} - ${item.label}` }))} value={settings.defaultCurrency || 'USD'} onChange={(event) => update('defaultCurrency', event.target.value)} /></div></section>}
      {tab === 'notifications' && <section className="space-y-4"><p className="max-w-3xl text-body text-stone-600">These templates power the in-app bell. Email and WhatsApp delivery are deliberately locked until Version 2 has a backend sender.</p>{Object.entries(templateEditor.draft.templates || {}).map(([key, template]) => <article key={key} className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">{template.label}</h2><div className="mt-4 grid gap-4"><FormField label="Notification title" value={template.title || ''} onChange={(event) => updateTemplate(key, 'title', event.target.value)} /><FormField label="Notification message" as="textarea" value={template.message || ''} onChange={(event) => updateTemplate(key, 'message', event.target.value)} hint="Use placeholders such as {{fullName}} or {{statusLabel}} when relevant." /></div></article>)}<article className="border border-stone-200 bg-sand-50 p-5"><p className="text-small font-semibold text-stone-800">Email and WhatsApp delivery (V2)</p><p className="mt-1 text-small text-stone-600">The notification content is ready, but no external messages are sent by this frontend-only demo.</p></article></section>}
      {tab === 'payments' && <section className="border border-stone-200 bg-sand-50 p-6"><span className="inline-flex items-center gap-2 text-small font-semibold text-stone-700"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="1" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>Payments is planned for V2</span><p className="mt-3 max-w-2xl text-body text-stone-600">Booking status and trip content are managed in this demo. Payment collection is intentionally not part of the frontend-only release.</p></section>}
      {tab === 'demo' && <section className="border border-danger-200 bg-danger-50 p-6"><h2 className="text-h4 font-sans text-danger-900">Reset demo data</h2><p className="mt-2 max-w-2xl text-body text-danger-800">Return local content edits, drafts, moderation, user changes, and audit additions to the seeded demonstration state. Saved trips, sign-in state, and locale preferences stay in this browser.</p><button type="button" onClick={() => setConfirmReset(true)} className="mt-5 rounded-lg bg-danger-700 px-4 py-2 text-small font-semibold text-white hover:bg-danger-800">Reset demo data</button></section>}
      {tab === 'general' && <AdminSaveBar editor={editor} saveLabel="Save settings" />}
      {tab === 'notifications' && <AdminSaveBar editor={templateEditor} saveLabel="Save templates" />}
      <ConfirmDialog open={confirmReset} onClose={() => !resetting && setConfirmReset(false)} onConfirm={reset} busy={resetting} itemName="Content overlay, user changes, and audit additions" title="Reset demo content data?" description="This cannot be undone. It clears the browser's local content overlay, including posts, catalogue edits, review moderation, registered demo users, and audit additions. Saved trips, sign-in state, and locale preferences stay in this browser." confirmLabel="Reset demo data" />
    </div>
  )
}
