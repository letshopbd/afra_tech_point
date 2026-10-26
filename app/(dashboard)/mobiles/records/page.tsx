"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Printer, Trash2, Search } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface MobilePhone {
  id: number
  brand: string
  model: string
  color?: string | null
  imei1: string
  imei2?: string | null
}

interface MobileSale {
  id: number
  invoiceNumber: string
  customer: string
  customerPhone?: string | null
  salePrice: number
  discountAmount: number
  totalAmount: number
  saleDate: string
  createdAt: string
  mobile: MobilePhone
}

export default function MobileRecordsPage() {
  const { t, language } = useLanguage()
  const [sales, setSales] = useState<MobileSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  async function fetchSales() {
    try {
      const res = await fetch("/api/mobiles/sale")
      const data = await res.json()
      setSales(data)
    } catch {
      toast.error(language === 'bn' ? "ডেটা লোড করতে সমস্যা হয়েছে" : "Failed to load records")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (sale: MobileSale) => {
    const confirmMsg = language === 'bn'
      ? `ইনভয়েস ${sale.invoiceNumber} ডিলিট করতে চান? এটি মোবাইলটিকে আবার "উপলব্ধ" করবে।`
      : `Delete invoice ${sale.invoiceNumber}? This will revert the phone to "available".`
    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/mobiles/sale/${sale.id}`, { method: "DELETE" })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || (language === 'bn' ? "ডিলিট করা যায়নি" : "Failed to delete"))
        return
      }

      toast.success(language === 'bn' ? "রেকর্ড ডিলিট হয়েছে" : "Sale record deleted")
      fetchSales()
    } catch {
      toast.error(language === 'bn' ? "সমস্যা হয়েছে" : "An error occurred")
    }
  }

  const filteredSales = sales.filter(s => {
    const q = searchQuery.toLowerCase()
    return (
      s.customer.toLowerCase().includes(q) ||
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.mobile.imei1.toLowerCase().includes(q) ||
      (s.mobile.imei2 && s.mobile.imei2.toLowerCase().includes(q)) ||
      s.mobile.brand.toLowerCase().includes(q) ||
      s.mobile.model.toLowerCase().includes(q)
    )
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 style={{ margin: 0 }}>{t('mobileRecords')}</h3>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '32px' }}
              placeholder={language === 'bn' ? "ক্রেতা, ইনভয়েস বা IMEI দিয়ে খুঁজুন..." : "Search customer, invoice or IMEI..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('loading')}</p>
        ) : filteredSales.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            {searchQuery
              ? (language === 'bn' ? "কোনো ফলাফল পাওয়া যায়নি" : "No results found")
              : (language === 'bn' ? "কোনো বিক্রয় রেকর্ড নেই" : "No sale records found")
            }
          </p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>{t('invoiceNumber')}</th>
                  <th>{t('date')}</th>
                  <th>{t('customer')}</th>
                  <th>{language === 'bn' ? "মোবাইল" : "Phone"}</th>
                  <th>{t('color')}</th>
                  <th>{t('imei1')}</th>
                  <th>{t('saleRate')}</th>
                  <th>{t('discount')}</th>
                  <th>{t('grandTotal')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(sale => (
                  <tr key={sale.id}>
                    <td data-label={t('invoiceNumber')}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem' }}>
                        {sale.invoiceNumber}
                      </span>
                    </td>
                    <td data-label={t('date')}>
                      {new Date(sale.saleDate || sale.createdAt).toLocaleDateString()}
                    </td>
                    <td data-label={t('customer')}>
                      <div style={{ fontWeight: 500 }}>{sale.customer}</div>
                      {sale.customerPhone && (
                        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{sale.customerPhone}</div>
                      )}
                    </td>
                    <td data-label={language === 'bn' ? "মোবাইল" : "Phone"}>
                      <div style={{ fontWeight: 500 }}>{sale.mobile.brand}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{sale.mobile.model}</div>
                    </td>
                    <td data-label={t('color')}>{sale.mobile.color || <span className="text-muted">—</span>}</td>
                    <td data-label={t('imei1')}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{sale.mobile.imei1}</span>
                    </td>
                    <td data-label={t('saleRate')}>৳{Number(sale.salePrice).toLocaleString()}</td>
                    <td data-label={t('discount')}>
                      {Number(sale.discountAmount) > 0
                        ? <span style={{ color: 'var(--error)' }}>-৳{Number(sale.discountAmount).toLocaleString()}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td data-label={t('grandTotal')}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>৳{Number(sale.totalAmount).toLocaleString()}</span>
                    </td>
                    <td className="action-cell" data-label={t('actions')}>
                      <button
                        onClick={() => window.open(`/mobiles/invoice/${sale.id}`, '_blank')}
                        style={{ padding: 'var(--space-2)', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title={t('print')}
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(sale)}
                        style={{ padding: 'var(--space-2)', color: 'var(--error)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title={t('delete')}
                      >
                        <Trash2 size={16} />
                      </button>
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
