"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Search, Printer, ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function StatementPage() {
  const { t } = useLanguage()
  
  const now = new Date()
  const toDateInput = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const firstDay = toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
  const today = toDateInput(now)

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      setSettings(data)
    } catch {
      console.error("Failed to fetch settings")
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/statement?start=${startDate}&end=${endDate}`)
      const result = await res.json()
      setData(result)
    } catch {
      toast.error("Failed to generate statement")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const shiftMonth = (delta: number) => {
    const [y, m] = startDate.split('-').map(Number)
    if (!y || !m) return
    const target = new Date(y, m - 1 + delta, 1)
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0)
    const nowDate = new Date()
    const isCurrentMonth =
      target.getFullYear() === nowDate.getFullYear() &&
      target.getMonth() === nowDate.getMonth()
    setStartDate(toDateInput(target))
    setEndDate(isCurrentMonth ? toDateInput(nowDate) : toDateInput(lastDay))
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex' }}>
      
      {/* Date Range Selection */}
      <div className="card no-print">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>{t('generateStatement')}</h3>
        
        <form onSubmit={handleGenerate} className="statement-form" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">{t('startDate')}</label>
            <input 
              type="date"
              className="input-field" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">{t('endDate')}</label>
            <input 
              type="date"
              className="input-field" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
            <button type="button" onClick={() => shiftMonth(-1)} className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '0.75rem 1rem', flexShrink: 0 }} title="Previous month">
              <ChevronLeft size={18} />
            </button>
            <button type="button" onClick={() => shiftMonth(1)} className="btn" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '0.75rem 1rem', flexShrink: 0 }} title="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary full-width-mobile" style={{ padding: '0.75rem 1.5rem', flexShrink: 0 }}>
            {loading ? t('generating') : <><Search size={18} /> {t('generateStatement')}</>}
          </button>
          
          {data && (
            <button type="button" onClick={handlePrint} className="btn full-width-mobile" style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)', padding: '0.75rem 1.5rem', flexShrink: 0 }}>
              <Printer size={18} /> {t('printStatement')}
            </button>
          )}
        </form>
      </div>

      {data && (
        <>
          {/* Summary Stats (Screen Only) */}
          <div className="dashboard-grid no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
            <div className="card">
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{t('totalPurchases')}</p>
              <h3 style={{ color: 'var(--error)' }}>৳ {(data.summary.totalPurchases || 0).toLocaleString()}</h3>
            </div>
            <div className="card">
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{t('totalSales')}</p>
              <h3 style={{ color: 'var(--primary)' }}>৳ {(data.summary.totalSales || 0).toLocaleString()}</h3>
            </div>
            <div className="card">
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{t('netProfit')}</p>
              <h3 style={{ color: 'var(--success)' }}>৳ {(data.summary.netProfit || 0).toLocaleString()}</h3>
            </div>
          </div>

          {/* Statement View (Printable Wrapper) */}
          <div className="card printable-area" style={{ backgroundColor: 'white', color: '#1e293b' }}>
            
            {/* Elegant Header - ONLY PRINT */}
            <div className="only-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #334155', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <img src="/logo.png" alt="Logo" style={{ height: '48px', width: '48px', objectFit: 'contain' }} />
                <div>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{settings?.invoiceCompanyName || settings?.companyName || "Business Name"}</h1>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '400px' }}>{settings?.invoiceCompanyAddress || settings?.companyAddress}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-1)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span>Phone: {settings?.invoicePhone || settings?.adminPhone}</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('businessStatement')}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 'var(--space-1)' }}>Generated: {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Report Summary Context */}
            <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Report Period</span>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{startDate} — {endDate}</div>
              </div>
              <div className="print-summary-grid" style={{ display: 'flex', gap: 'var(--space-8)' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Net Sales</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>৳ {(data.summary?.totalSales || 0).toLocaleString()}</h3>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Net Profit</span>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>৳ {(data.summary?.netProfit || 0).toLocaleString()}</h3>
                </div>
              </div>
            </div>

            {/* Sales Section */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div className="print-section-heading" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ height: '18px', width: '3px', backgroundColor: '#0ea5e9', borderRadius: '2px' }}></div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('saleRecords')}</h3>
              </div>
              <div className="table-container">
                <table className="table statement-table print-table">
                  <thead>
                    <tr>
                      <th style={{ width: '85px' }}>{t('date')}</th>
                      <th style={{ width: '130px' }}>{t('reference')}</th>
                      <th>{t('product')}</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>{t('qty')}</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>{t('rate')}</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>{t('total')}</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-4)', color: '#94a3b8' }}>No sales records found.</td></tr>
                    ) : data.sales.map((record: any) => 
                        record.items.map((item: any, i: number) => (
                          <tr key={`${record.id}-${i}`}>
                            {i === 0 ? (
                              <>
                                <td rowSpan={record.items.length}>{new Date(record.date).toLocaleDateString()}</td>
                                <td rowSpan={record.items.length} style={{ fontWeight: 600 }}>
                                  {record.ref}
                                  {record.discount > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
                                      {t('discount')}: -৳{(record.discount || 0).toLocaleString()}
                                    </div>
                                  )}
                                </td>
                              </>
                            ) : null}
                            <td>{item.name}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>৳{(item.rate || 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>৳{(item.total || 0).toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: (item.profit || 0) >= 0 ? '#16a34a' : '#dc2626' }}>৳{(item.profit || 0).toLocaleString()}</td>
                          </tr>
                        ))
                    )}
                    {data.sales.length > 0 && (
                      <tr className="total-row">
                        <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>{t('total_short')} {t('saleRecords')}:</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>৳ {(data.summary.totalSales || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>৳ {(data.summary.salesProfit || 0).toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchases Section */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div className="print-section-heading" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ height: '18px', width: '3px', backgroundColor: '#ef4444', borderRadius: '2px' }}></div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('purchaseRecords')}</h3>
              </div>
              <div className="table-container">
                <table className="table statement-table print-table">
                  <thead>
                    <tr>
                      <th style={{ width: '85px' }}>{t('date')}</th>
                      <th style={{ width: '130px' }}>{t('reference')}</th>
                      <th>{t('product')}</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>{t('qty')}</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>{t('rate')}</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.purchases.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-4)', color: '#94a3b8' }}>No purchase records found.</td></tr>
                    ) : data.purchases.map((record: any) => 
                        record.items.map((item: any, i: number) => (
                          <tr key={`${record.id}-${i}`}>
                            {i === 0 ? (
                              <>
                                <td rowSpan={record.items.length}>{new Date(record.date).toLocaleDateString()}</td>
                                <td rowSpan={record.items.length} style={{ fontWeight: 600 }}>{record.ref}</td>
                              </>
                            ) : null}
                            <td>{item.name}</td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>৳{item.rate.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>৳{item.total.toLocaleString()}</td>
                          </tr>
                        ))
                    )}
                    {data.purchases.length > 0 && (
                      <tr className="total-row">
                        <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>{t('total_short')} {t('purchaseRecords')}:</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>৳ {data.summary.totalPurchases.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stock Section */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div className="print-section-heading" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <div style={{ height: '18px', width: '3px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase' }}>{t('stockStatus')}</h3>
              </div>
              <div className="table-container">
                <table className="table statement-table print-table">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>{t('buyRate')}</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>{t('saleRate')}</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>{t('qty')}</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>{t('stockValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.stock.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-4)', color: '#94a3b8' }}>No stock available.</td></tr>
                    ) : data.stock.map((item: any) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.name}</td>
                        <td style={{ textAlign: 'right' }}>৳{(item.cost || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'right' }}>৳{(item.price || 0).toLocaleString()}</td>
                        <td style={{ textAlign: 'center' }}>{item.balance}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>৳{(item.value || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                    {data.stock.length > 0 && (
                      <tr className="total-row">
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>{t('total_short')} {t('stockValue')}:</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>৳ {(data.summary.totalStockValue || 0).toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Final Summary Calculation */}
            <div className="summary-calc-container" style={{ marginTop: 'var(--space-4)', borderTop: '2px solid #334155', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end', marginBottom: '80px' }}>
              <div style={{ width: '250px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Total Revenue:</span>
                  <span style={{ fontWeight: 600 }}>৳ {data.summary.totalSales.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Total Buy Cost:</span>
                  <span style={{ fontWeight: 600 }}>৳ {(data.summary.cogs ?? data.summary.totalPurchases).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #e2e8f0', marginTop: '4px', fontSize: '1.1rem', fontWeight: 800 }}>
                  <span>Net Profit:</span>
                  <span style={{ color: data.summary.netProfit >= 0 ? '#22c55e' : '#ef4444' }}>
                    ৳ {data.summary.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* ABSOLUTE BOTTOM Print Signature Footer */}
            <div className="absolute-print-footer only-print">
              <div className="print-signature-wrap">
                <div className="signature-box">
                  <div className="signature-line">Prepared By</div>
                </div>
                <div className="signature-box">
                  <div className="signature-line">Authorized Signature</div>
                </div>
              </div>
              <div className="print-footer-note-absolute">
                This is a computer-generated document. Generated on {new Date().toLocaleString()} | Afra Tech Point ERP
              </div>
            </div>
          </div>
        </>
      )}
      
      <style jsx global>{`
        .statement-table th, .statement-table td {
          padding: 8px 6px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
          font-size: 0.9rem;
        }

        .absolute-print-footer {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            min-width: 0 !important;
          }
          body {
            background: white !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .printable-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            overflow: visible !important;
            /* Flex column so the footer can be pushed to the bottom of the last page */
            display: flex !important;
            flex-direction: column !important;
            height: auto !important;
            min-height: 277mm !important; /* A4 (297mm) minus @page margins */
          }
          /* Prevent horizontal clipping from screen scroll wrappers */
          .table-container {
            overflow: visible !important;
          }
          .printable-area > * {
            flex-shrink: 0 !important;
          }
          
          .print-table {
            display: table !important;
            width: 100% !important;
            max-width: 100% !important;
            /* Separate borders avoid the Chrome bug that clips repeated
               header rows on continuation pages (with collapse) */
            border-collapse: separate !important;
            border-spacing: 0 !important;
            table-layout: fixed !important;
          }
          .print-table thead {
            display: table-header-group !important; /* Repeat header on every page */
          }
          .print-table thead th {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            -webkit-print-color-adjust: exact;
            overflow-wrap: break-word !important;
          }
          .print-table tbody td {
            border: 1px solid #cbd5e1 !important;
            padding: 3px 6px !important;
            font-size: 10.5px !important;
            line-height: 1.2 !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
          }
          .total-row td {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
            -webkit-print-color-adjust: exact;
          }
          .print-table tr {
            page-break-inside: avoid !important;
          }
          /* Keep section headings glued to the start of their table */
          .print-section-heading {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          /* Don't let a table start right at the very bottom of a page */
          .print-table {
            page-break-before: auto !important;
          }

          .only-print {
            display: block !important;
          }

          /* Signature footer: pushed to the very bottom of the LAST page */
          .absolute-print-footer {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin-top: auto !important; /* pins footer to bottom of the document */
            padding-top: 6mm !important;
            border-top: 1px solid #e2e8f0 !important;
          }
          .print-signature-wrap {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            padding: 0 10mm !important;
          }
          .signature-box {
            text-align: center !important;
            width: 180px !important;
          }
          .signature-line {
            border-top: 1.5px solid #334155 !important;
            padding-top: 6px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
          }
          .print-footer-note-absolute {
            text-align: center !important;
            font-size: 8px !important;
            color: #94a3b8 !important;
            margin-top: 15px !important;
            border-top: 1px solid #f1f5f9 !important;
            padding-top: 8px !important;
          }
        }
      `}</style>
    </div>
  )
}
