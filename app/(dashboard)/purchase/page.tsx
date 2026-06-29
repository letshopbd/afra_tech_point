"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { Trash2, Plus, Save } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function PurchasePage() {
  const { t, language } = useLanguage()
  const [items, setItems] = useState<any[]>([])
  const [purchaseRows, setPurchaseRows] = useState<any[]>(() => [
    { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, price: 0, total: 0 }
  ])
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [barcodeInput, setBarcodeInput] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const barcodeBuffer = useRef("")
  const scanTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const itemsRef = useRef(items)
  itemsRef.current = items

  async function fetchItems() {
    try {
      const res = await fetch("/api/items?type=product")
      const data = await res.json()
      setTimeout(() => setItems(data), 0)
    } catch {
      toast.error("Failed to fetch items")
    }
  }

  useEffect(() => {
    fetchItems()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Poll 3rd party scanner app input
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const appRes = await fetch("/api/scan/pending")
        if (appRes.ok) {
          const appData = await appRes.json()
          if (appData.barcodes && appData.barcodes.length > 0) {
            appData.barcodes.forEach((code: string) => {
              triggerBarcodeMatch(code.trim())
            })
          }
        }
      } catch {}
    }, 1200)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const triggerBarcodeMatch = useCallback((code: string) => {
    if (!code) return
    const cleanedCode = code.trim()
    const matchedItem = itemsRef.current.find(item => item.barcode === cleanedCode)
    if (!matchedItem) {
      toast.error("No item found with this barcode")
      setBarcodeInput("")
      return
    }

    setPurchaseRows(prev => {
      const existingRowIdx = prev.findIndex(row => row.itemId === String(matchedItem.id))
      if (existingRowIdx > -1) {
        const updated = [...prev]
        updated[existingRowIdx].quantity += 1
        updated[existingRowIdx].total = updated[existingRowIdx].quantity * updated[existingRowIdx].rate
        return updated
      } else {
        const newRow = {
          id: Date.now(),
          itemId: String(matchedItem.id),
          quantity: 1,
          unit: "pcs",
          rate: Number(matchedItem.cost) || 0,
          price: Number(matchedItem.price) || 0,
          total: Number(matchedItem.cost) || 0
        }

        if (prev.length === 1 && prev[0].itemId === "") {
          return [newRow]
        }
        return [...prev, newRow]
      }
    })

    toast.success(`Added ${matchedItem.name}`)
    setBarcodeInput("")
  }, [t])

  // Global barcode scanner listener — auto-adds item on scan
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === "Enter") {
        const buf = barcodeBuffer.current
        barcodeBuffer.current = ""
        if (buf.length >= 3) {
          e.preventDefault()
          e.stopPropagation()
          const el = document.activeElement as HTMLInputElement | null
          if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
            const nativeSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, "value"
            )?.set
            nativeSetter?.call(el, "")
            el.dispatchEvent(new Event("input", { bubbles: true }))
          }
          triggerBarcodeMatch(buf)
        }
        return
      }

      if (e.key && e.key.length === 1) {
        clearTimeout(scanTimer.current)
        scanTimer.current = setTimeout(() => { barcodeBuffer.current = "" }, 50)
        barcodeBuffer.current += e.key
      }
    }

    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
      clearTimeout(scanTimer.current)
    }
  }, [triggerBarcodeMatch])



  const handleRowChange = (id: number, field: string, value: any) => {
    setPurchaseRows(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        
        if (field === 'itemId' && value) {
          const selectedItem = items.find(i => i.id === parseInt(value))
          if (selectedItem) {
            newRow.rate = Number(selectedItem.cost)
            newRow.price = Number(selectedItem.price) || 0
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
      { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, price: 0, total: 0 }
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
      
      setPurchaseRows([{ id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, price: 0, total: 0 }])
      setRemarks("")
    } catch {
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

        {/* Barcode scan box */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', maxWidth: '600px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input 
              ref={barcodeInputRef}
              type="text"
              placeholder={language === 'bn' ? "বারকোড স্ক্যান করুন..." : "Scan Barcode..."}
              className="input-field"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  triggerBarcodeMatch(barcodeInput)
                }
              }}
            />
          </div>
          <button 
            type="button" 
            onClick={() => triggerBarcodeMatch(barcodeInput)}
            className="btn btn-primary"
            style={{ padding: '8px 16px' }}
          >
            Add
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
                  <th style={{ width: '150px' }}>Sale Price (৳)</th>
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
                    <td data-label="Sale Price (৳)">
                      <input 
                        type="number" 
                        step="0.01"
                        className="input-field" 
                        value={row.price || ""}
                        onChange={(e) => handleRowChange(row.id, 'price', Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        placeholder="0.00"
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
