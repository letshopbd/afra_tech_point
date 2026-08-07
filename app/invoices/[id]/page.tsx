"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Printer } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface InvoiceItem {
  item?: { name: string }
  imeiNumber?: string | null
  imeiNumber2?: string | null
  quantity: number
  rate: number
  total: number
  warrantyNumber?: number | null
  warrantyUnit?: string | null
}

interface Invoice {
  invoiceNumber: string
  createdAt: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  notes?: string
  sale?: {
    items: InvoiceItem[]
  }
}

interface Settings {
  invoiceCompanyName?: string
  invoiceCompanyAddress?: string
  invoicePhone?: string
}

export default function InvoicePrintPage() {
  const { t, language } = useLanguage()
  const params = useParams()
  const id = params?.id as string
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    try {
      const [invRes, setRes] = await Promise.all([
        fetch(`/api/invoices/${id}`),
        fetch(`/api/settings`)
      ])
      
      if (!invRes.ok) throw new Error("Invoice not found")
      
      const invoiceData = await invRes.json()
      const settingsData = await setRes.json()
      
      setInvoice(invoiceData)
      setSettings(settingsData)
      
    } catch {
      toast.error("Failed to fetch invoice details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loading')}</div>
  if (!invoice) return <div style={{ padding: '2rem', textAlign: 'center' }}>Invoice not found.</div>

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '1rem 0', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Non-printable Action Bar */}
      <div className="no-print" style={{ width: '148mm', margin: '0 auto 1rem auto', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handlePrint}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem', 
            padding: '0.5rem 1rem', backgroundColor: '#4f46e5', color: 'white', 
            border: 'none', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <Printer size={16} /> {t('print')}
        </button>
      </div>

      {/* Printable Invoice Container */}
      <div 
        id="printable-invoice"
        style={{ 
          width: '147mm', 
          height: '205mm', // Slightly less than 210mm to avoid 2nd page
          margin: '0 auto', 
          backgroundColor: 'white', 
          padding: '8mm', // More compact
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          color: '#1f2937',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '0.8125rem' // Base font size
        }}
      >
        {/* Content wrapper to allow signatures to be pushed down */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '40px', width: '40px', objectFit: 'contain', marginTop: '3px' }} />
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#4f46e5' }}>
                  {settings?.invoiceCompanyName || "Afra Tech Point"}
                </h1>
                <p style={{ fontSize: '0.7rem', margin: '0.2rem 0 0 0', color: '#6b7280', whiteSpace: 'pre-line', maxWidth: '200px' }}>
                  {settings?.invoiceCompanyAddress || "Mohila Collage Gate, Dhunat, Bogura"}
                </p>
                <p style={{ fontSize: '0.7rem', margin: '0.1rem 0 0 0', color: '#6b7280' }}>
                  {t('phoneNumber')}: {settings?.invoicePhone || "017044996944"}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 300, margin: 0, color: '#d1d5db', textTransform: 'uppercase' }}>{t('invoices')}</h2>
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.1rem' }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>{t('invoiceNumber')}:</span>
                  <span style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>{t('date')}:</span>
                  <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>{t('customerDetails')}:</h3>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.1rem 0' }}>{invoice.customerName || "Walk-in Customer"}</p>
            {invoice.customerPhone && <p style={{ fontSize: '0.75rem', margin: '0 0 0.1rem 0' }}>{invoice.customerPhone}</p>}
            {invoice.customerAddress && <p style={{ fontSize: '0.75rem', margin: 0 }}>{invoice.customerAddress}</p>}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', borderTop: '1px solid #e5e7eb' }}>
                <th style={{ padding: '0.4rem', textAlign: 'left', fontWeight: 600, color: '#374151' }}>{t('description')}</th>
                <th style={{ padding: '0.4rem', textAlign: 'center', fontWeight: 600, color: '#374151', width: '40px' }}>{t('qty')}</th>
                <th style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 600, color: '#374151', width: '80px' }}>{t('rate')}</th>
                <th style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 600, color: '#374151', width: '80px' }}>{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.sale?.items.map((item: InvoiceItem, idx: number) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{item.item?.name || "Unknown Item"}</div>
                        {(item.imeiNumber || item.imeiNumber2) && (
                          <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.1rem' }}>
                            IMEI/SN: {[item.imeiNumber, item.imeiNumber2].filter(Boolean).join(' | ')}
                          </div>
                        )}
                      </div>
                      {item.warrantyNumber && item.warrantyUnit && item.warrantyNumber > 0 && (
                        <div
                          style={{
                            width: '58px', height: '58px', borderRadius: '50%',
                            border: '2px solid #4f46e5', color: '#4f46e5',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0, transform: 'rotate(-12deg)',
                            backgroundColor: 'white'
                          }}
                        >
                          <div style={{ fontSize: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>WARRANTY</div>
                          <div style={{ fontSize: '17px', fontWeight: 800, lineHeight: 1.1 }}>{item.warrantyNumber}</div>
                          <div style={{ fontSize: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>
                            {item.warrantyUnit === 'day' ? (item.warrantyNumber > 1 ? 'DAYS' : 'DAY') :
                             item.warrantyUnit === 'month' ? (item.warrantyNumber > 1 ? 'MONTHS' : 'MONTH') :
                             (item.warrantyNumber > 1 ? 'YEARS' : 'YEAR')}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.4rem', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '0.4rem', textAlign: 'right' }}>{Number(item.rate).toLocaleString()}</td>
                  <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 500 }}>{Number(item.total).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
            <div style={{ width: '160px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.1rem 0.5rem' }}>
                <span style={{ color: '#6b7280' }}>{t('subtotal')}:</span>
                <span>৳{Number(invoice.subtotal).toLocaleString()}</span>
              </div>
              
              {Number(invoice.taxAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.1rem 0.5rem' }}>
                  <span style={{ color: '#6b7280' }}>{t('tax')}:</span>
                  <span>৳{Number(invoice.taxAmount).toLocaleString()}</span>
                </div>
              )}
              
              {Number(invoice.discountAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.1rem 0.5rem' }}>
                  <span style={{ color: '#6b7280' }}>{t('discount')}:</span>
                  <span>-৳{Number(invoice.discountAmount).toLocaleString()}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', marginTop: '0.2rem', fontWeight: 700, fontSize: '0.9rem' }}>
                <span>{t('grandTotal')}:</span>
                <span style={{ color: '#4f46e5' }}>৳{Number(invoice.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{ marginBottom: '0.75rem' }}>
              <h4 style={{ margin: '0 0 0.1rem 0', color: '#6b7280', fontSize: '0.7rem' }}>{t('remarks')}:</h4>
              <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.7rem' }}>{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Signatures and Footer wrapper */}
        <div style={{ marginTop: 'auto' }}>
          {/* Signatures */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem' }}>
            <div style={{ width: '110px', textAlign: 'center', fontSize: '0.7rem' }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '0.2rem' }}>{language === 'bn' ? 'ক্রেতার স্বাক্ষর' : 'Customer Signature'}</div>
            </div>
            <div style={{ width: '110px', textAlign: 'center', fontSize: '0.7rem' }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '0.2rem' }}>{language === 'bn' ? 'কর্তৃপক্ষের স্বাক্ষর' : 'Authorized Signature'}</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', color: '#6b7280', fontSize: '0.65rem' }}>
            <p style={{ margin: 0 }}>{language === 'bn' ? 'আমাদের সাথে ব্যবসার জন্য ধন্যবাদ!' : 'Thank you for your business!'}</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: A5 portrait; 
            margin: 0 !important; 
          }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            height: 210mm !important;
            width: 148mm !important;
            overflow: hidden !important;
          }
          .no-print { display: none !important; }
          
          /* Hide everything else and reset parent container */
          body > div { 
            padding: 0 !important; 
            margin: 0 !important; 
            min-height: 0 !important; 
            background: white !important; 
          }

          #printable-invoice {
            width: 147mm !important;
            height: 205mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
          }
        }
      `}} />
    </div>
  )
}
