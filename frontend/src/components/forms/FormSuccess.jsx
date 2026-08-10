// The confirmation every form shows once it has been sent.
import Button from '../common/Button.jsx'
import Card from '../common/Card.jsx'
import DemoNotice from '../common/DemoNotice.jsx'

export default function FormSuccess({ title, message, onAgain, againLabel = 'Send another', children }) {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-100 text-success-700">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M4 12.5l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <div>
          {/* The wrapper carries role="status" so the message is announced. Putting
              it on the heading would strip the heading role and break the outline. */}
          <div role="status">
            <h3 className="text-h4 font-sans text-stone-900">{title}</h3>
            <p className="readable-text mt-2 text-body text-stone-700">{message}</p>
            <DemoNotice context="formSuccess" className="mt-2" />
          </div>

          {children && <div className="mt-5">{children}</div>}

          {onAgain && (
            <div className="mt-6">
              <Button variant="secondary" onClick={onAgain}>
                {againLabel}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
