"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Save, Building2, Receipt } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function SettingsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (data) {
        reset(data)
      }
    } catch (error) {
      toast.error("Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to update settings")
      
      toast.success(t('settingsSaved'))
    } catch (error) {
      toast.error("Error saving settings")
    }
  }

  if (loading) {
    return <div className="text-muted text-center py-10">{t('loading')}</div>
  }

  return (
    <div className="flex-col gap-6" style={{ display: 'flex', maxWidth: '800px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        
        {/* Admin / Company Information */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', color: 'var(--primary)' }}>
            <Building2 size={24} />
            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{t('companyInformation')}</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
            <div style={{ display: 'none' }}>
              <input type="hidden" {...register("id")} />
            </div>
            
            <div>
              <label className="form-label">{t('adminName')}</label>
              <input {...register("adminName")} className="input-field" placeholder={t('adminName')} onFocus={(e) => e.target.select()} />
            </div>
            
            <div>
              <label className="form-label">{t('adminPhone')}</label>
              <input {...register("adminPhone")} className="input-field" placeholder={t('adminPhone')} onFocus={(e) => e.target.select()} />
            </div>

            <div>
              <label className="form-label">{t('companyName')}</label>
              <input {...register("companyName")} className="input-field" placeholder={t('companyName')} onFocus={(e) => e.target.select()} />
            </div>

            <div>
              <label className="form-label">{t('currencySymbol')}</label>
              <input {...register("currency")} className="input-field" placeholder="e.g. ৳ or $" onFocus={(e) => e.target.select()} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">{t('companyAddress')}</label>
              <textarea {...register("companyAddress")} className="input-field" rows={2} placeholder={t('companyAddress')} />
            </div>
          </div>
        </div>

        {/* Invoice Customization */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', color: 'var(--secondary)' }}>
            <Receipt size={24} />
            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{t('invoiceCustomization')}</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-4)' }}>
            <div>
              <label className="form-label">{t('invoiceHeaderName')}</label>
              <input {...register("invoiceCompanyName")} className="input-field" placeholder={t('invoiceHeaderName')} onFocus={(e) => e.target.select()} />
            </div>

            <div>
              <label className="form-label">{t('invoicePhone')}</label>
              <input {...register("invoicePhone")} className="input-field" placeholder={t('invoicePhone')} onFocus={(e) => e.target.select()} />
            </div>

            <div>
              <label className="form-label">{t('invoiceAddress')}</label>
              <textarea {...register("invoiceCompanyAddress")} className="input-field" rows={3} placeholder={t('invoiceAddress')} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            {isSubmitting ? t('processing') : <><Save size={18} /> {t('save')}</>}
          </button>
        </div>

      </form>
    </div>
  )
}
