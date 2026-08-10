import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import LinkListEditor from '../../components/admin/LinkListEditor.jsx'
import ReorderControls from '../../components/admin/ReorderControls.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import FormField from '../../components/common/FormField.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import useSingletonEditor from '../../hooks/useSingletonEditor.js'

export default function WebsiteFooter() {
  const editor = useSingletonEditor('footer')
  if (editor.status === 'loading' || !editor.draft) return <LoadingState rows={7} label="Loading footer" />
  if (editor.status === 'error') return <ErrorState title="Could not load the footer" description={editor.error} action={<button type="button" onClick={editor.reload} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white">Try again</button>} />

  const footer = editor.draft
  const columns = footer.columns || []
  const contact = footer.contactBlock || { heading: 'Contact Camp for Nepal', body: '', phone: '', email: '' }

  function update(changes) { editor.setDraft((current) => ({ ...current, ...changes })) }
  function updateColumn(index, changes) { update({ columns: columns.map((column, current) => current === index ? { ...column, ...changes } : column) }) }
  function moveColumn(index, delta) {
    const destination = index + delta
    if (destination < 0 || destination >= columns.length) return
    const next = [...columns]
    ;[next[index], next[destination]] = [next[destination], next[index]]
    update({ columns: next })
  }
  function updateSocial(index, changes) { update({ socialLinks: (footer.socialLinks || []).map((social, current) => current === index ? { ...social, ...changes } : social) }) }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Footer" description="Edit link columns, the contact block, legal links, and public social profiles." actions={<button type="button" onClick={() => editor.save('Footer saved.')} disabled={!editor.dirty || editor.busy} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">{editor.busy ? 'Saving...' : 'Save footer'}</button>} />
      <WebsiteNav />

      <section className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">Footer columns</h2><div className="mt-5 space-y-5">{columns.map((column, index) => <div key={`${column.heading}-${index}`} className="border border-stone-200 p-4"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div className="min-w-[16rem] flex-1"><FormField label="Column heading" value={column.heading || ''} onChange={(event) => updateColumn(index, { heading: event.target.value })} /></div><div className="flex items-center gap-2"><ReorderControls label={column.heading || `footer column ${index + 1}`} index={index} total={columns.length} onMove={(delta) => moveColumn(index, delta)} /><button type="button" onClick={() => update({ columns: columns.filter((_, current) => current !== index) })} className="rounded-md px-2 py-1 text-small font-semibold text-danger-700 hover:bg-danger-50">Remove</button></div></div><LinkListEditor label={`${column.heading || 'Column'} links`} value={column.links || []} onChange={(links) => updateColumn(index, { links })} /></div>)}</div><button type="button" onClick={() => update({ columns: [...columns, { heading: 'New column', links: [] }] })} className="mt-4 rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Add column</button></section>

      <section className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">Contact block</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><FormField label="Heading" value={contact.heading || ''} onChange={(event) => update({ contactBlock: { ...contact, heading: event.target.value } })} /><FormField label="Phone" value={contact.phone || ''} onChange={(event) => update({ contactBlock: { ...contact, phone: event.target.value } })} /><FormField label="Email" value={contact.email || ''} onChange={(event) => update({ contactBlock: { ...contact, email: event.target.value } })} /><FormField label="Body" as="textarea" rows={4} value={contact.body || ''} onChange={(event) => update({ contactBlock: { ...contact, body: event.target.value } })} className="sm:col-span-2" /></div></section>

      <section className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">Newsletter and legal links</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><FormField label="Newsletter heading" value={footer.newsletterHeading || ''} onChange={(event) => update({ newsletterHeading: event.target.value })} /><FormField label="Copyright line" value={footer.copyrightLine || ''} onChange={(event) => update({ copyrightLine: event.target.value })} /><FormField label="Newsletter subtext" as="textarea" rows={4} value={footer.newsletterSubtext || ''} onChange={(event) => update({ newsletterSubtext: event.target.value })} className="sm:col-span-2" /></div><div className="mt-5"><LinkListEditor label="Legal links" value={footer.legalLinks || []} onChange={(legalLinks) => update({ legalLinks })} /></div></section>

      <section className="border border-stone-200 bg-white p-5"><h2 className="text-h4 font-sans text-stone-900">Social links</h2><div className="mt-5 space-y-3">{(footer.socialLinks || []).map((social, index) => <div key={`${social.platform}-${index}`} className="grid gap-3 border border-stone-200 p-3 sm:grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] sm:items-end"><FormField label="Platform" value={social.platform || ''} onChange={(event) => updateSocial(index, { platform: event.target.value })} /><FormField label="URL" value={social.url || ''} onChange={(event) => updateSocial(index, { url: event.target.value })} /><button type="button" onClick={() => update({ socialLinks: footer.socialLinks.filter((_, current) => current !== index) })} className="rounded-md px-2 py-1 text-small font-semibold text-danger-700 hover:bg-danger-50">Remove</button></div>)}</div><button type="button" onClick={() => update({ socialLinks: [...(footer.socialLinks || []), { platform: 'New profile', url: 'https://' }] })} className="mt-3 rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Add social link</button></section>
    </div>
  )
}
