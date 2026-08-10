// The same list engine, showing trekking itineraries only.
import PageHeader from '../../components/common/PageHeader.jsx'
import PackageList from '../../components/sections/PackageList.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'

const TITLE = 'Trekking'
const DESCRIPTION =
  'Teahouse treks on Nepal’s classic trails — Everest Base Camp, the Annapurna Sanctuary, Langtang, Manaslu and Upper Mustang — with proper acclimatisation built in.'

export default function Trekking() {
  usePageMeta(TITLE, DESCRIPTION)

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />
      <PackageList type="trekking" />
    </>
  )
}
