"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Save, Building2, Receipt, Lock } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"

export default function SettingsPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (data) {
        reset(data)
      }
    } catch {
      toast.error("Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (data: any) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (!res.ok) throw new Error("Failed to update settings")
      
      toast.success(t('settingsSaved'))
    } catch {
      toast.error("Error saving settings")
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match")
      return
    }

    setPasswordSubmitting(true)
    try {
      const res = await fetch("/api/settings/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password")
      }

      toast.success("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast.error(error.message || "Error changing password")
    } finally {
      setPasswordSubmitting(false)
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
 
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-6)' }}>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            {isSubmitting ? t('processing') : <><Save size={18} /> {t('save')}</>}
          </button>
        </div>
 
      </form>

      {/* Change Password Card */}
      <form onSubmit={handlePasswordChange}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', color: 'var(--error)' }}>
            <Lock size={24} />
            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{t('security')}</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <div>
              <label className="form-label">{t('currentPassword')}</label>
              <input 
                type="password"
                className="input-field" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="form-label">{t('newPassword')}</label>
              <input 
                type="password"
                className="input-field" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">{t('confirmPassword')}</label>
              <input 
                type="password"
                className="input-field" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>
          
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>
            {t('passwordRequirements')}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
            <button type="submit" disabled={passwordSubmitting} className="btn btn-primary" style={{ padding: '0.75rem 2rem', backgroundColor: 'var(--error)', borderColor: 'var(--error)' }}>
              {passwordSubmitting ? t('processing') : <><Lock size={18} /> {t('changePassword')}</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
