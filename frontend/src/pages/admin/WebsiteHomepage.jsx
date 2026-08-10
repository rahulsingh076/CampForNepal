import { useMemo, useState } from 'react'
import AdminImageField from '../../components/admin/AdminImageField.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import AdminSaveBar from '../../components/admin/AdminSaveBar.jsx'
import RelationshipChecklist from '../../components/admin/RelationshipChecklist.jsx'
import ReorderControls from '../../components/admin/ReorderControls.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'
import FormField from '../../components/common/FormField.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import useCollection from '../../hooks/useCollection.js'
import useSingletonEditor from '../../hooks/useSingletonEditor.js'

const SOURCE_FOR_SECTION = {
  featuredPackages: 'packages',
  popularDestinations: 'destinations',
  thingsToDo: 'activities',
  fixedDepartures: 'fixedDepartures',
  meetOurGuides: 'guides',
  trekkingHighlights: 'packages',
  expeditions: 'packages',
  customerReviews: 'reviews',
  travelUpdates: 'travelUpdates',
  certificatesAndTrust: 'certificates',
}

function optionsFrom(rows, label = 'title') {
  return rows.map((row) => ({ id: row.id, label: row[label] || row.fullName || row.reference || row.id }))
}

export default function WebsiteHomepage() {
  const editor = useSingletonEditor('cmsHomepage')
  const [expanded, setExpanded] = useState(null)
  const [errors, setErrors] = useState({})
  const packages = useCollection('packages', { pageSize: 0 })
  const destinations = useCollection('destinations', { pageSize: 0 })
  const activities = useCollection('activities', { pageSize: 0 })
  const departures = useCollection('fixedDepartures', { pageSize: 0 })
  const guides = useCollection('guides', { pageSize: 0 })
  const reviews = useCollection('reviews', { pageSize: 0 })
  const travelUpdates = useCollection('travelUpdates', { pageSize: 0 })
  const posts = useCollection('blogPosts', { pageSize: 0 })
  const certificates = useCollection('certificates', { pageSize: 0 })
  const recordsStatus = [packages, destinations, activities, departures, guides, reviews, travelUpdates, posts, certificates].some((collection) => collection.status === 'error') ? 'error' : [packages, destinations, activities, departures, guides, reviews, travelUpdates, posts, certificates].some((collection) => collection.status === 'loading') ? 'loading' : 'ready'

  const records = useMemo(() => ({
    packages: optionsFrom(packages.items),
    destinations: optionsFrom(destinations.items),
    activities: optionsFrom(activities.items),
    fixedDepartures: optionsFrom(departures.items, 'reference'),
    guides: optionsFrom(guides.items, 'fullName'),
    reviews: optionsFrom(reviews.items),
    travelUpdates: optionsFrom(travelUpdates.items),
    certificates: optionsFrom(certificates.items),
    blogHighlights: [...optionsFrom(posts.items), ...optionsFrom(travelUpdates.items)],
  }), [activities.items, certificates.items, departures.items, destinations.items, guides.items, packages.items, posts.items, reviews.items, travelUpdates.items])

  if (editor.status === 'loading' || !editor.draft) return <LoadingState rows={9} label="Loading homepage builder" />
  if (editor.status === 'error') return <ErrorState title="Could not load the homepage" description={editor.error || 'Please try again.'} action={<button type="button" onClick={editor.reload} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white">Try again</button>} />
  if (recordsStatus === 'loading') return <LoadingState rows={9} label="Loading homepage content choices" />
  if (recordsStatus === 'error') return <ErrorState title="Could not load homepage content choices" description="Try again to reload the catalogue records used in homepage sections." action={<button type="button" onClick={() => { packages.reload(); destinations.reload(); activities.reload(); departures.reload(); guides.reload(); reviews.reload(); travelUpdates.reload(); posts.reload(); certificates.reload() }} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white">Try again</button>} />

  const sections = [...editor.draft.sections].sort((left, right) => left.order - right.order)

  function updateHero(field, value) {
    editor.setDraft((current) => ({ ...current, hero: { ...current.hero, [field]: value } }))
    setErrors((current) => ({ ...current, [field]: null }))
  }

  function updateQuickExplore(field, value) {
    editor.setDraft((current) => ({ ...current, quickExplore: { ...current.quickExplore, [field]: value } }))
  }

  function updateSection(key, changes) {
    editor.setDraft((current) => ({ ...current, sections: current.sections.map((section) => section.key === key ? { ...section, ...changes } : section) }))
  }

  function moveSection(key, delta) {
    const index = sections.findIndex((section) => section.key === key)
    const destination = index + delta
    if (destination < 0 || destination >= sections.length) return
    const current = sections[index]
    const adjacent = sections[destination]
    updateSection(current.key, { order: adjacent.order })
    updateSection(adjacent.key, { order: current.order })
  }

  async function saveHomepage() {
    const nextErrors = {}
    const hero = editor.draft.hero || {}
    if (!hero.headline?.trim()) nextErrors.headline = 'A hero headline is required.'
    if (!hero.subheadline?.trim()) nextErrors.subheadline = 'A hero supporting sentence is required.'
    if (!hero.primaryCtaLabel?.trim() || !hero.primaryCtaLink?.trim()) nextErrors.primaryCta = 'The primary action needs both a label and a link.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return false
    }
    return editor.save('Homepage saved.')
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Homepage" description="Shape the public homepage. Saved changes appear the next time a visitor opens the site." />
      <WebsiteNav />

      <nav aria-label="Homepage editor sections" className="sticky top-2 z-20 overflow-x-auto border border-stone-200 bg-white p-2 shadow-sm">
        <ul className="flex min-w-max gap-1">
          {[['homepage-hero', 'Hero'], ['homepage-explore', 'Quick explore'], ['homepage-sections', 'Sections']].map(([id, label]) => <li key={id}><a href={`#${id}`} className="inline-flex min-h-11 items-center rounded-md px-3 py-2 text-small font-semibold text-primary-800 hover:bg-primary-50">{label}</a></li>)}
        </ul>
      </nav>

      {Object.keys(errors).length > 0 && <div role="alert" className="rounded-lg border border-danger-500 bg-danger-50 p-4 text-small text-danger-900"><p className="font-semibold">Check the hero before saving.</p><ul className="mt-2 list-disc space-y-1 pl-5">{Object.entries(errors).map(([field, message]) => <li key={field}>{field === 'primaryCta' ? 'Primary action' : field}: {message}</li>)}</ul></div>}

      <section id="homepage-hero" className="scroll-mt-28 border border-stone-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-h4 font-sans text-stone-900">Hero</h2><span className="text-small text-stone-500">Public first impression</span></div>
        <div className="grid gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Headline" value={editor.draft.hero.headline || ''} error={errors.headline} onChange={(event) => updateHero('headline', event.target.value)} className="sm:col-span-2" />
            <FormField label="Subheadline" as="textarea" rows={4} value={editor.draft.hero.subheadline || ''} error={errors.subheadline} onChange={(event) => updateHero('subheadline', event.target.value)} className="sm:col-span-2" />
            <AdminImageField label="Hero image URL" value={editor.draft.hero.backgroundImage || ''} onChange={(value) => updateHero('backgroundImage', value)} alt={editor.draft.hero.imageAlt || ''} onAltChange={(value) => updateHero('imageAlt', value)} focalPosition={editor.draft.hero.focalPosition || '60% 50%'} onFocalPositionChange={(value) => updateHero('focalPosition', value)} previewAlt={editor.draft.hero.headline || 'Hero preview'} ratio="hero" className="sm:col-span-2" />
            <FormField label="Primary CTA label" value={editor.draft.hero.primaryCtaLabel || ''} error={errors.primaryCta} onChange={(event) => updateHero('primaryCtaLabel', event.target.value)} />
            <FormField label="Primary CTA link" value={editor.draft.hero.primaryCtaLink || ''} error={errors.primaryCta} onChange={(event) => updateHero('primaryCtaLink', event.target.value)} />
            <FormField label="Secondary CTA label" value={editor.draft.hero.secondaryCtaLabel || ''} onChange={(event) => updateHero('secondaryCtaLabel', event.target.value)} />
            <FormField label="Secondary CTA link" value={editor.draft.hero.secondaryCtaLink || ''} onChange={(event) => updateHero('secondaryCtaLink', event.target.value)} />
          </div>
        </div>
      </section>

      <section id="homepage-explore" className="scroll-mt-28 border border-stone-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-h4 font-sans text-stone-900">Quick explore</h2><span className="text-small text-stone-500">Guided trip discovery</span></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Heading" value={editor.draft.quickExplore?.heading || ''} onChange={(event) => updateQuickExplore('heading', event.target.value)} />
          <FormField label="Result action label" value={editor.draft.quickExplore?.ctaLabel || ''} onChange={(event) => updateQuickExplore('ctaLabel', event.target.value)} />
          <FormField label="Supporting text" as="textarea" rows={3} value={editor.draft.quickExplore?.subtext || ''} onChange={(event) => updateQuickExplore('subtext', event.target.value)} className="sm:col-span-2" />
          <FormField label="Browse helper text" value={editor.draft.quickExplore?.browsePrompt || ''} onChange={(event) => updateQuickExplore('browsePrompt', event.target.value)} />
          <FormField label="Browse link label" value={editor.draft.quickExplore?.browseLabel || ''} onChange={(event) => updateQuickExplore('browseLabel', event.target.value)} />
          <FormField label="Browse link" value={editor.draft.quickExplore?.browseLink || ''} onChange={(event) => updateQuickExplore('browseLink', event.target.value)} className="sm:col-span-2" />
        </div>
      </section>

      <section id="homepage-sections" aria-label="Homepage sections" className="scroll-mt-28 border-y border-stone-200">
        <div className="flex items-center justify-between gap-4 px-1 py-4"><h2 className="text-h4 font-sans text-stone-900">Sections</h2><span className="text-small text-stone-500">{sections.length} sections</span></div>
        <div className="divide-y divide-stone-200 bg-white">
          {sections.map((section, index) => {
            const isOpen = expanded === section.key
            const source = SOURCE_FOR_SECTION[section.key]
            const options = section.key === 'blogHighlights' ? records.blogHighlights : source ? records[source] : []
            return (
              <article key={section.key} tabIndex={0} onKeyDown={(event) => {
                if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
                event.preventDefault()
                moveSection(section.key, event.key === 'ArrowUp' ? -1 : 1)
              }} className="px-5 py-4 outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-inset">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3"><h3 className="truncate font-sans text-body font-semibold text-stone-900">{section.heading}</h3><span className={`text-small font-semibold ${section.visible ? 'text-success-800' : 'text-stone-500'}`}>{section.visible ? 'Visible' : 'Hidden'}</span></div>
                    <p className="mt-1 text-small text-stone-600">{section.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 text-small font-semibold text-stone-700"><input type="checkbox" checked={Boolean(section.visible)} onChange={(event) => updateSection(section.key, { visible: event.target.checked })} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />Show</label>
                    <ReorderControls label={section.heading} index={index} total={sections.length} onMove={(delta) => moveSection(section.key, delta)} />
                    <button type="button" onClick={() => setExpanded(isOpen ? null : section.key)} aria-expanded={isOpen} className="rounded-md border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">{isOpen ? 'Close' : 'Edit'}</button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-5 grid gap-4 border-t border-stone-200 pt-5 sm:grid-cols-2">
                    <FormField label="Heading" value={section.heading || ''} onChange={(event) => updateSection(section.key, { heading: event.target.value })} />
                    <FormField label="CTA label" value={section.ctaLabel || ''} onChange={(event) => updateSection(section.key, { ctaLabel: event.target.value })} />
                    <FormField label="Subtext" as="textarea" rows={4} value={section.subtext || ''} onChange={(event) => updateSection(section.key, { subtext: event.target.value })} className="sm:col-span-2" />
                    <FormField label="CTA link" value={section.ctaLink || ''} onChange={(event) => updateSection(section.key, { ctaLink: event.target.value })} className="sm:col-span-2" />
                    {options.length > 0 && <div className="sm:col-span-2"><RelationshipChecklist label="Featured items" options={options} value={section.itemIds || []} onChange={(itemIds) => updateSection(section.key, { itemIds })} /></div>}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <AdminSaveBar editor={editor} onSave={saveHomepage} saveLabel="Save homepage" previewPath="/" previewEnabled={!editor.dirty} />
    </div>
  )
}
