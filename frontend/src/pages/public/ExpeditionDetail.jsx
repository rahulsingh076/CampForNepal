// An expedition, shown by the shared trip page with expedition breadcrumbs.
import PackageDetail from './PackageDetail.jsx'

export default function ExpeditionDetail() {
  return <PackageDetail context={{ label: 'Expeditions', path: '/expeditions' }} />
}
