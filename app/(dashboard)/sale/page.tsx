"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { Trash2, Plus, Save, FileText } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

// Local-time date input value (avoid UTC toISOString off-by-one)
function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function SalePage() {
  const { t, language } = useLanguage()
  const [stockItems, setStockItems] = useState<any[]>([])
  const [saleRows, setSaleRows] = useState<any[]>(() => [
    { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0, imeiNumber: "", maxStock: 0, isService: false }
  ])
  
  const [saleDate, setSaleDate] = useState(() => toDateInput(new Date()))
  const [customer, setCustomer] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<number | null>(null)

  const [barcodeInput, setBarcodeInput] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const barcodeBuffer = useRef("")
  const scanTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const stockItemsRef = useRef(stockItems)
  stockItemsRef.current = stockItems

  async function fetchStock() {
    try {
      const res = await fetch("/api/items")
      const data = await res.json()
      // Show products with stock > 0 and all services (which don't track stock but are sellable)
      const filtered = data.filter((item: any) => item.itemType === 'service' || item.stock > 0)
      setTimeout(() => setStockItems(filtered), 0)
    } catch {
      toast.error("Failed to fetch stock items")
    }
  }

  useEffect(() => {
    fetchStock()
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
  }, [stockItems])

  const triggerBarcodeMatch = useCallback((code: string) => {
    if (!code) return
    const cleanedCode = code.trim()
    const matchedItem = stockItemsRef.current.find(item => item.barcode === cleanedCode)
    if (!matchedItem) {
      toast.error("No item found with this barcode")
      setBarcodeInput("")
      return
    }

    setSaleRows(prev => {
      const existingRowIdx = prev.findIndex(row => row.itemId === String(matchedItem.id))
      if (existingRowIdx > -1) {
        const updated = [...prev]
        const isService = matchedItem.itemType === 'service'
        const maxStock = isService ? 999999 : matchedItem.stock
        
        if (!isService && updated[existingRowIdx].quantity >= maxStock) {
          toast.error(`${t('availableStock')}: ${maxStock}`)
          return prev
        }
        
        updated[existingRowIdx].quantity += 1
        updated[existingRowIdx].total = updated[existingRowIdx].quantity * updated[existingRowIdx].rate
        return updated
      } else {
        const isService = matchedItem.itemType === 'service'
        const newRow = {
          id: Date.now(),
          itemId: String(matchedItem.id),
          quantity: 1,
          unit: "pcs",
          rate: Number(matchedItem.price) || 0,
          total: Number(matchedItem.price) || 0,
          imeiNumber: "",
          maxStock: isService ? 999999 : matchedItem.stock,
          isService
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

  // Global barcode scanner listener — auto-adds item on scan in sale page
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
    setSaleRows(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        
        if (field === 'itemId' && value) {
          const selectedItem = stockItems.find(i => i.id === parseInt(value))
          if (selectedItem) {
            const isService = selectedItem.itemType === 'service'
            newRow.isService = isService
            newRow.maxStock = isService ? 999999 : selectedItem.stock
            newRow.rate = Number(selectedItem.price) || 0 // Auto-fill retail price
            if (!isService && newRow.quantity > selectedItem.stock) {
              newRow.quantity = selectedItem.stock
            }
          }
        }
        
        if (field === 'quantity' && !newRow.isService && newRow.maxStock > 0 && value > newRow.maxStock) {
          toast.error(`${t('availableStock')}: ${newRow.maxStock}`)
          newRow.quantity = newRow.maxStock
        }
        
        if (field === 'quantity' || field === 'rate' || field === 'itemId') {
          newRow.total = newRow.quantity * newRow.rate
        }
        
        return newRow
      }
      return row
    }))
  }

  const addRow = () => {
    setSaleRows([
      ...saleRows,
      { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0, imeiNumber: "", maxStock: 0, isService: false }
    ])
  }

  const removeRow = (id: number) => {
    if (saleRows.length === 1) return
    setSaleRows(saleRows.filter(row => row.id !== id))
  }

  const subtotal = saleRows.reduce((sum, row) => sum + row.total, 0)
  const grandTotal = subtotal + Number(tax) - Number(discount)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customer) {
      return toast.error("Customer name is required")
    }

    const validRows = saleRows.filter(r => r.itemId && r.quantity > 0)
    if (validRows.length === 0) {
      return toast.error("Please add at least one valid item")
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          customerPhone,
          customerAddress,
          remarks,
          discountAmount: discount,
          taxAmount: tax,
          saleDate,
          items: validRows
        })
      })

      if (!res.ok) throw new Error("Failed to save sale")
      
      const result = await res.json()
      toast.success(t('saleSaved'))
      setGeneratedInvoiceId(result.invoice.id)
      
    } catch (error) {
      toast.error("Error saving sale")
      setIsSubmitting(false)
    }
  }

  const startNewSale = () => {
    setGeneratedInvoiceId(null)
    setSaleDate(toDateInput(new Date()))
    setCustomer("")
    setCustomerPhone("")
    setCustomerAddress("")
    setRemarks("")
    setDiscount(0)
    setTax(0)
    setSaleRows([{ id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0, imeiNumber: "", maxStock: 0 }])
    setIsSubmitting(false)
    fetchStock()
  }

  if (generatedInvoiceId) {
    return (
      <div className="card flex items-center justify-center flex-col gap-6" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <div style={{ background: 'var(--success)', color: 'white', padding: 'var(--space-4)', borderRadius: '50%' }}>
          <Save size={48} />
        </div>
        <h2>{t('saleSaved')}</h2>
        <p className="text-muted">Invoice generated.</p>
        
        <div className="sale-success-actions" style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => window.open(`/invoices/${generatedInvoiceId}`, '_blank')}
          >
            <FileText size={18} /> {t('viewPrint')}
          </button>
          <button className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }} onClick={startNewSale}>
            <Plus size={18} /> {t('startNew')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <form onSubmit={handleSubmit}>
        {/* Customer Details Card */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('customerDetails')}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label className="form-label">{t('saleDate')} *</label>
              <input 
                type="date" 
                className="input-field" 
                value={saleDate} 
                onChange={(e) => setSaleDate(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="form-label">{t('customerName')} *</label>
              <input 
                className="input-field" 
                value={customer} 
                onChange={(e) => setCustomer(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label className="form-label">{t('phoneNumber')}</label>
              <input 
                className="input-field" 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">{t('address')}</label>
              <input 
                className="input-field" 
                value={customerAddress} 
                onChange={(e) => setCustomerAddress(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Items Card */}
        <div className="card">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h3>{t('saleItems')}</h3>
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

          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>{t('items')} ({t('availableStock')})</th>
                  <th style={{ width: '180px' }}>{t('imeiSerial')}</th>
                  <th style={{ width: '100px' }}>{t('qty')}</th>
                  <th style={{ width: '150px' }}>{t('rate')} (৳)</th>
                  <th style={{ width: '150px' }}>{t('total')} (৳)</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {saleRows.map((row) => (
                  <tr key={row.id}>
                    <td data-label={t('items')}>
                      <select 
                        className="input-field" 
                        value={row.itemId}
                        onChange={(e) => handleRowChange(row.id, 'itemId', e.target.value)}
                        required
                      >
                        <option value="">{t('selectItem')}</option>
                        {stockItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({t('availableStock')}: {item.stock || 0})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td data-label={t('imeiSerial')}>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={row.imeiNumber}
                        onChange={(e) => handleRowChange(row.id, 'imeiNumber', e.target.value)}
                        placeholder={t('imeiSerial')}
                        onFocus={(e) => e.target.select()}
                      />
                    </td>
                    <td data-label={t('qty')}>
                      <input 
                        type="number" 
                        className="input-field" 
                        min="1"
                        max={row.maxStock > 0 ? row.maxStock : undefined}
                        value={row.quantity}
                        onChange={(e) => handleRowChange(row.id, 'quantity', Number(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        required
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
                        disabled={saleRows.length === 1}
                        style={{ padding: 'var(--space-2)', color: saleRows.length === 1 ? 'var(--text-muted)' : 'var(--error)', background: 'transparent', border: 'none', cursor: saleRows.length === 1 ? 'not-allowed' : 'pointer' }}
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
              <label className="form-label">{t('remarks')}</label>
              <textarea 
                className="input-field" 
                rows={4} 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="totals-panel">
              <div className="totals-panel-row">
                <span className="text-muted">{t('subtotal')}:</span>
                <span style={{ fontWeight: 500 }}>৳ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              
              <div className="totals-panel-row">
                <span className="text-muted">{t('tax')} (+):</span>
                <input 
                  type="number" 
                  step="0.01"
                  className="input-field" 
                  style={{ width: '110px', textAlign: 'right', padding: 'var(--space-1) var(--space-2)' }}
                  value={tax === 0 ? "" : tax}
                  placeholder="0.00"
                  onChange={(e) => setTax(e.target.value === "" ? 0 : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                />
              </div>

              <div className="totals-panel-row">
                <span className="text-muted">{t('discount')} (-):</span>
                <input 
                  type="number" 
                  step="0.01"
                  className="input-field" 
                  style={{ width: '110px', textAlign: 'right', padding: 'var(--space-1) var(--space-2)' }}
                  value={discount === 0 ? "" : discount}
                  placeholder="0.00"
                  onChange={(e) => setDiscount(e.target.value === "" ? 0 : Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                />
              </div>
              
              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: 'var(--space-2) 0' }}></div>

              <div className="totals-panel-row" style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                <span>{t('grandTotal')}:</span>
                <span style={{ color: 'var(--primary)' }}>৳ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)', width: '100%' }}>
                {isSubmitting ? t('processing') : <><Save size={18} /> {t('completeSale')}</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
