"use client"

import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import { MobileMenuProvider, useMobileMenu } from "@/components/providers/MobileMenuProvider"

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useMobileMenu()
  
  return (
    <div className="dashboard-layout">
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={close}></div>
      <Sidebar />
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MobileMenuProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </MobileMenuProvider>
  )
}
