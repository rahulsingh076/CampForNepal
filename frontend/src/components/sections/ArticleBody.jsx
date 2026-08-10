// Long-form body copy. The measure, rhythm and hierarchy here are the whole
// point: an article should be comfortable to read for ten minutes.
export default function ArticleBody({ content, sections }) {
  return (
    <div className="readable-text">
      {content
        ?.split('\n\n')
        .filter(Boolean)
        .map((paragraph, index) => (
          <p
            key={paragraph.slice(0, 48)}
            // The opening paragraph is set a step larger, which is what makes a
            // page feel edited rather than dumped.
            className={
              index === 0
                ? 'text-h4 font-normal leading-relaxed text-stone-800'
                : 'mt-6 text-body text-stone-700'
            }
          >
            {paragraph}
          </p>
        ))}

      {sections?.map((section) => (
        <section key={section.heading} className="mt-12">
          <h2 className="text-h3 font-display text-stone-900">{section.heading}</h2>
          {section.body
            .split('\n\n')
            .filter(Boolean)
            .map((paragraph) => (
              <p key={paragraph.slice(0, 48)} className="mt-4 text-body text-stone-700">
                {paragraph}
              </p>
            ))}
        </section>
      ))}
    </div>
  )
}
