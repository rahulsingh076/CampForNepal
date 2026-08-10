// Preview scaffolding: the loading, empty, and error states every page must have.
import Button from '../../components/common/Button.jsx'
import Card from '../../components/common/Card.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

export default function FeedbackPreview() {
  return (
    <div className="space-y-8">
      <Card padding="lg">
        <h3 className="text-h4 font-display text-stone-900">Loading</h3>
        <div className="mt-6 space-y-8">
          <LoadingState rows={4} label="Loading results" />
          <LoadingState variant="inline" label="Checking availability" />
        </div>
      </Card>

      <EmptyState
        title="Nothing matches those filters"
        description="Try widening your dates or clearing a filter to see more options."
        action={<Button variant="secondary">Clear filters</Button>}
      />

      <ErrorState
        title="We could not load this"
        description="Something went wrong on our side. Your details are safe — please try again."
        action={<Button variant="secondary">Try again</Button>}
      />
    </div>
  )
}
