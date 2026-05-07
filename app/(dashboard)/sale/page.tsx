"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Trash2, Plus, Save, FileText } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function SalePage() {
  const { t } = useLanguage()
  const [stockItems, setStockItems] = useState<any[]>([])
  const [saleRows, setSaleRows] = useState<any[]>([
    { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0, imeiNumber: "", maxStock: 0 }
  ])
  
  const [customer, setCustomer] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<number | null>(null)

  useEffect(() => {
    fetchStock()
  }, [])

  const fetchStock = async () => {
    try {
      const res = await fetch("/api/stock")
      const data = await res.json()
      setStockItems(data.filter((item: any) => item.balance > 0))
    } catch (error) {
      toast.error("Failed to fetch stock")
    }
  }

  const handleRowChange = (id: number, field: string, value: any) => {
    setSaleRows(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        
        if (field === 'itemId' && value) {
          const selectedItem = stockItems.find(i => i.id === parseInt(value))
          if (selectedItem) {
            newRow.maxStock = selectedItem.balance
            newRow.rate = Number(selectedItem.cost) || 0
            if (newRow.quantity > selectedItem.balance) {
              newRow.quantity = selectedItem.balance
            }
          }
        }
        
        if (field === 'quantity' && newRow.maxStock > 0 && value > newRow.maxStock) {
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
      { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0, imeiNumber: "", maxStock: 0 }
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
                            {item.name} ({t('availableStock')}: {item.balance})
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
