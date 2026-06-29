"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLanguage } from "@/components/providers/LanguageProvider"
import { useMobileMenu } from "@/components/providers/MobileMenuProvider"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Tag, 
  Wrench,
  BarChart2, 
  FileText, 
  Receipt, 
  LineChart, 
  Settings,
  Barcode,
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const { t, language } = useLanguage()
  const { isOpen } = useMobileMenu()

  const menuGroups = [
    {
      title: language === 'bn' ? "ড্যাশবোর্ড ও পরিচালনা" : "CORE MODULES",
      items: [
        { href: "/", label: t('dashboard'), icon: LayoutDashboard },
        { href: "/items", label: t('items'), icon: Package },
        { href: "/purchase", label: t('purchase'), icon: ShoppingCart },
        { href: "/sale", label: t('sale'), icon: Tag },
        { href: "/service", label: t('service') || "Service Job", icon: Wrench },
        { href: "/stock", label: t('stock'), icon: BarChart2 },
      ]
    },
    {
      title: language === 'bn' ? "নথিপত্র ও রেকর্ড" : "RECORDS & DOCS",
      items: [
        { href: "/manage", label: t('manageRecords'), icon: FileText },
        { href: "/invoices", label: t('invoices'), icon: Receipt },
        { href: "/statement", label: t('statement'), icon: LineChart },
        { href: "/barcode", label: t('barcodePrinter'), icon: Barcode },
      ]
    },
    {
      title: language === 'bn' ? "সিস্টেম সেটিংস" : "SYSTEM",
      items: [
        { href: "/settings", label: t('settings'), icon: Settings },
      ]
    }
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon" style={{ background: 'transparent', padding: 0 }}>
          <img src="/logo.png" alt="Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', color: 'white', letterSpacing: '0.5px' }}>
          Afra Tech Point
        </h2>
      </div>
      
      <nav className="sidebar-nav">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="sidebar-group">
            <div className="sidebar-group-title">{group.title}</div>
            <div className="sidebar-group-items" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span style={{ fontSize: '0.875rem' }}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
