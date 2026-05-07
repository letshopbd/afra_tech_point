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
  BarChart2, 
  FileText, 
  Receipt, 
  LineChart, 
  Settings 
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { isOpen } = useMobileMenu()

  const navItems = [
    { href: "/", label: t('dashboard'), icon: LayoutDashboard },
    { href: "/items", label: t('items'), icon: Package },
    { href: "/purchase", label: t('purchase'), icon: ShoppingCart },
    { href: "/sale", label: t('sale'), icon: Tag },
    { href: "/stock", label: t('stock'), icon: BarChart2 },
    { href: "/manage", label: t('manageRecords'), icon: FileText },
    { href: "/invoices", label: t('invoices'), icon: Receipt },
    { href: "/statement", label: t('statement'), icon: LineChart },
    { href: "/settings", label: t('settings'), icon: Settings },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-icon">
          <Package size={24} color="white" />
        </div>
        <h2 style={{ fontSize: '1.125rem', whiteSpace: 'nowrap' }}>Afra Tech Point</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={20} className="nav-icon" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
