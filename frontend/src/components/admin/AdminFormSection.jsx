// A quiet divider for long operational forms; it avoids turning each section into a card.
export default function AdminFormSection({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-stone-200 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-5">
        <h3 className="text-h4 font-sans text-stone-900">{title}</h3>
        {description && <p className="mt-1 text-small text-stone-600">{description}</p>}
      </div>
      {children}
    </section>
  )
}
