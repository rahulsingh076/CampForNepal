// The same list engine, showing climbing and expedition itineraries only.
import PageHeader from '../../components/common/PageHeader.jsx'
import PackageList from '../../components/sections/PackageList.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'

const TITLE = 'Expeditions'
const DESCRIPTION =
  'Trekking peaks and high-altitude expeditions led by climbing Sherpas, from Island Peak and Mera Peak to the south side of Everest.'

export default function Expeditions() {
  usePageMeta(TITLE, DESCRIPTION)

  return (
    <>
      <PageHeader title={TITLE} description={DESCRIPTION} />
      <PackageList type="expedition" />
    </>
  )
}
