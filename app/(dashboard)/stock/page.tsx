"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Package, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface StockItem {
  id: number
  name: string
  stockIn: number
  stockOut: number
  balance: number
}

export default function StockPage() {
  const { t } = useLanguage()
  const [stockData, setStockData] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchStock() {
    try {
      const res = await fetch("/api/stock")
      const data = await res.json()
      setStockData(data)
    } catch {
      toast.error("Failed to fetch stock data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStock()
  }, [])

  const totalItems = stockData.length
  const inStockCount = stockData.filter(item => item.balance > 5).length
  const lowStockCount = stockData.filter(item => item.balance > 0 && item.balance <= 5).length
  const outOfStockCount = stockData.filter(item => item.balance <= 0).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
        
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-1)' }}>{t('totalItems')}</p>
            <h3 style={{ fontSize: '1.5rem' }}>{totalItems}</h3>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'var(--surface-hover)', borderRadius: '50%', color: 'var(--text-main)' }}>
            <Package size={24} />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-1)' }}>{t('inStock')}</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{inStockCount}</h3>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-1)' }}>{t('lowStock')} (≤5)</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>{lowStockCount}</h3>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', color: 'var(--warning)' }}>
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="card flex items-center justify-between">
          <div>
            <p className="text-muted" style={{ marginBottom: 'var(--space-1)' }}>{t('outOfStock')}</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--error)' }}>{outOfStockCount}</h3>
          </div>
          <div style={{ padding: 'var(--space-3)', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: 'var(--error)' }}>
            <XCircle size={24} />
          </div>
        </div>

      </div>

      {/* Stock Table */}
      <div className="card">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('stockLedgerOverview')}</h3>
        
        {stockData.length === 0 ? (
          <p className="text-muted">No stock data available.</p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th>{t('id')}</th>
                  <th>{t('itemName')}</th>
                  <th>{t('stockIn')}</th>
                  <th>{t('stockOut')}</th>
                  <th style={{ textAlign: 'right' }}>{t('balance')}</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map((item) => {
                  let badgeStyle = {}
                  let badgeText = ""
                  
                  if (item.balance > 5) {
                    badgeStyle = { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }
                    badgeText = t('inStock')
                  } else if (item.balance > 0) {
                    badgeStyle = { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }
                    badgeText = t('lowStock')
                  } else {
                    badgeStyle = { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }
                    badgeText = t('outOfStock')
                  }

                  return (
                    <tr key={item.id}>
                      <td data-label={t('id')}>#{item.id}</td>
                      <td data-label={t('itemName')} style={{ fontWeight: 500 }}>{item.name}</td>
                      <td data-label={t('stockIn')}>{item.stockIn}</td>
                      <td data-label={t('stockOut')}>{item.stockOut}</td>
                      <td data-label={t('balance')} style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                          <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>{item.balance}</span>
                          <span style={{ 
                            padding: 'var(--space-1) var(--space-2)', 
                            borderRadius: 'var(--radius-xl)', 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            ...badgeStyle 
                          }}>
                            {badgeText}
                          </span>
                        </div>
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
