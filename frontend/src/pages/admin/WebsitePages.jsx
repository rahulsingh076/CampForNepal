import { useState } from 'react'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import SimpleSectionEditor from '../../components/admin/SimpleSectionEditor.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import FormField from '../../components/common/FormField.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import useSingletonEditor from '../../hooks/useSingletonEditor.js'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

export default function WebsitePages() {
  const editor = useSingletonEditor('sitePages')
  const [openKey, setOpenKey] = useState('about')
  if (editor.status === 'loading' || !editor.draft) return <LoadingState rows={7} label="Loading static pages" />
  if (editor.status === 'error') return <ErrorState title="Could not load static pages" description={editor.error} action={<button type="button" onClick={editor.reload} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white">Try again</button>} />

  const pages = editor.draft.pages || []
  function updatePage(key, changes) {
    editor.setDraft((current) => ({ ...current, pages: current.pages.map((page) => page.key === key ? { ...page, ...changes } : page) }))
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Static pages" description="Edit the public About, privacy, terms, and cancellation-policy pages as straightforward titled sections." actions={<button type="button" onClick={() => editor.save('Static pages saved.')} disabled={!editor.dirty || editor.busy} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">{editor.busy ? 'Saving...' : 'Save pages'}</button>} />
      <WebsiteNav />
      <div className="space-y-4">
        {pages.map((page) => {
          const open = openKey === page.key
          return (
            <article key={page.key} className="border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-h4 font-sans text-stone-900">{page.title}</h2><p className="mt-1 text-small text-stone-600">/{page.key === 'cancellation' ? 'cancellation-policy' : page.key === 'privacy' ? 'privacy-policy' : page.key === 'terms' ? 'terms-and-conditions' : 'about'}</p></div><button type="button" onClick={() => setOpenKey(open ? null : page.key)} aria-expanded={open} className="rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">{open ? 'Close' : 'Edit'}</button></div>
              {open && <div className="mt-5 space-y-5 border-t border-stone-200 pt-5"><div className="grid gap-4 sm:grid-cols-2"><FormField label="Page title" value={page.title || ''} onChange={(event) => updatePage(page.key, { title: event.target.value })} /><FormField label="Status" as="select" options={STATUS_OPTIONS} value={page.status || 'draft'} onChange={(event) => updatePage(page.key, { status: event.target.value })} /><FormField label="Headline" value={page.headline || ''} onChange={(event) => updatePage(page.key, { headline: event.target.value })} className="sm:col-span-2" /><FormField label="Intro" as="textarea" rows={4} value={page.intro || ''} onChange={(event) => updatePage(page.key, { intro: event.target.value })} className="sm:col-span-2" /></div><SimpleSectionEditor value={page.sections || []} onChange={(sections) => updatePage(page.key, { sections })} /></div>}
            </article>
          )
        })}
      </div>
    </div>
  )
}
