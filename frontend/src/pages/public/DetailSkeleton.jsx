// Shown while a detail page's record is still loading.
import Container from '../../components/common/Container.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

export default function DetailSkeleton() {
  return (
    <>
      <div className="bg-primary-900 py-12 sm:py-16" aria-hidden="true">
        <Container>
          <div className="h-4 w-48 animate-pulse rounded bg-primary-800" />
          <div className="mt-6 h-10 w-2/3 max-w-lg animate-pulse rounded-lg bg-primary-800" />
          <div className="mt-4 h-5 w-1/2 max-w-md animate-pulse rounded-lg bg-primary-800" />
        </Container>
      </div>

      <div className="py-16 sm:py-24">
        <Container>
          <LoadingState rows={8} label="Loading page" />
        </Container>
      </div>
    </>
  )
}
