import { useState } from 'react'
import { X, Plus, Pencil, Trash2, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ConfirmDialog } from './ConfirmDialog'

export function ListSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lists, activeListId, switchList, createList, renameList, deleteList } = useApp()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/45 z-[55] flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-surface-dark rounded-t-2xl sm:rounded-2xl w-full max-w-[440px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border dark:border-border-dark">
          <h3 className="font-display font-bold text-base text-ink dark:text-ink-dark">Ro'yxatlar</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface dark:bg-black/20 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2">
          {lists.map(list => {
            const isActive = list.id === activeListId
            const isEditing = editingId === list.id
            return (
              <div
                key={list.id}
                className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${
                  isActive ? 'border-primary bg-primary-light dark:bg-primary/15' : 'border-border dark:border-border-dark'
                }`}
              >
                <button
                  onClick={() => {
                    switchList(list.id)
                    onClose()
                  }}
                  className="flex-1 min-w-0 text-left"
                >
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          renameList(list.id, editValue)
                          setEditingId(null)
                        }
                      }}
                      onBlur={() => {
                        renameList(list.id, editValue)
                        setEditingId(null)
                      }}
                      className="w-full bg-white dark:bg-surface-dark border border-primary rounded-lg px-2 py-1 text-sm font-semibold outline-none"
                    />
                  ) : (
                    <>
                      <div className="font-semibold text-sm text-ink dark:text-ink-dark truncate flex items-center gap-1.5">
                        {isActive && <Check size={14} className="text-primary shrink-0" />}
                        {list.name}
                      </div>
                      <div className="text-[11px] text-muted mt-0.5">
                        {list.items.reduce((s, i) => s + i.qty, 0)} ta mahsulot · {new Date(list.createdAt).toLocaleDateString('uz-UZ')}
                      </div>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditingId(list.id)
                    setEditValue(list.name)
                  }}
                  className="w-8 h-8 rounded-lg border border-border dark:border-border-dark flex items-center justify-center text-muted shrink-0"
                >
                  <Pencil size={13} />
                </button>
                {lists.length > 1 && (
                  <button
                    onClick={() => setDeleteTarget(list.id)}
                    className="w-8 h-8 rounded-lg border border-border dark:border-border-dark flex items-center justify-center text-danger shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-5 border-t border-border dark:border-border-dark flex gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Yangi ro'yxat nomi (masalan: Bo'lim 2)"
            onKeyDown={e => {
              if (e.key === 'Enter' && newName.trim()) {
                createList(newName.trim())
                setNewName('')
                onClose()
              }
            }}
            className="flex-1 bg-surface dark:bg-black/20 border border-border dark:border-border-dark rounded-xl px-3.5 py-2.5 text-sm outline-none"
          />
          <button
            onClick={() => {
              createList(newName.trim() || undefined)
              setNewName('')
              onClose()
            }}
            className="bg-primary text-white rounded-xl px-4 flex items-center gap-1.5 font-semibold text-sm"
          >
            <Plus size={16} /> Qo'shish
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        emoji="🗑"
        title="Ro'yxatni o'chirish"
        message="Bu ro'yxat va undagi barcha scanlar butunlay o'chiriladi."
        confirmLabel="O'chirish"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteList(deleteTarget)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}
