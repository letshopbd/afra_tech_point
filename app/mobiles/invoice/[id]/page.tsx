"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Printer } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { formatMemory } from "@/lib/utils"

interface MobilePhone {
  id: number
  brand: string
  model: string
  color?: string | null
  ram?: string | null
  rom?: string | null
  imei1: string
  imei2?: string | null
  hasWarranty: boolean
  warrantyDays?: number | null
  warrantyUnit?: string | null
}

interface MobileSale {
  id: number
  invoiceNumber: string
  customer: string
  customerPhone?: string | null
  customerAddress?: string | null
  salePrice: number
  discountAmount: number
  totalAmount: number
  notes?: string | null
  saleDate: string
  createdAt: string
  mobile: MobilePhone
}

interface Settings {
  invoiceCompanyName?: string
  invoiceCompanyAddress?: string
  invoicePhone?: string
}

function getWarrantyBadgeUnit(val?: number | null, unit?: string | null) {
  const u = (unit || 'day').toLowerCase()
  if (u === 'year') return val === 1 ? 'YEAR' : 'YEARS'
  if (u === 'month') return val === 1 ? 'MONTH' : 'MONTHS'
  return val === 1 ? 'DAY' : 'DAYS'
}

function formatWarranty(val?: number | null, unit?: string | null, lang: string = 'en') {
  if (!val) return null
  const u = (unit || 'day').toLowerCase()
  if (lang === 'bn') {
    if (u === 'year') return `${val} বছর`
    if (u === 'month') return `${val} মাস`
    return `${val} দিন`
  }
  if (u === 'year') return `${val} ${val === 1 ? 'Year' : 'Years'}`
  if (u === 'month') return `${val} ${val === 1 ? 'Month' : 'Months'}`
  return `${val} ${val === 1 ? 'Day' : 'Days'}`
}

export default function MobileInvoicePage() {
  const { t, language } = useLanguage()
  const params = useParams()
  const id = params?.id as string

  const [sale, setSale] = useState<MobileSale | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [saleRes, settingsRes] = await Promise.all([
          fetch(`/api/mobiles/sale/${id}`),
          fetch(`/api/settings`)
        ])

        if (!saleRes.ok) throw new Error("Sale not found")

        const saleData = await saleRes.json()
        const settingsData = await settingsRes.json()

        setSale(saleData)
        setSettings(settingsData)
      } catch {
        toast.error(language === 'bn' ? "ইনভয়েস লোড করতে সমস্যা হয়েছে" : "Failed to load invoice")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('loading')}</div>
  }

  if (!sale) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>{t('mobileNotFound')}</div>
  }

  const handlePrint = () => window.print()

  const saleDate = new Date(sale.saleDate || sale.createdAt)

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
          height: '205mm',
          margin: '0 auto',
          backgroundColor: 'white',
          padding: '8mm',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          color: '#1f2937',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontSize: '0.8125rem'
        }}
      >
        {/* Content wrapper */}
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
              <h2 style={{ fontSize: '1rem', fontWeight: 300, margin: 0, color: '#d1d5db', textTransform: 'uppercase' }}>
                {t('mobileSaleInvoice')}
              </h2>
              <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.1rem' }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>{t('invoiceNumber')}:</span>
                  <span style={{ fontWeight: 600, color: '#4f46e5' }}>{sale.invoiceNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>{t('date')}:</span>
                  <span>{saleDate.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
              {t('customerDetails')}:
            </h3>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.1rem 0' }}>{sale.customer}</p>
            {sale.customerPhone && <p style={{ fontSize: '0.75rem', margin: '0 0 0.1rem 0' }}>{sale.customerPhone}</p>}
            {sale.customerAddress && <p style={{ fontSize: '0.75rem', margin: 0 }}>{sale.customerAddress}</p>}
          </div>

          {/* Phone Details Section */}
          <div style={{ marginBottom: '0.6rem' }}>
            <h3 style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
              {t('phoneDetails')}:
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 1rem', padding: '0.4rem 0.6rem', background: '#f9fafb', borderRadius: '0.25rem', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>{t('brand')}:</span>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{sale.mobile.brand}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>{t('modelName')}:</span>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{sale.mobile.model}</span>
              </div>
              {sale.mobile.color && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>{t('color')}:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>{sale.mobile.color}</span>
                </div>
              )}
              {sale.mobile.ram && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>{t('ram')}:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>{formatMemory(sale.mobile.ram)}</span>
                </div>
              )}
              {sale.mobile.rom && (
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>{t('rom')}:</span>
                  <span style={{ fontWeight: 500, fontSize: '0.8rem' }}>{formatMemory(sale.mobile.rom)}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span style={{ color: '#6b7280', fontSize: '0.72rem' }}>{t('warrantyLabel')}:</span>
                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: sale.mobile.hasWarranty ? '#4f46e5' : '#6b7280' }}>
                  {sale.mobile.hasWarranty && sale.mobile.warrantyDays
                    ? formatWarranty(sale.mobile.warrantyDays, sale.mobile.warrantyUnit, language)
                    : t('noWarranty')}
                </span>
              </div>
            </div>
          </div>

          {/* IMEI Section */}
          <div style={{ marginBottom: '0.6rem', padding: '0.4rem 0.6rem', background: '#f0f4ff', borderRadius: '0.25rem', border: '1px solid #c7d2fe' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
              {t('imeiLabel')}:
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>IMEI 1: </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', color: '#1f2937' }}>{sale.mobile.imei1}</span>
              </div>
              {sale.mobile.imei2 && (
                <div>
                  <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>IMEI 2: </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.85rem', color: '#1f2937' }}>{sale.mobile.imei2}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price Table + Warranty */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '1rem' }}>

            {/* Warranty stamp */}
            <div style={{ flexShrink: 0 }}>
              {sale.mobile.hasWarranty && sale.mobile.warrantyDays ? (
                <div
                  style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    border: '2.5px solid #4f46e5', color: '#4f46e5',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', transform: 'rotate(-12deg)',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ fontSize: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>WARRANTY</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, lineHeight: 1.1 }}>{sale.mobile.warrantyDays}</div>
                  <div style={{ fontSize: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>{getWarrantyBadgeUnit(sale.mobile.warrantyDays, sale.mobile.warrantyUnit)}</div>
                </div>
              ) : (
                <div
                  style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    border: '2.5px solid #d1d5db', color: '#9ca3af',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', transform: 'rotate(-12deg)',
                    backgroundColor: 'white'
                  }}
                >
                  <div style={{ fontSize: '6px', fontWeight: 800, letterSpacing: '0.5px' }}>NO</div>
                  <div style={{ fontSize: '9px', fontWeight: 800, textAlign: 'center', lineHeight: 1.2, padding: '0 4px' }}>WARRANTY</div>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            <div style={{ width: '190px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0.5rem' }}>
                <span style={{ color: '#6b7280' }}>{t('saleRate')}:</span>
                <span>৳{Number(sale.salePrice).toLocaleString()}</span>
              </div>
              {Number(sale.discountAmount) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0.5rem' }}>
                  <span style={{ color: '#6b7280' }}>{t('discount')}:</span>
                  <span style={{ color: '#ef4444' }}>-৳{Number(sale.discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '0.3rem 0.5rem' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem', fontWeight: 700, fontSize: '1rem' }}>
                <span>{t('grandTotal')}:</span>
                <span style={{ color: '#4f46e5' }}>৳{Number(sale.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#6b7280', fontSize: '0.7rem' }}>{t('remarks')}: </span>
              <span style={{ fontStyle: 'italic', fontSize: '0.7rem' }}>{sale.notes}</span>
            </div>
          )}
        </div>

        {/* Signatures + Footer */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem' }}>
            <div style={{ width: '110px', textAlign: 'center', fontSize: '0.7rem' }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '0.2rem' }}>
                {language === 'bn' ? 'ক্রেতার স্বাক্ষর' : 'Customer Signature'}
              </div>
            </div>
            <div style={{ width: '110px', textAlign: 'center', fontSize: '0.7rem' }}>
              <div style={{ borderTop: '1px solid #d1d5db', paddingTop: '0.2rem' }}>
                {language === 'bn' ? 'কর্তৃপক্ষের স্বাক্ষর' : 'Authorized Signature'}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem', color: '#6b7280', fontSize: '0.65rem' }}>
            <p style={{ margin: 0 }}>
              {language === 'bn' ? 'আমাদের সাথে ব্যবসার জন্য ধন্যবাদ!' : 'Thank you for your business!'}
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
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
