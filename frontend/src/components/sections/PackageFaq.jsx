// The trip's common questions, closed by default so the page stays scannable.
import Accordion from '../common/Accordion.jsx'

export default function PackageFaq({ faq }) {
  const items = faq.map((entry) => ({
    key: entry.question,
    title: entry.question,
    content: <p className="readable-text text-body text-stone-700">{entry.answer}</p>,
  }))

  return <Accordion items={items} defaultOpen={-1} openAllLabel="Open all questions" />
}
