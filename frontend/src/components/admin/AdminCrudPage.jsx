import { useState } from 'react'
import AdminDataTable from './AdminDataTable.jsx'
import AdminPageHeader from './AdminPageHeader.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { useToast } from './Toast.jsx'
import { useAuth } from '../../contexts/AuthContext.jsx'
import useCollection from '../../hooks/useCollection.js'
import { createItem, deleteItem, updateItem } from '../../lib/dataClient.js'
import LoadingState from '../common/LoadingState.jsx'

// Shared persistence, confirmation, and feedback for the catalogue modules.
export default function AdminCrudPage({
  entity,
  title,
  description,
  columns,
  Form,
  formProps,
  createLabel = 'Create',
  emptyState,
  rows,
  rowActions,
  headerChildren,
  onChanged,
}) {
  const collection = useCollection(entity, { pageSize: 0 })
  const { user } = useAuth()
  const { showToast } = useToast()
  const [editor, setEditor] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const tableRows = rows || collection.items

  async function save(values) {
    setBusy(true)
    const result = editor?.mode === 'edit'
      ? await updateItem(entity, editor.item.id, values, user)
      : await createItem(entity, values, user)
    setBusy(false)

    if (result.success) {
      collection.reload()
      onChanged?.()
      setEditor(null)
      showToast(`${result.message}. Audit log updated.`)
    } else {
      showToast(result.message || `Could not save ${title.toLowerCase()}.`, 'error')
    }
    return result
  }

  async function remove() {
    if (!pendingDelete) return
    setBusy(true)
    const result = await deleteItem(entity, pendingDelete.id, user)
    setBusy(false)
    if (result.success) {
      collection.reload()
      onChanged?.()
      setPendingDelete(null)
      showToast(`${result.message}. Audit log updated.`)
    } else {
      showToast(result.message || `Could not delete ${title.toLowerCase()}.`, 'error')
    }
  }

  function actionsForRow(row) {
    const extra = rowActions ? rowActions(row, { create: (item) => setEditor({ mode: 'create', item }), edit: () => setEditor({ mode: 'edit', item: row }) }) : []
    return [
      ...extra,
      { label: 'Edit', onClick: () => setEditor({ mode: 'edit', item: row }) },
      { label: 'Delete', tone: 'danger', onClick: () => setPendingDelete(row) },
    ]
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={description}
        actions={<button type="button" onClick={() => setEditor({ mode: 'create', item: null })} className="rounded-lg bg-primary-700 px-4 py-2 text-small font-semibold text-white hover:bg-primary-800">{createLabel}</button>}
      >
        {headerChildren}
      </AdminPageHeader>

      {collection.status === 'loading' ? (
        <LoadingState rows={8} label={`Loading ${title.toLowerCase()}`} />
      ) : collection.status === 'error' ? (
        <div className="border border-danger-200 bg-danger-50 p-5 text-danger-900">
          <p className="font-semibold">This catalogue could not be loaded.</p>
          <button type="button" onClick={collection.reload} className="mt-3 text-small font-semibold underline">Try again</button>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          rows={tableRows}
          rowActions={actionsForRow}
          emptyState={emptyState}
          searchPlaceholder={`Search ${title.toLowerCase()}`}
        />
      )}

      {editor && (
        <Form
          key={`${editor.mode}-${editor.item?.id || editor.item?.title || 'new'}`}
          open
          mode={editor.mode}
          initialItem={editor.item}
          onClose={() => setEditor(null)}
          onSave={save}
          busy={busy}
          {...formProps}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => !busy && setPendingDelete(null)}
        onConfirm={remove}
        busy={busy}
        itemName={pendingDelete?.title || pendingDelete?.fullName || pendingDelete?.reference || 'this record'}
        title={`Delete ${pendingDelete?.title || pendingDelete?.fullName || pendingDelete?.reference || 'record'}?`}
        description={`Delete ${pendingDelete?.title || pendingDelete?.fullName || pendingDelete?.reference || 'this record'} from this browser's demo data. Any public page using it updates immediately.`}
        confirmLabel={`Delete ${pendingDelete?.title || pendingDelete?.fullName || pendingDelete?.reference || 'record'}`}
      />
    </div>
  )
}
