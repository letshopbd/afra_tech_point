"use client"

import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LogOut, User as UserIcon, Languages, Menu } from "lucide-react"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { useMobileMenu } from "@/components/providers/MobileMenuProvider"

export default function Topbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { language, setLanguage, t } = useLanguage()
  const { toggle } = useMobileMenu()
  
  // Format pathname to a readable title
  const getPageTitle = () => {
    if (pathname === "/") return t('dashboard')
    const path = pathname?.split("/")[1] || ""
    const keyMap: Record<string, any> = {
      'items': 'items',
      'purchase': 'purchase',
      'sale': 'sale',
      'stock': 'stock',
      'invoices': 'invoices',
      'statement': 'statement',
      'settings': 'settings',
      'manage': 'manageRecords'
    }
    const key = keyMap[path] || path;
    return t(key) || path;
  }

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <button className="hamburger" onClick={toggle}>
          <Menu size={24} />
        </button>
        <h1 className="page-title">{getPageTitle()}</h1>
      </div>
      
      <div className="topbar-right">
        <button 
          onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
          className="btn btn-language"
          style={{ 
            backgroundColor: 'var(--surface-hover)', 
            border: '1px solid var(--border)',
            padding: 'var(--space-2) var(--space-4)',
            fontSize: '0.875rem',
            marginRight: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}
        >
          <Languages size={18} />
          <span>{language === 'en' ? 'বাংলা' : 'English'}</span>
        </button>

        <div className="user-profile">
          <div className="avatar">
            <UserIcon size={18} />
          </div>
          <span className="username">{session?.user?.name || "Admin"}</span>
        </div>
        
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-logout"
          title={t('logout')}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
