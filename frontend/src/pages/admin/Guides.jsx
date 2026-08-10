import AdminCrudPage from '../../components/admin/AdminCrudPage.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { GuideForm } from '../../components/admin/catalog/CatalogForms.jsx'

export default function Guides() {
  const columns = [
    { key: 'fullName', label: 'Guide', sortable: true, searchValue: (row) => [row.fullName, row.guideType, row.languages, row.regions], render: (row) => <div><p className="font-semibold text-stone-900">{row.fullName}</p><p className="mt-0.5 text-stone-600">{row.guideType}</p></div> },
    { key: 'experienceYears', label: 'Experience', sortable: true, render: (row) => `${row.experienceYears} years` },
    { key: 'verificationStatus', label: 'Verification', sortable: true, render: (row) => <StatusBadge status={row.verificationStatus} /> },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} label={row.status === 'published' ? 'active' : row.status} /> },
  ]

  return <AdminCrudPage entity="guides" title="Guides" description="Public guide profiles, verification, and operational availability. Document fields are reserved for Version 2." columns={columns} Form={GuideForm} createLabel="Add guide" emptyState={{ title: 'No guides yet', description: 'Create the first public guide profile.' }} />
}
