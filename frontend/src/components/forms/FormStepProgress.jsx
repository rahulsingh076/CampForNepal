// Compact, accessible progress for the custom-trip request.
export default function FormStepProgress({ steps, currentStep }) {
  return (
    <ol aria-label="Custom trip request progress" className="grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const current = index === currentStep
        const complete = index < currentStep

        return (
          <li key={step.title} aria-current={current ? 'step' : undefined} className="min-w-0">
            <span className={`block h-1 rounded-full ${complete || current ? 'bg-primary-700' : 'bg-stone-200'}`} />
            <span className={`mt-2 block text-small ${current ? 'font-semibold text-primary-800' : 'text-stone-600'}`}>
              {index + 1}. {step.shortLabel}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
