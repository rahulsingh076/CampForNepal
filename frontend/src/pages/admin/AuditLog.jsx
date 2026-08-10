import { useMemo, useState } from 'react'
import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import FormField from '../../components/common/FormField.jsx'
import useCollection from '../../hooks/useCollection.js'
import { formatDate } from '../../lib/formatters.js'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

export default function AuditLog() {
  const auditLogs = useCollection('auditLogs', { sort: 'timestamp', direction: 'desc', pageSize: 0 })
  const [filters, setFilters] = useState({ action: '', entity: '', user: '', date: '' })
  const columns = [
    { key: 'action', label: 'Action', sortable: true, render: (row) => <StatusBadge status={row.action} variant={row.action === 'delete' ? 'danger' : row.action === 'create' ? 'success' : 'info'} /> },
    { key: 'entityLabel', label: 'Record', sortable: true, render: (row) => <div><p className="font-semibold text-stone-900">{row.entityLabel || row.entityId || 'Record'}</p><p className="mt-0.5 text-stone-600">{row.entity}</p></div> },
    { key: 'userName', label: 'By', sortable: true },
    { key: 'timestamp', label: 'When', sortable: true, render: (row) => <span title={row.timestamp}>{formatDate(row.timestamp, { short: true })}</span> },
    { key: 'summary', label: 'Summary', render: (row) => <span className="line-clamp-2 max-w-md">{row.summary}</span> },
  ]

  const rows = useMemo(() => auditLogs.items.filter((row) =>
    (!filters.action || row.action === filters.action) &&
    (!filters.entity || row.entity === filters.entity) &&
    (!filters.user || row.userName === filters.user) &&
    (!filters.date || String(row.timestamp || '').slice(0, 10) === filters.date)
  ), [auditLogs.items, filters])
  const entities = [...new Set(auditLogs.items.map((row) => row.entity).filter(Boolean))].sort()
  const users = [...new Set(auditLogs.items.map((row) => row.userName).filter(Boolean))].sort()
  const update = (field, value) => setFilters((current) => ({ ...current, [field]: value }))

  return <div className="space-y-6"><AdminPageHeader title="Audit log" description="Read-only history of every create, update, and delete written by the local demo data client." />{auditLogs.status === 'loading' ? <LoadingState label="Loading audit log" rows={8} /> : auditLogs.status === 'error' ? <ErrorState title="We could not load the audit log" description="Try again to refresh the history." action={<button type="button" onClick={auditLogs.reload} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Try again</button>} /> : <><section className="grid gap-3 border border-stone-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"><FormField label="Action" as="select" options={[{ value: '', label: 'Every action' }, ...['create', 'update', 'delete'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))]} value={filters.action} onChange={(event) => update('action', event.target.value)} /><FormField label="Entity" as="select" options={[{ value: '', label: 'Every record type' }, ...entities.map((value) => ({ value, label: value }))]} value={filters.entity} onChange={(event) => update('entity', event.target.value)} /><FormField label="User" as="select" options={[{ value: '', label: 'Every user' }, ...users.map((value) => ({ value, label: value }))]} value={filters.user} onChange={(event) => update('user', event.target.value)} /><FormField label="Date" type="date" value={filters.date} onChange={(event) => update('date', event.target.value)} /></section><AdminDataTable columns={columns} rows={rows} searchPlaceholder="Search audit log" emptyState={{ title: 'No audit entries match', description: 'Clear a filter or search for another record.' }} /></>}</div>
}
