"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Trash2, Plus, Save } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function PurchasePage() {
  const { t } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [purchaseRows, setPurchaseRows] = useState<any[]>([
    { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0 }
  ])
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    }
  }

  const handleRowChange = (id: number, field: string, value: any) => {
    setPurchaseRows(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        
        if (field === 'itemId' && value) {
          const selectedItem = items.find(i => i.id === parseInt(value))
          if (selectedItem) {
            newRow.rate = Number(selectedItem.cost)
          }
        }
        
        if (field === 'quantity' || field === 'rate' || field === 'itemId') {
          const qty = field === 'quantity' ? value : newRow.quantity
          const rate = field === 'rate' ? value : newRow.rate
          newRow.total = qty * rate
        }
        
        return newRow
      }
      return row
    }))
  }

  const addRow = () => {
    setPurchaseRows([
      ...purchaseRows,
      { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0 }
    ])
  }

  const removeRow = (id: number) => {
    if (purchaseRows.length === 1) return
    setPurchaseRows(purchaseRows.filter(row => row.id !== id))
  }

  const grandTotal = purchaseRows.reduce((sum, row) => sum + row.total, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validRows = purchaseRows.filter(r => r.itemId && r.quantity > 0)
    if (validRows.length === 0) {
      return toast.error("Please add at least one valid item")
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remarks,
          items: validRows
        })
      })

      if (!res.ok) throw new Error("Failed to save purchase")
      
      toast.success("Purchase saved successfully!")
      
      setPurchaseRows([{ id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0 }])
      setRemarks("")
    } catch (error) {
      toast.error("Error saving purchase")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <div className="card">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h3>{t('newPurchase')}</h3>
          <button type="button" onClick={addRow} className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
            <Plus size={16} /> {t('addRow')}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>{t('items')}</th>
                  <th style={{ width: '100px' }}>{t('qty')}</th>
                  <th style={{ width: '100px' }}>Unit</th>
                  <th style={{ width: '150px' }}>{t('rate')} (৳)</th>
                  <th style={{ width: '150px' }}>{t('total')} (৳)</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {purchaseRows.map((row) => (
                  <tr key={row.id}>
                    <td data-label={t('items')}>
                      <select 
                        className="input-field" 
                        value={row.itemId}
                        onChange={(e) => handleRowChange(row.id, 'itemId', e.target.value)}
                        required
                      >
                        <option value="">{t('selectItem')}</option>
                        {items.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </td>
                    <td data-label={t('qty')}>
                      <input 
                        type="number" 
                        className="input-field" 
                        min="1"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(row.id, 'quantity', Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        required
                      />
                    </td>
                    <td data-label="Unit">
                      <input 
                        type="text" 
                        className="input-field" 
                        value={row.unit}
                        onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                        onFocus={(e) => e.target.select()}
                      />
                    </td>
                    <td data-label={`${t('rate')} (৳)`}>
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-field" 
                        value={row.rate}
                        onChange={(e) => handleRowChange(row.id, 'rate', Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        required
                      />
                    </td>
                    <td data-label={`${t('total')} (৳)`}>
                      <div className="input-field" style={{ backgroundColor: 'var(--surface-hover)', fontWeight: 500 }}>
                        {row.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="action-cell">
                      <button 
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={purchaseRows.length === 1}
                        style={{ padding: 'var(--space-2)', color: purchaseRows.length === 1 ? 'var(--text-muted)' : 'var(--error)', background: 'transparent', border: 'none', cursor: purchaseRows.length === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals-grid">
            <div>
              <label className="form-label">{t('remarks')} ({t('optional')})</label>
              <textarea 
                className="input-field" 
                rows={3} 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
                <span>{t('grandTotal')}:</span>
                <span style={{ color: 'var(--primary)' }}>৳ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ width: '100%', padding: 'var(--space-4)' }}>
                {isSubmitting ? t('processing') : <><Save size={18} /> {t('save')}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
