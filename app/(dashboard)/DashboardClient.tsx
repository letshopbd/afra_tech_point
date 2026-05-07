"use client"

import { useLanguage } from "@/components/providers/LanguageProvider"
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight
} from "lucide-react"

export default function DashboardClient({ data }: { data: any }) {
  const { t } = useLanguage()

  // Stats Card Component
  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="card flex items-center justify-between">
      <div>
        <p className="text-muted" style={{ marginBottom: 'var(--space-1)', fontSize: '0.875rem' }}>{title}</p>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 700 }}>৳ {(value || 0).toLocaleString()}</h3>
        {trend && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.75rem', color: trend > 0 ? 'var(--success)' : 'var(--error)' }}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </div>
      <div style={{ 
        padding: 'var(--space-4)', 
        background: `${color}15`, 
        color: color, 
        borderRadius: 'var(--radius-lg)' 
      }}>
        <Icon size={28} />
      </div>
    </div>
  )

  return (
    <div className="flex-col gap-8" style={{ display: 'flex' }}>
      
      {/* Top Stats Row */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        <StatCard 
          title={t('totalInvestment')} 
          value={data?.totalInvestment || 0} 
          icon={ShoppingCart} 
          color="#4f46e5" 
        />
        <StatCard 
          title={t('totalSales30')} 
          value={data?.totalSalesRevenue || 0} 
          icon={TrendingUp} 
          color="#0ea5e9" 
        />
        <StatCard 
          title={t('estimatedProfit30')} 
          value={data?.estimatedProfit || 0} 
          icon={DollarSign} 
          color="#22c55e" 
        />
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Recent Sales Chart Placeholder */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-6)' }}>{t('dailySalesTrend')}</h3>
          <div style={{ height: '300px', width: '100%', background: 'linear-gradient(to top, #f8fafc 0%, #ffffff 100%)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'flex-end', padding: '0 var(--space-4) var(--space-8) var(--space-4)', position: 'relative', border: '1px dashed var(--border)' }}>
            {/* Visual guide lines */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: '25%', borderTop: '1px solid var(--border)', opacity: 0.3 }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', borderTop: '1px solid var(--border)', opacity: 0.3 }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '75%', borderTop: '1px solid var(--border)', opacity: 0.3 }}></div>
            
            {/* Simple SVG Chart */}
            <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
              <path 
                d="M 0 280 Q 250 280 500 280 T 1000 50" 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="3" 
              />
              <circle cx="1000" cy="50" r="6" fill="var(--primary)" />
            </svg>
            
            <div style={{ position: 'absolute', bottom: 'var(--space-2)', left: 'var(--space-4)', right: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <span>2026-04-11</span>
              <span>2026-04-18</span>
              <span>2026-04-25</span>
              <span>2026-05-02</span>
              <span>2026-05-07</span>
            </div>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-6)' }}>{t('topSellingItems')}</h3>
          {data.topItems.length === 0 ? (
            <p className="text-muted">No sales data yet.</p>
          ) : (
            <div className="table-container">
              <table className="table mobile-card-table">
                <thead>
                  <tr>
                    <th>{t('itemName')}</th>
                    <th style={{ textAlign: 'right' }}>{t('sales')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topItems.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td data-label={t('itemName')}>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.count} units sold</div>
                      </td>
                      <td data-label={t('sales')} style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>৳ {(item.total || 0).toLocaleString()}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>+{Math.floor(item.total * 0.1)} profit</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
