import { useEffect, useRef, useState } from 'react'

// Native buttons plus Escape and arrow-key movement keep this compact menu usable by keyboard.
export default function PostOverflowMenu({ post, onEdit, onPublish, onUnpublish, onArchive, onDelete }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
        return
      }
      if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return
      const items = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') || [])]
      const index = items.indexOf(document.activeElement)
      if (!items.length) return
      event.preventDefault()
      const next = event.key === 'ArrowDown'
        ? (index + 1 + items.length) % items.length
        : (index - 1 + items.length) % items.length
      items[next].focus()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function act(callback) {
    setOpen(false)
    callback()
  }

  return (
    <div ref={menuRef} className="relative">
      <button ref={buttonRef} type="button" aria-label={`Actions for ${post.title}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:border-primary-600 hover:text-primary-800">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></svg>
      </button>
      {open && (
        <div role="menu" aria-label={`Actions for ${post.title}`} className="absolute right-0 z-20 mt-2 w-40 border border-stone-200 bg-white p-1 shadow-lg">
          <button role="menuitem" type="button" onClick={() => act(onEdit)} className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-small text-stone-800 hover:bg-sand-100">Edit inline</button>
          <a role="menuitem" href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-md px-3 py-2 text-small text-stone-800 hover:bg-sand-100">Preview</a>
          {post.status === 'published' ? (
            <button role="menuitem" type="button" onClick={() => act(onUnpublish)} className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-small text-stone-800 hover:bg-sand-100">Unpublish</button>
          ) : (
            <button role="menuitem" type="button" onClick={() => act(onPublish)} className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-small text-stone-800 hover:bg-sand-100">Publish</button>
          )}
          {post.status !== 'archived' && <button role="menuitem" type="button" onClick={() => act(onArchive)} className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-small text-stone-800 hover:bg-sand-100">Archive</button>}
          <button role="menuitem" type="button" onClick={() => act(onDelete)} className="flex min-h-11 w-full items-center rounded-md px-3 py-2 text-left text-small text-danger-700 hover:bg-danger-50">Delete</button>
        </div>
      )}
    </div>
  )
}
