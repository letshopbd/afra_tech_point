"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Trash2, ShoppingCart, Tag } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function ManageRecordsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<"purchases" | "sales">("purchases")
  
  const [purchases, setPurchases] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [purchasesRes, salesRes] = await Promise.all([
        fetch("/api/purchases"),
        fetch("/api/sales")
      ])
      
      const purchasesData = await purchasesRes.json()
      const salesData = await salesRes.json()
      
      setPurchases(purchasesData)
      setSales(salesData)
    } catch (error) {
      toast.error("Failed to fetch records")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, type: "purchase" | "sale") => {
    if (!confirm(`Are you sure you want to delete this ${type}? This will also revert stock changes.`)) return

    try {
      const res = await fetch(`/api/${type}s/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`)
      fetchData()
    } catch (error) {
      toast.error(`Error deleting ${type}`)
    }
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Custom Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border)', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab("purchases")}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: activeTab === "purchases" ? 'var(--surface)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === "purchases" ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === "purchases" ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            whiteSpace: 'nowrap'
          }}
        >
          <ShoppingCart size={18} /> {t('purchaseRecords')}
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          style={{
            padding: 'var(--space-3) var(--space-6)',
            background: activeTab === "sales" ? 'var(--surface)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === "sales" ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === "sales" ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            whiteSpace: 'nowrap'
          }}
        >
          <Tag size={18} /> {t('saleRecords')}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="text-muted">{t('loading')}</p>
        ) : activeTab === "purchases" ? (
          /* Purchases Table */
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>{t('purchaseId')}</th>
                  <th>{t('date')}</th>
                  <th>{t('itemsIncluded')}</th>
                  <th>{t('totalAmount')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan={5} className="text-muted" style={{ textAlign: 'center' }}>No records found.</td></tr>
                ) : purchases.map((purchase) => {
                  const totalAmount = purchase.items.reduce((sum: number, item: any) => sum + Number(item.total), 0)
                  return (
                    <tr key={purchase.id}>
                      <td data-label={t('purchaseId')}>#{purchase.id}</td>
                      <td data-label={t('date')}>{new Date(purchase.createdAt).toLocaleDateString()}</td>
                      <td data-label={t('itemsIncluded')}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: '0.875rem' }}>
                          {purchase.items.map((pi: any, idx: number) => (
                            <span key={idx}>• {pi.item.name} ({pi.quantity} {pi.unit})</span>
                          ))}
                        </div>
                      </td>
                      <td data-label={t('totalAmount')} style={{ fontWeight: 600 }}>৳ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="action-cell">
                        <button 
                          onClick={() => handleDelete(purchase.id, "purchase")}
                          style={{ padding: 'var(--space-2)', color: 'var(--error)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                          title={t('delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Sales Table */
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>{t('saleIdInvoice')}</th>
                  <th>{t('date')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('itemsIncluded')}</th>
                  <th>{t('grandTotal')}</th>
                  <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr><td colSpan={6} className="text-muted" style={{ textAlign: 'center' }}>No records found.</td></tr>
                ) : sales.map((sale) => {
                  return (
                    <tr key={sale.id}>
                      <td data-label={t('saleIdInvoice')}>
                        #{sale.id}
                        {sale.invoice && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sale.invoice.invoiceNumber}</div>}
                      </td>
                      <td data-label={t('date')}>{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td data-label={t('customer')}>{sale.customer}</td>
                      <td data-label={t('itemsIncluded')}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', fontSize: '0.875rem' }}>
                          {sale.items.map((si: any, idx: number) => (
                            <span key={idx}>• {si.item.name} ({si.quantity} {si.unit})</span>
                          ))}
                        </div>
                      </td>
                      <td data-label={t('grandTotal')} style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        ৳ {sale.invoice ? Number(sale.invoice.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : sale.items.reduce((sum: number, item: any) => sum + Number(item.total), 0).toLocaleString()}
                      </td>
                      <td className="action-cell">
                        <button 
                          onClick={() => handleDelete(sale.id, "sale")}
                          style={{ padding: 'var(--space-2)', color: 'var(--error)', background: 'transparent', border: 'none', borderRadius: 'var(--radius-sm)' }}
                          title={t('delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
