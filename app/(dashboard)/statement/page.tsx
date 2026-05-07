"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Search, Printer } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function StatementPage() {
  const { t } = useLanguage()
  
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const today = now.toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error("Failed to fetch settings")
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/statement?start=${startDate}&end=${endDate}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      toast.error("Failed to generate statement")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
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
              <h3 style={{ color: 'var(--error)' }}>৳ {data.summary.totalPurchases.toLocaleString()}</h3>
            </div>
            <div className="card">
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{t('totalSales')}</p>
              <h3 style={{ color: 'var(--primary)' }}>৳ {data.summary.totalSales.toLocaleString()}</h3>
            </div>
            <div className="card">
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>{t('netProfit')}</p>
              <h3 style={{ color: 'var(--success)' }}>৳ {data.summary.netProfit.toLocaleString()}</h3>
            </div>
          </div>

          {/* Statement View (Printable Wrapper) */}
          <div className="card printable-area" style={{ backgroundColor: 'white', color: '#1e293b' }}>
            
            {/* Elegant Header - ONLY PRINT */}
            <div className="only-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #334155', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>{settings?.invoiceCompanyName || settings?.companyName || "Business Name"}</h1>
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#64748b', maxWidth: '400px' }}>{settings?.invoiceCompanyAddress || settings?.companyAddress}</p>
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-1)', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>Phone: {settings?.invoicePhone || settings?.adminPhone}</span>
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
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0ea5e9' }}>৳ {data.summary.totalSales.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Net Profit</span>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#22c55e' }}>৳ {data.summary.netProfit.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Sales Section */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
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
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-4)', color: '#94a3b8' }}>No sales records found.</td></tr>
                    ) : data.sales.map((record: any) => 
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
                    {data.sales.length > 0 && (
                      <tr className="total-row">
                        <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>{t('total_short')} {t('saleRecords')}:</td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>৳ {data.summary.totalSales.toLocaleString()}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchases Section */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
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

            {/* Final Summary Calculation */}
            <div className="summary-calc-container" style={{ marginTop: 'var(--space-4)', borderTop: '2px solid #334155', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'flex-end', marginBottom: '80px' }}>
              <div style={{ width: '250px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Total Revenue:</span>
                  <span style={{ fontWeight: 600 }}>৳ {data.summary.totalSales.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Total Buy Cost:</span>
                  <span style={{ fontWeight: 600 }}>৳ {data.summary.totalPurchases.toLocaleString()}</span>
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
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            min-height: 277mm !important; /* Force A4 height to allow absolute positioning at bottom */
            position: relative !important;
          }
          
          .print-table {
            display: table !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .print-table thead th {
            background-color: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            padding: 4px 6px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            -webkit-print-color-adjust: exact;
          }
          .print-table tbody td {
            border: 1px solid #cbd5e1 !important;
            padding: 3px 6px !important;
            font-size: 10.5px !important;
            line-height: 1.2 !important;
          }
          .total-row td {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
            -webkit-print-color-adjust: exact;
          }
          
          .only-print {
            display: block !important;
          }

          /* Force Signatures at absolute bottom of the total container */
          .absolute-print-footer {
            display: block !important;
            position: absolute !important;
            bottom: 5mm !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
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
          
          .print-table tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  )
}
