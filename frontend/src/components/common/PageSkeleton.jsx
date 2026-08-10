// Shown while a lazily loaded page is still arriving.
import Container from './Container.jsx'
import LoadingState from './LoadingState.jsx'

export default function PageSkeleton() {
  return (
    <div className="py-16 sm:py-24">
      <Container>
        <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-sand-200" />
        <div className="mt-10">
          <LoadingState rows={6} label="Loading page" />
        </div>
      </Container>
    </div>
  )
}
