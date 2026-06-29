/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Trash2, Plus, Save, FileText, Wrench } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function ServiceJobPage() {
  const { t, language } = useLanguage()
  const [serviceItems, setServiceItems] = useState<any[]>([])
  const [saleRows, setSaleRows] = useState<any[]>(() => [
    { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0 }
  ])
  
  const [customer, setCustomer] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [deviceModel, setDeviceModel] = useState("")
  const [problemDesc, setProblemDesc] = useState("")
  const [remarks, setRemarks] = useState("")
  
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState<number | null>(null)

  async function fetchServices() {
    try {
      const res = await fetch("/api/items?type=service")
      const data = await res.json()
      setTimeout(() => setServiceItems(data), 0)
    } catch {
      toast.error("Failed to fetch service list")
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleRowChange = (id: number, field: string, value: any) => {
    setSaleRows(prev => prev.map(row => {
      if (row.id === id) {
        const newRow = { ...row, [field]: value }
        
        if (field === 'itemId' && value) {
          const selectedItem = serviceItems.find(i => i.id === parseInt(value))
          if (selectedItem) {
            newRow.rate = Number(selectedItem.price) || 0
          }
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
      { id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0 }
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
    if (!deviceModel) {
      return toast.error("Device Brand & Model is required")
    }

    const validRows = saleRows.filter(r => r.itemId && r.quantity > 0)
    if (validRows.length === 0) {
      return toast.error("Please select at least one service type")
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
          items: validRows,
          isServiceJob: true,
          deviceModel,
          problemDesc,
          serviceStatus: "pending"
        })
      })

      if (!res.ok) throw new Error("Failed to save service job")
      
      const result = await res.json()
      toast.success("Service job saved successfully!")
      setGeneratedInvoiceId(result.invoice.id)
      
    } catch {
      toast.error("Error saving service job")
      setIsSubmitting(false)
    }
  }

  const startNewJob = () => {
    setGeneratedInvoiceId(null)
    setCustomer("")
    setCustomerPhone("")
    setCustomerAddress("")
    setDeviceModel("")
    setProblemDesc("")
    setRemarks("")
    setDiscount(0)
    setTax(0)
    setSaleRows([{ id: Date.now(), itemId: "", quantity: 1, unit: "pcs", rate: 0, total: 0 }])
    setIsSubmitting(false)
    fetchServices()
  }

  if (generatedInvoiceId) {
    return (
      <div className="card flex items-center justify-center flex-col gap-6" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        <div style={{ background: 'var(--success)', color: 'white', padding: 'var(--space-4)', borderRadius: '50%' }}>
          <Save size={48} />
        </div>
        <h2>Service Job Saved!</h2>
        <p className="text-muted">Job ticket and invoice generated successfully.</p>
        
        <div className="sale-success-actions" style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <button 
            className="btn btn-primary" 
            onClick={() => window.open(`/invoices/${generatedInvoiceId}`, '_blank')}
          >
            <FileText size={18} /> {t('viewPrint') || "Print Invoice"}
          </button>
          <button className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }} onClick={startNewJob}>
            <Plus size={18} /> Add New Job
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <form onSubmit={handleSubmit}>
        
        {/* Customer & Device Details Card */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={20} color="var(--primary)" />
            {language === 'bn' ? "কাস্টমার ও ডিভাইস বিবরণী" : "Customer & Device Details"}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label className="form-label">{t('customerName')} *</label>
              <input 
                className="input-field" 
                value={customer} 
                onChange={(e) => setCustomer(e.target.value)} 
                placeholder="e.g. Rahim Uddin"
                required 
              />
            </div>
            <div>
              <label className="form-label">{t('phoneNumber')}</label>
              <input 
                className="input-field" 
                value={customerPhone} 
                placeholder="017xxxxxxxx"
                onChange={(e) => setCustomerPhone(e.target.value)} 
              />
            </div>
            <div>
              <label className="form-label">{language === 'bn' ? "ডিভাইস মডেল (ব্র্যান্ড সহ) *" : "Device Brand & Model *"}</label>
              <input 
                className="input-field" 
                value={deviceModel} 
                onChange={(e) => setDeviceModel(e.target.value)} 
                placeholder="e.g. HP Pavilion 15 / iPhone 12"
                required 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">{language === 'bn' ? "সমস্যার বিবরণ *" : "Problem Description *"}</label>
              <input 
                className="input-field" 
                value={problemDesc} 
                onChange={(e) => setProblemDesc(e.target.value)} 
                placeholder="e.g. Keyboard not working / Charging port damage / OS Install"
                required 
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">{t('address')}</label>
              <input 
                className="input-field" 
                value={customerAddress} 
                placeholder="Customer Address"
                onChange={(e) => setCustomerAddress(e.target.value)} 
              />
            </div>
          </div>
        </div>

        {/* Billing Card */}
        <div className="card">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <h3>{language === 'bn' ? "সার্ভিস চার্জ ও বিল" : "Service Charges & Billing"}</h3>
            <button type="button" onClick={addRow} className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
              <Plus size={16} /> Add Charge Item
            </button>
          </div>

          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>{language === 'bn' ? "সার্ভিস টাইপ" : "Service Type"}</th>
                  <th style={{ width: '100px' }}>{t('qty')}</th>
                  <th style={{ width: '150px' }}>{t('rate')} (৳)</th>
                  <th style={{ width: '150px' }}>{t('total')} (৳)</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {saleRows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Service Type">
                      <select 
                        className="input-field" 
                        value={row.itemId}
                        onChange={(e) => handleRowChange(row.id, 'itemId', e.target.value)}
                        required
                      >
                        <option value="">{language === 'bn' ? "সার্ভিস সিলেক্ট করুন" : "Select Service Type"}</option>
                        {serviceItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} (Rate: ৳{item.price})
                          </option>
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
                placeholder="Additional notes about repair/diagnosis..."
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
                {isSubmitting ? t('processing') : <><Save size={18} /> Complete & Save Job</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
