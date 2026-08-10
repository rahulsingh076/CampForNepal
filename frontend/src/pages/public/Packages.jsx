// Every trip we run, filtered and sorted.
import PageHeader from '../../components/common/PageHeader.jsx'
import PackageList from '../../components/sections/PackageList.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'

const TITLE = 'All trips'
const DESCRIPTION =
  'Every itinerary we run in Nepal, from four-day heritage tours to a full Everest expedition. Filter by where you want to go, how long you have, and what you want to spend.'

export default function Packages() {
  usePageMeta(TITLE, DESCRIPTION)

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />
      <PackageList />
    </>
  )
}
