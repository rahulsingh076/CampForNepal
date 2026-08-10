// Shown while the homepage CMS content is still arriving.
import Container from '../../components/common/Container.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

export default function HomeSkeleton() {
  return (
    <>
      <div className="bg-primary-900 py-24 sm:py-32" aria-hidden="true">
        <Container>
          <div className="h-14 w-3/4 max-w-2xl animate-pulse rounded-lg bg-primary-800" />
          <div className="mt-6 h-5 w-2/3 max-w-xl animate-pulse rounded-lg bg-primary-800" />
          <div className="mt-10 h-14 w-48 animate-pulse rounded-lg bg-primary-800" />
        </Container>
      </div>

      <div className="py-16 sm:py-24">
        <Container>
          <LoadingState rows={8} label="Loading the homepage" />
        </Container>
      </div>
    </>
  )
}
