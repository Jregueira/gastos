import { useRef, useState } from 'react'
import { db } from '../db/db'
import { useCategories } from '../hooks/useCategories'
import { usePeople } from '../hooks/usePeople'

export default function Settings() {
  const people = usePeople()
  const categories = useCategories(true)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [exportMessage, setExportMessage] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function renamePerson(id: string, name: string) {
    if (!name.trim()) return
    await db.people.update(id, { name: name.trim() })
  }

  async function addCategory() {
    const name = newCategoryName.trim()
    if (!name) return
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.order), -1)
    await db.categories.add({
      id: crypto.randomUUID(),
      name,
      isDefault: false,
      order: maxOrder + 1,
      archived: false,
    })
    setNewCategoryName('')
  }

  async function toggleArchived(id: string, archived: boolean) {
    await db.categories.update(id, { archived: !archived })
  }

  async function renameCategory(id: string, name: string) {
    if (!name.trim()) return
    await db.categories.update(id, { name: name.trim() })
  }

  async function handleExport() {
    const [expenses, settlements, cats, ppl, settings] = await Promise.all([
      db.expenses.toArray(),
      db.settlements.toArray(),
      db.categories.toArray(),
      db.people.toArray(),
      db.settings.toArray(),
    ])
    const backup = { exportedAt: new Date().toISOString(), people: ppl, categories: cats, expenses, settlements, settings }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gastos-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportMessage('Backup downloaded.')
  }

  async function handleImportFile(file: File) {
    setImportMessage('')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.people || !data.categories || !data.expenses) {
        throw new Error('Not a valid backup file.')
      }
      if (!confirm('This will replace all current data with the backup. Continue?')) return
      await db.transaction(
        'rw',
        [db.people, db.categories, db.expenses, db.settlements, db.settings],
        async () => {
          await Promise.all([
            db.people.clear(),
            db.categories.clear(),
            db.expenses.clear(),
            db.settlements.clear(),
            db.settings.clear(),
          ])
          await db.people.bulkAdd(data.people)
          await db.categories.bulkAdd(data.categories)
          await db.expenses.bulkAdd(data.expenses)
          await db.settlements.bulkAdd(data.settlements ?? [])
          await db.settings.bulkAdd(data.settings ?? [{ key: 'onboarded', value: true }])
        },
      )
      setImportMessage('Backup restored.')
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Import failed.')
    }
  }

  return (
    <div className="px-5 py-6">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Names</h2>
        <div className="mt-2 flex flex-col gap-2">
          {people.map((p) => (
            <input
              key={p.id}
              defaultValue={p.name}
              onBlur={(e) => renamePerson(p.id, e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-base focus:border-indigo-500 focus:outline-none"
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Categories</h2>
        <div className="mt-2 flex flex-col gap-2">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                defaultValue={c.name}
                onBlur={(e) => renameCategory(c.id, e.target.value)}
                className={`flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${
                  c.archived ? 'text-slate-400' : ''
                }`}
              />
              <button
                onClick={() => toggleArchived(c.id, c.archived)}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600"
              >
                {c.archived ? 'Unhide' : 'Hide'}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="New category"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={addCategory}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Add
          </button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Backup</h2>
        <p className="mt-1 text-xs text-slate-500">
          iOS may clear on-device data after ~7 days of not opening the app. Export a backup
          occasionally, or import one to restore.
        </p>
        <div className="mt-2 flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 rounded-xl border border-indigo-600 py-2.5 text-sm font-semibold text-indigo-700"
          >
            Export backup
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700"
          >
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImportFile(file)
              e.target.value = ''
            }}
          />
        </div>
        {exportMessage && <p className="mt-1 text-xs text-emerald-600">{exportMessage}</p>}
        {importMessage && <p className="mt-1 text-xs text-emerald-600">{importMessage}</p>}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Sync</h2>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Sync across devices</p>
            <p className="text-xs text-slate-400">Coming soon — Phase 3</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-400">
            Off
          </span>
        </div>
      </section>
    </div>
  )
}
