// Compact heading treatment for work-focused admin screens.
export default function AdminPageHeader({ title, description, actions, children }) {
  return (
    <header className="flex flex-col gap-4 border-b border-stone-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-h2 font-sans text-stone-900">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body text-stone-600">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
