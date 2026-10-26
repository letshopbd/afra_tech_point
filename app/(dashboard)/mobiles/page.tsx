"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Plus, Edit2, Trash2, Smartphone, CheckCircle, XCircle, Search } from "lucide-react"
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
  notes?: string | null
  createdAt: string
  mobileSale?: { id: number } | null
}

interface FormData {
  brand: string
  model: string
  color: string
  ram: string
  rom: string
  imei1: string
  imei2: string
  purchasePrice: string
  salePrice: string
  hasWarranty: boolean
  warrantyDays: string
  notes: string
}

export default function MobilesPage() {
  const { t, language } = useLanguage()
  const [phones, setPhones] = useState<MobilePhone[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPhone, setEditingPhone] = useState<MobilePhone | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      brand: "",
      model: "",
      color: "",
      ram: "",
      rom: "",
      imei1: "",
      imei2: "",
      purchasePrice: "",
      salePrice: "",
      hasWarranty: false,
      warrantyDays: "",
      notes: ""
    }
  })

  const hasWarranty = watch("hasWarranty")

  async function fetchPhones() {
    try {
      const res = await fetch("/api/mobiles")
      const data = await res.json()
      setPhones(data)
    } catch {
      toast.error(language === 'bn' ? "ডেটা লোড করতে সমস্যা হয়েছে" : "Failed to load mobile phones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPhones()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const url = editingPhone ? `/api/mobiles/${editingPhone.id}` : "/api/mobiles"
      const method = editingPhone ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          hasWarranty: !!data.hasWarranty,
          warrantyDays: data.hasWarranty && data.warrantyDays ? parseInt(data.warrantyDays) : null
        })
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || (language === 'bn' ? "সমস্যা হয়েছে" : "An error occurred"))
        return
      }

      toast.success(t('phoneSaved'))
      setShowForm(false)
      setEditingPhone(null)
      reset()
      fetchPhones()
    } catch {
      toast.error(language === 'bn' ? "সমস্যা হয়েছে" : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (phone: MobilePhone) => {
    setEditingPhone(phone)
    setValue("brand", phone.brand)
    setValue("model", phone.model)
    setValue("color", phone.color || "")
    setValue("ram", phone.ram || "")
    setValue("rom", phone.rom || "")
    setValue("imei1", phone.imei1)
    setValue("imei2", phone.imei2 || "")
    setValue("purchasePrice", String(phone.purchasePrice))
    setValue("salePrice", String(phone.salePrice))
    setValue("hasWarranty", phone.hasWarranty)
    setValue("warrantyDays", phone.warrantyDays ? String(phone.warrantyDays) : "")
    setValue("notes", phone.notes || "")
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (phone: MobilePhone) => {
    const confirmMsg = language === 'bn'
      ? `"${phone.brand} ${phone.model}" ডিলিট করতে চান?`
      : `Delete "${phone.brand} ${phone.model}"?`
    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/mobiles/${phone.id}`, { method: "DELETE" })
      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || (language === 'bn' ? "ডিলিট করা যায়নি" : "Failed to delete"))
        return
      }

      toast.success(language === 'bn' ? "মোবাইল ডিলিট হয়েছে" : "Mobile phone deleted")
      fetchPhones()
    } catch {
      toast.error(language === 'bn' ? "সমস্যা হয়েছে" : "An error occurred")
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingPhone(null)
    reset()
  }

  const filteredPhones = phones.filter(p => {
    const q = searchQuery.toLowerCase()
    return (
      p.brand.toLowerCase().includes(q) ||
      p.model.toLowerCase().includes(q) ||
      p.imei1.toLowerCase().includes(q) ||
      (p.imei2 && p.imei2.toLowerCase().includes(q))
    )
  })

  const totalPhones = phones.length
  const availablePhones = phones.filter(p => p.status === 'available').length
  const soldPhones = phones.filter(p => p.status === 'sold').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--primary)', color: 'white', borderRadius: '50%', padding: 'var(--space-3)', display: 'flex' }}>
            <Smartphone size={22} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{language === 'bn' ? "মোট মোবাইল" : "Total Phones"}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalPhones}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--success)', color: 'white', borderRadius: '50%', padding: 'var(--space-3)', display: 'flex' }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('totalAvailable')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{availablePhones}</div>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
          <div style={{ background: 'var(--error)', color: 'white', borderRadius: '50%', padding: 'var(--space-3)', display: 'flex' }}>
            <XCircle size={22} />
          </div>
          <div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{t('totalSoldCount')}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>{soldPhones}</div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showForm ? 'var(--space-6)' : '0' }}>
          <h3 style={{ margin: 0 }}>{editingPhone ? t('editMobile') : t('addMobile')}</h3>
          {!showForm && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} /> {t('addMobile')}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)' }}>
              {/* Brand */}
              <div>
                <label className="form-label">{t('brand')} *</label>
                <input
                  className="input-field"
                  placeholder={language === 'bn' ? "যেমন: Samsung, Apple" : "e.g. Samsung, Apple"}
                  {...register("brand", { required: true })}
                />
                {errors.brand && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>Required</span>}
              </div>

              {/* Model */}
              <div>
                <label className="form-label">{t('modelName')} *</label>
                <input
                  className="input-field"
                  placeholder={language === 'bn' ? "যেমন: Galaxy S24, iPhone 15" : "e.g. Galaxy S24, iPhone 15"}
                  {...register("model", { required: true })}
                />
                {errors.model && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>Required</span>}
              </div>

              {/* Color */}
              <div>
                <label className="form-label">{t('color')}</label>
                <input
                  className="input-field"
                  placeholder={language === 'bn' ? "যেমন: কালো, নীল" : "e.g. Midnight Black"}
                  {...register("color")}
                />
              </div>

              {/* RAM */}
              <div>
                <label className="form-label">{t('ram')}</label>
                <input
                  className="input-field"
                  placeholder={language === 'bn' ? "যেমন: ৮ জিবি" : "e.g. 8 GB"}
                  {...register("ram")}
                />
              </div>

              {/* ROM */}
              <div>
                <label className="form-label">{t('rom')}</label>
                <input
                  className="input-field"
                  placeholder={language === 'bn' ? "যেমন: ২৫৬ জিবি" : "e.g. 256 GB"}
                  {...register("rom")}
                />
              </div>

              {/* IMEI 1 */}
              <div>
                <label className="form-label">{t('imei1')} *</label>
                <input
                  className="input-field"
                  placeholder={language === 'bn' ? "১৫ সংখ্যার IMEI" : "15-digit IMEI"}
                  {...register("imei1", { required: true })}
                />
                {errors.imei1 && <span style={{ color: 'var(--error)', fontSize: '0.75rem' }}>Required</span>}
              </div>

              {/* IMEI 2 */}
              <div>
                <label className="form-label">{t('imei2')} <span className="text-muted">({t('optional')})</span></label>
                <input
                  className="input-field"
                  placeholder={language === 'bn' ? "ঐচ্ছিক" : "Optional"}
                  {...register("imei2")}
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label className="form-label">{t('purchaseRate')}</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field"
                  placeholder="0.00"
                  {...register("purchasePrice")}
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
                  {...register("salePrice")}
                />
              </div>

              {/* Has Warranty */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingTop: '28px' }}>
                <input
                  type="checkbox"
                  id="hasWarranty"
                  {...register("hasWarranty")}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="hasWarranty" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                  {t('hasWarranty')}
                </label>
              </div>

              {/* Warranty Days */}
              {hasWarranty && (
                <div>
                  <label className="form-label">{t('warrantyDays')}</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder={language === 'bn' ? "যেমন: ৩৬৫" : "e.g. 365"}
                    {...register("warrantyDays")}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">{t('remarks')}</label>
              <textarea
                className="input-field"
                rows={2}
                placeholder={language === 'bn' ? "অতিরিক্ত নোট..." : "Additional notes..."}
                {...register("notes")}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? t('processing') : (editingPhone ? t('save') : t('addMobile'))}
              </button>
              <button type="button" className="btn" onClick={handleCancel}
                style={{ backgroundColor: 'var(--surface-hover)', border: '1px solid var(--border)' }}>
                {t('cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Inventory Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h3 style={{ margin: 0 }}>{t('mobileInventory')}</h3>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: '32px' }}
              placeholder={language === 'bn' ? "ব্র্যান্ড, মডেল বা IMEI দিয়ে খুঁজুন..." : "Search brand, model or IMEI..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>{t('loading')}</p>
        ) : filteredPhones.length === 0 ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            {searchQuery ? (language === 'bn' ? "কোনো ফলাফল পাওয়া যায়নি" : "No results found") : t('noAvailableMobiles')}
          </p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>{t('brand')} &amp; {t('modelName')}</th>
                  <th>{t('color')}</th>
                  <th>{t('ram')}/{t('rom')}</th>
                  <th>{t('imei1')}</th>
                  <th>{t('imei2')}</th>
                  <th>{t('purchaseRate')}</th>
                  <th>{t('saleRate')}</th>
                  <th>{t('warrantyLabel')}</th>
                  <th>{language === 'bn' ? "স্ট্যাটাস" : "Status"}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPhones.map((phone, idx) => (
                  <tr key={phone.id}>
                    <td data-label="#">{idx + 1}</td>
                    <td data-label={`${t('brand')} & ${t('modelName')}`}>
                      <div style={{ fontWeight: 600 }}>{phone.brand}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{phone.model}</div>
                    </td>
                    <td data-label={t('color')}>{phone.color || <span className="text-muted">—</span>}</td>
                    <td data-label={`${t('ram')}/${t('rom')}`}>
                      {phone.ram || phone.rom
                        ? <span>{phone.ram || '—'} / {phone.rom || '—'}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td data-label={t('imei1')}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{phone.imei1}</span>
                    </td>
                    <td data-label={t('imei2')}>
                      {phone.imei2
                        ? <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{phone.imei2}</span>
                        : <span className="text-muted">—</span>
                      }
                    </td>
                    <td data-label={t('purchaseRate')}>৳{Number(phone.purchasePrice).toLocaleString()}</td>
                    <td data-label={t('saleRate')}>৳{Number(phone.salePrice).toLocaleString()}</td>
                    <td data-label={t('warrantyLabel')}>
                      {phone.hasWarranty && phone.warrantyDays
                        ? <span style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 600 }}>{phone.warrantyDays} {t('days')}</span>
                        : <span className="text-muted" style={{ fontSize: '0.8rem' }}>{t('noWarranty')}</span>
                      }
                    </td>
                    <td data-label="Status">
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: phone.status === 'available' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                        color: phone.status === 'available' ? 'var(--success)' : 'var(--error)'
                      }}>
                        {phone.status === 'available' ? t('available') : t('soldOut')}
                      </span>
                    </td>
                    <td className="action-cell" data-label={t('actions')}>
                      <button
                        onClick={() => handleEdit(phone)}
                        style={{ padding: 'var(--space-2)', color: 'var(--primary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        title={t('edit')}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(phone)}
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
