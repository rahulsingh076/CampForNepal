import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import WebsiteNav from '../../components/admin/WebsiteNav.jsx'
import { CertificateForm } from '../../components/admin/website/WebsiteCollectionForms.jsx'
import { formatDate } from '../../lib/formatters.js'

const columns = [
  { key: 'title', label: 'Certificate', sortable: true, searchValue: (row) => [row.title, row.issuer], render: (row) => <div><p className="font-semibold text-stone-900">{row.title}</p><p className="mt-0.5 text-stone-600">{row.issuer}</p></div> },
  { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
  { key: 'displayOrder', label: 'Order', sortable: true },
  { key: 'expiryDate', label: 'Valid until', sortable: true, render: (row) => row.expiryDate ? formatDate(row.expiryDate) : 'No expiry' },
]

export default function WebsiteCertificates() {
  return <AdminCrudPage entity="certificates" title="Certificates" description="Create and publish the licences, memberships, and insurance records visitors can verify." columns={columns} Form={CertificateForm} createLabel="Add certificate" headerChildren={<WebsiteNav />} emptyState={{ title: 'No certificates yet', description: 'Add the first credential for the public site.' }} />
}
