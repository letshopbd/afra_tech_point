"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Search, Printer, Trash2 } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function InvoicesPage() {
  const { t } = useLanguage()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  async function fetchInvoices() {
    try {
      const res = await fetch("/api/invoices")
      const data = await res.json()
      if (Array.isArray(data)) {
        setInvoices(data)
      } else {
        setInvoices([])
        toast.error(data.error || "Failed to fetch invoices")
      }
    } catch {
      toast.error("Failed to fetch invoices")
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvoices()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this invoice? This will remove the sale record and revert stock levels.")) return

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Failed to delete")
        return
      }
      toast.success("Invoice deleted")
      fetchInvoices()
    } catch (error) {
      toast.error((error as Error).message || "Error deleting invoice")
    }
  }

  const filteredInvoices = Array.isArray(invoices) ? invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : []

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      <div className="card">
        <div className="invoice-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h3>{t('invoices')}</h3>
          
          <div className="invoice-search-bar" style={{ position: 'relative', width: '300px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Search size={18} />
            </div>
            <input 
              className="input-field" 
              style={{ paddingLeft: '40px' }} 
              placeholder={t('search') || "Search..."} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted">{t('loading')}</p>
        ) : filteredInvoices.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>No invoices found.</p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('invoiceNumber')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('totalAmount')}</th>
                  <th>{t('date')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td data-label="ID">#{invoice.id}</td>
                    <td data-label={t('invoiceNumber')} style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</td>
                    <td data-label={t('customer')}>{invoice.customerName || "Walk-in Customer"}</td>
                    <td data-label={t('totalAmount')} style={{ fontWeight: 600, color: 'var(--primary)' }}>৳ {Number(invoice.totalAmount).toLocaleString()}</td>
                    <td data-label={t('date')}>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                    <td className="action-cell">
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => window.open(`/invoices/${invoice.id}`, '_blank')}
                          style={{ padding: 'var(--space-2)', color: 'var(--secondary)', background: 'transparent', border: 'none' }}
                          title={t('viewPrint')}
                        >
                          <Printer size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(invoice.id)}
                          style={{ padding: 'var(--space-2)', color: 'var(--error)', background: 'transparent', border: 'none' }}
                          title={t('delete')}
                        >
                          <Trash2 size={18} />
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
