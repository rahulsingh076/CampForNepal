import { useState } from 'react'
import AdminDataTable from '../../components/admin/AdminDataTable.jsx'
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx'
import ModalForm from '../../components/admin/ModalForm.jsx'
import StatusBadge from '../../components/admin/StatusBadge.jsx'
import { useToast } from '../../components/admin/Toast.jsx'
import FormField from '../../components/common/FormField.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import useCollection from '../../hooks/useCollection.js'
import { updateItem } from '../../lib/dataClient.js'
import ErrorState from '../../components/common/ErrorState.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'guide', label: 'Guide' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

function roleLabel(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role
}

export default function Users() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const users = useCollection('users', { pageSize: 0 })
  const [editor, setEditor] = useState(null)
  const [role, setRole] = useState('customer')
  const [busy, setBusy] = useState(false)

  async function change(account, changes, message) {
    setBusy(true)
    const result = await updateItem('users', account.id, changes, user)
    setBusy(false)
    if (!result.success) return showToast(result.message || 'Could not update this account.', 'error')
    users.reload()
    showToast(message)
  }

  function beginRoleChange(account) {
    if (account.id === user.id) return
    setRole(account.role)
    setEditor(account)
  }

  async function saveRole(event) {
    event.preventDefault()
    if (!editor || editor.id === user.id) return
    await change(editor, { role }, 'Role updated.')
    setEditor(null)
  }

  const columns = [
    { key: 'fullName', label: 'User', sortable: true, searchValue: (row) => [row.fullName, row.email], render: (row) => <div><p className="font-semibold text-stone-900">{row.fullName}{row.id === user.id ? ' (you)' : ''}</p><p className="mt-0.5 text-stone-600">{row.email}</p></div> },
    { key: 'role', label: 'Role', sortable: true, render: (row) => roleLabel(row.role) },
    { key: 'status', label: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'country', label: 'Country', sortable: true },
  ]

  function actions(row) {
    const protectedAccount = row.id === user.id
    return [
      { label: protectedAccount ? 'Role protected' : 'Change role', disabled: protectedAccount, onClick: () => beginRoleChange(row) },
      row.status === 'active'
        ? { label: protectedAccount ? 'Cannot suspend self' : 'Suspend', tone: 'danger', disabled: protectedAccount, onClick: () => change(row, { status: 'suspended' }, 'Account suspended.') }
        : { label: 'Activate', onClick: () => change(row, { status: 'active' }, 'Account activated.') },
    ]
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Users and roles" description="Manage the optional customer dashboard accounts and the two team roles. Your own super-admin role and account status are protected." />
      {users.status === 'loading' ? <LoadingState label="Loading users" rows={8} /> : users.status === 'error' ? <ErrorState title="We could not load users" description="Try again to refresh the account directory." action={<button type="button" onClick={users.reload} className="rounded-lg border border-stone-300 px-3 py-2 text-small font-semibold text-primary-800 hover:border-primary-600">Try again</button>} /> : <AdminDataTable columns={columns} rows={users.items} rowActions={actions} searchPlaceholder="Search users" emptyState={{ title: 'No users found', description: 'Accounts appear here as soon as they are created.' }} />}
      <ModalForm open={Boolean(editor)} onClose={() => !busy && setEditor(null)} onSubmit={saveRole} title={`Change role for ${editor?.fullName || ''}`} submitLabel="Save role" busy={busy} dirty={Boolean(editor && role !== editor.role)}><FormField label="Role" as="select" options={ROLE_OPTIONS} value={role} onChange={(event) => setRole(event.target.value)} /></ModalForm>
    </div>
  )
}
