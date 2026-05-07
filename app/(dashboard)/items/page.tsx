"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Edit2, Trash2 } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function ItemsPage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/items")
      const data = await res.json()
      setItems(data)
    } catch (error) {
      toast.error("Failed to fetch items")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const url = editingId ? `/api/items/${editingId}` : "/api/items"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to save item")
      
      toast.success(editingId ? "Item updated!" : "Item added!")
      resetForm()
      fetchItems()
    } catch (error) {
      toast.error("Error saving item")
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setValue("name", item.name)
    setValue("cost", item.cost)
    setValue("description", item.description)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return

    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      
      toast.success("Item deleted")
      fetchItems()
    } catch (error) {
      toast.error("Error deleting item")
    }
  }

  const resetForm = () => {
    setEditingId(null)
    reset({ name: "", cost: "", description: "" })
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Add/Edit Form */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>{editingId ? t('editItem') : t('addNewItem')}</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', alignItems: 'end' }}>
          <div>
            <label className="form-label">{t('itemName')} *</label>
            <input 
              {...register("name", { required: true })} 
              className="input-field" 
              placeholder="e.g. iPhone 15 Pro Max" 
            />
          </div>
          <div>
            <label className="form-label">{t('purchaseRate')} (৳)</label>
            <input 
              type="number" 
              step="0.01"
              {...register("cost")} 
              className="input-field" 
              placeholder="0.00" 
              onFocus={(e) => e.target.select()}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">{t('description')} ({t('optional')})</label>
            <textarea 
              {...register("description")} 
              className="input-field" 
              rows={2} 
              placeholder="Additional details..."
            />
          </div>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 'var(--space-3)' }}>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? t('processing') : editingId ? t('updateItem') : t('saveItem')}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                {t('cancel')}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Items List */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('itemsList')}</h3>
        
        {loading ? (
          <p className="text-muted">{t('loadingItems')}</p>
        ) : items.length === 0 ? (
          <p className="text-muted">{t('noItemsFound')}</p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('itemName')}</th>
                  <th>{t('purchaseRate')}</th>
                  <th>{t('description')}</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="ID">#{item.id}</td>
                    <td data-label={t('itemName')} style={{ fontWeight: 500 }}>{item.name}</td>
                    <td data-label={t('purchaseRate')}>৳ {Number(item.cost).toLocaleString()}</td>
                    <td data-label={t('description')} className="text-muted">{item.description || "-"}</td>
                    <td className="action-cell">
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleEdit(item)}
                          style={{ padding: 'var(--space-2)', color: 'var(--secondary)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                          title={t('edit')}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          style={{ padding: 'var(--space-2)', color: 'var(--error)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                          title={t('delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
