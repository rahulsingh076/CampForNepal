import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import LinkListEditor from '../../components/admin/LinkListEditor.jsx'
import ReorderControls from '../../components/admin/ReorderControls.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import FormField from '../../components/common/FormField.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import useSingletonEditor from '../../hooks/useSingletonEditor.js'

function normalize(items) {
  return items.map((item, index) => ({ ...item, visible: item.visible !== false, order: item.order || index + 1, children: item.children || [] }))
}

export default function WebsiteMenu() {
  const editor = useSingletonEditor('menu')
  if (editor.status === 'loading' || !editor.draft) return <LoadingState rows={7} label="Loading navigation" />
  if (editor.status === 'error') return <ErrorState title="Could not load the menu" description={editor.error} action={<button type="button" onClick={editor.reload} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white">Try again</button>} />

  const menu = normalize(editor.draft.mainMenu || []).sort((left, right) => left.order - right.order)

  function saveMenu(next) {
    editor.setDraft((current) => ({ ...current, mainMenu: next.map((item, index) => ({ ...item, order: index + 1 })) }))
  }

  function change(index, changes) {
    saveMenu(menu.map((item, current) => current === index ? { ...item, ...changes } : item))
  }

  function move(index, delta) {
    const destination = index + delta
    if (destination < 0 || destination >= menu.length) return
    const next = [...menu]
    ;[next[index], next[destination]] = [next[destination], next[index]]
    saveMenu(next)
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Header menu" description="Choose the public navigation labels, destinations, order, visibility, and one level of child links." actions={<button type="button" onClick={() => editor.save('Navigation saved.')} disabled={!editor.dirty || editor.busy} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60">{editor.busy ? 'Saving...' : 'Save menu'}</button>} />
      <WebsiteNav />
      <div className="space-y-4">
        {menu.map((item, index) => (
          <article key={`${item.path}-${index}`} className="border border-stone-200 bg-white p-5" onKeyDown={(event) => {
            if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return
            event.preventDefault()
            move(index, event.key === 'ArrowUp' ? -1 : 1)
          }}>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr),minmax(0,1fr),auto] sm:items-end">
              <FormField label="Label" value={item.label} onChange={(event) => change(index, { label: event.target.value })} />
              <FormField label="Link" value={item.path} onChange={(event) => change(index, { path: event.target.value })} />
              <div className="flex items-center gap-3 sm:pb-1"><label className="inline-flex items-center gap-2 text-small font-semibold text-stone-700"><input type="checkbox" checked={item.visible} onChange={(event) => change(index, { visible: event.target.checked })} className="h-4 w-4 rounded border-stone-400 text-primary-700 focus:ring-primary-600" />Visible</label><ReorderControls label={item.label || `menu item ${index + 1}`} index={index} total={menu.length} onMove={(delta) => move(index, delta)} /><button type="button" onClick={() => saveMenu(menu.filter((_, current) => current !== index))} className="rounded-md px-2 py-1 text-small font-semibold text-danger-700 hover:bg-danger-50">Remove</button></div>
            </div>
            <div className="mt-5 border-t border-stone-200 pt-5"><LinkListEditor label="Child links" value={item.children} onChange={(children) => change(index, { children })} /></div>
          </article>
        ))}
      </div>
      <button type="button" onClick={() => saveMenu([...menu, { label: 'New menu item', path: '/', visible: true, children: [] }])} className="rounded-lg border border-stone-300 px-4 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Add menu item</button>
    </div>
  )
}
