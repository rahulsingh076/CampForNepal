// A trek, shown by the shared trip page with trekking breadcrumbs.
import PackageDetail from './PackageDetail.jsx'

export default function TrekkingDetail() {
  return <PackageDetail context={{ label: 'Trekking', path: '/trekking' }} />
}
