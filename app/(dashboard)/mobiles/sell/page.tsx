"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { FileText, Plus, Save, Smartphone } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

interface MobilePhone {
  id: number
  brand: string
  model: string
  color?: string | null
  ram?: string | null
  rom?: string | null
  imei1: string
  imei2?: string | null
  purchasePrice: number
  salePrice: number
  hasWarranty: boolean
  warrantyDays?: number | null
  status: string
}

// Local-time date input value
function toDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function MobileSellPage() {
  const { t, language } = useLanguage()
  const [availablePhones, setAvailablePhones] = useState<MobilePhone[]>([])
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>("")
  const [selectedPhone, setSelectedPhone] = useState<MobilePhone | null>(null)

  // Form fields
  const [customer, setCustomer] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [salePrice, setSalePrice] = useState<string>("")
  const [discountAmount, setDiscountAmount] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [saleDate, setSaleDate] = useState(() => toDateInput(new Date()))

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedSaleId, setGeneratedSaleId] = useState<number | null>(null)
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState("")

  async function fetchAvailablePhones() {
    try {
      const res = await fetch("/api/mobiles?status=available")
      const data = await res.json()
      setAvailablePhones(data)
    } catch {
      toast.error(language === 'bn' ? "ফোন লোড করতে সমস্যা হয়েছে" : "Failed to load phones")
    }
  }

  useEffect(() => {
    fetchAvailablePhones()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedPhoneId) {
      const phone = availablePhones.find(p => p.id === parseInt(selectedPhoneId))
      setSelectedPhone(phone || null)
      if (phone) {
        setSalePrice(String(phone.salePrice))
      }
    } else {
      setSelectedPhone(null)
      setSalePrice("")
    }
  }, [selectedPhoneId, availablePhones])

  const salePriceNum = parseFloat(salePrice) || 0
  const discountNum = parseFloat(discountAmount) || 0
  const grandTotal = salePriceNum - discountNum

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPhoneId) {
      return toast.error(language === 'bn' ? "একটি মোবাইল নির্বাচন করুন" : "Please select a mobile phone")
    }
    if (!customer.trim()) {
      return toast.error(language === 'bn' ? "ক্রেতার নাম আবশ্যক" : "Customer name is required")
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/mobiles/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileId: parseInt(selectedPhoneId),
          customer,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          salePrice: salePriceNum,
          discountAmount: discountNum,
          notes: notes || null,
          saleDate
        })
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || (language === 'bn' ? "সমস্যা হয়েছে" : "An error occurred"))
        setIsSubmitting(false)
        return
      }

      toast.success(t('mobileSaleSuccess'))
      setGeneratedSaleId(result.id)
      setGeneratedInvoiceNumber(result.invoiceNumber)
    } catch {
      toast.error(language === 'bn' ? "সমস্যা হয়েছে" : "An error occurred")
      setIsSubmitting(false)
    }
  }

  const startNewSale = () => {
    setGeneratedSaleId(null)
    setGeneratedInvoiceNumber("")
    setSelectedPhoneId("")
    setSelectedPhone(null)
    setCustomer("")
    setCustomerPhone("")
    setCustomerAddress("")
    setSalePrice("")
    setDiscountAmount("")
    setNotes("")
    setSaleDate(toDateInput(new Date()))
    setIsSubmitting(false)
    fetchAvailablePhones()
  }

  // Success screen
  if (generatedSaleId) {
    return (
      <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
        <div style={{ background: 'var(--success)', color: 'white', padding: 'var(--space-4)', borderRadius: '50%' }}>
          <Save size={48} />
        </div>
        <h2>{t('mobileSaleSuccess')}</h2>
        <p className="text-muted">{language === 'bn' ? "ইনভয়েস নম্বর:" : "Invoice Number:"} <strong>{generatedInvoiceNumber}</strong></p>

        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={() => window.open(`/mobiles/invoice/${generatedSaleId}`, '_blank')}
          >
            <FileText size={18} /> {t('viewPrint')}
          </button>
          <button
            className="btn"
            style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}
            onClick={startNewSale}
          >
            <Plus size={18} /> {t('startNew')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <form onSubmit={handleSubmit}>

        {/* Step 1: Select Phone */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)' }}>
            {language === 'bn' ? "ধাপ ১: মোবাইল নির্বাচন করুন" : "Step 1: Select Mobile Phone"}
          </h3>

          <div>
            <label className="form-label">{t('mobilePhones')} *</label>
            <select
              className="input-field"
              value={selectedPhoneId}
              onChange={e => setSelectedPhoneId(e.target.value)}
              style={{ maxWidth: '500px' }}
            >
              <option value="">{t('selectMobilePhone')}</option>
              {availablePhones.map(phone => (
                <option key={phone.id} value={phone.id}>
                  {phone.brand} {phone.model}
                  {phone.color ? ` — ${phone.color}` : ''}
                  {` — IMEI: ${phone.imei1}`}
                </option>
              ))}
            </select>
            {availablePhones.length === 0 && (
              <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
                {t('noAvailableMobiles')}
              </p>
            )}
          </div>

          {/* Phone Details Card */}
          {selectedPhone ? (
            <div style={{
              marginTop: 'var(--space-6)',
              padding: 'var(--space-5)',
              background: 'var(--surface-hover)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-3)'
            }}>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <div style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: 'var(--space-2)', display: 'flex' }}>
                  <Smartphone size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedPhone.brand} {selectedPhone.model}</div>
                  {selectedPhone.color && <div className="text-muted" style={{ fontSize: '0.85rem' }}>{selectedPhone.color}</div>}
                </div>
              </div>

              {selectedPhone.ram && (
                <div>
                  <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('ram')}</div>
                  <div style={{ fontWeight: 500 }}>{selectedPhone.ram}</div>
                </div>
              )}
              {selectedPhone.rom && (
                <div>
                  <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('rom')}</div>
                  <div style={{ fontWeight: 500 }}>{selectedPhone.rom}</div>
                </div>
              )}
              <div>
                <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('imei1')}</div>
                <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{selectedPhone.imei1}</div>
              </div>
              {selectedPhone.imei2 && (
                <div>
                  <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('imei2')}</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{selectedPhone.imei2}</div>
                </div>
              )}
              <div>
                <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('warrantyLabel')}</div>
                <div style={{ fontWeight: 500, color: selectedPhone.hasWarranty ? 'var(--primary)' : undefined }}>
                  {selectedPhone.hasWarranty && selectedPhone.warrantyDays
                    ? `${selectedPhone.warrantyDays} ${t('days')}`
                    : t('noWarranty')
                  }
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('saleRate')}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>৳{Number(selectedPhone.salePrice).toLocaleString()}</div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--surface-hover)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
              <p className="text-muted">{t('selectPhoneFirst')}</p>
            </div>
          )}
        </div>

        {/* Step 2: Customer & Sale Details */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>
            {language === 'bn' ? "ধাপ ২: বিক্রয়ের তথ্য" : "Step 2: Sale Details"}
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
            {/* Customer Name */}
            <div>
              <label className="form-label">{t('customerName')} *</label>
              <input
                className="input-field"
                value={customer}
                onChange={e => setCustomer(e.target.value)}
                required
              />
            </div>

            {/* Customer Phone */}
            <div>
              <label className="form-label">{t('phoneNumber')}</label>
              <input
                className="input-field"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
              />
            </div>

            {/* Customer Address */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">{t('address')}</label>
              <input
                className="input-field"
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
              />
            </div>

            {/* Sale Date */}
            <div>
              <label className="form-label">{t('saleDate')} *</label>
              <input
                type="date"
                className="input-field"
                value={saleDate}
                onChange={e => setSaleDate(e.target.value)}
                required
              />
            </div>

            {/* Sale Price */}
            <div>
              <label className="form-label">{t('saleRate')}</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="0.00"
                value={salePrice}
                onChange={e => setSalePrice(e.target.value)}
              />
            </div>

            {/* Discount */}
            <div>
              <label className="form-label">{t('discount')}</label>
              <input
                type="number"
                step="0.01"
                className="input-field"
                placeholder="0.00"
                value={discountAmount}
                onChange={e => setDiscountAmount(e.target.value)}
              />
            </div>

            {/* Grand Total */}
            <div>
              <label className="form-label">{t('grandTotal')}</label>
              <div className="input-field" style={{ backgroundColor: 'var(--surface-hover)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                ৳{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Notes */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">{t('remarks')}</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder={language === 'bn' ? "অতিরিক্ত নোট..." : "Additional notes..."}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || !selectedPhoneId}
            style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4) var(--space-8)' }}
          >
            {isSubmitting ? t('processing') : <><Save size={18} /> {t('completeSale')}</>}
          </button>
        </div>
      </form>
    </div>
  )
}
