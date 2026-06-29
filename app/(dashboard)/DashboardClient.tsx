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
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

// Extracted StatCard Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatCard = ({ title, value, icon: Icon, color, trend, delay }: any) => (
  <div 
    className="card flex items-center justify-between"
    style={{ 
      animation: `slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
      animationDelay: `${delay}ms`,
      opacity: 0,
      transform: 'translateY(20px)',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-5px)'
      e.currentTarget.style.boxShadow = 'var(--shadow-xl)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
    }}
  >
    <div>
      <p className="text-muted" style={{ marginBottom: 'var(--space-1)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
      <h3 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-main)' }}>৳ {(value || 0).toLocaleString()}</h3>
      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.8rem', fontWeight: 500, color: trend > 0 ? 'var(--success)' : 'var(--error)' }}>
          {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </div>
    <div style={{ 
      padding: 'var(--space-4)', 
      background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`, 
      color: color, 
      borderRadius: 'var(--radius-xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `inset 0 0 0 1px ${color}33`
    }}>
      <Icon size={28} />
    </div>
  </div>
)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DashboardClient({ data }: { data: any }) {
  const { t } = useLanguage()

  // Real data from backend, with sample data as fallback
  const chartData = data?.chartData && data.chartData.length > 0 
    ? data.chartData 
    : [
        { name: 'Apr 11', sales: 4000, profit: 2400 },
        { name: 'Apr 18', sales: 3000, profit: 1398 },
        { name: 'Apr 25', sales: 2000, profit: 9800 },
        { name: 'May 02', sales: 2780, profit: 3908 },
        { name: 'May 07', sales: 1890, profit: 4800 },
        { name: 'May 14', sales: 2390, profit: 3800 },
        { name: 'May 21', sales: 3490, profit: 4300 },
      ]

  return (
    <div className="flex-col gap-8" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      
      {/* Top Stats Row */}
      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        <StatCard 
          title={t('totalInvestment')} 
          value={data?.totalInvestment || 0} 
          icon={ShoppingCart} 
          color="#6366f1" 
          delay={100}
        />
        <StatCard 
          title={t('totalSales30')} 
          value={data?.totalSalesRevenue || 0} 
          icon={TrendingUp} 
          color="#0ea5e9"
          delay={200} 
        />
        <StatCard 
          title={t('estimatedProfit30')} 
          value={data?.estimatedProfit || 0} 
          icon={DollarSign} 
          color="#10b981" 
          delay={300}
        />
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        
        {/* Recharts Area Chart */}
        <div className="card" style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', animationDelay: '400ms', opacity: 0 }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontWeight: 600 }}>{t('dailySalesTrend')}</h3>
          <div style={{ height: '350px', width: '100%', marginTop: 'var(--space-4)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dx={-10} tickFormatter={(value) => `৳${value}`} />
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <Tooltip 
                  contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                  itemStyle={{ fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="sales" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="card" style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', animationDelay: '500ms', opacity: 0 }}>
          <h3 style={{ marginBottom: 'var(--space-6)', fontWeight: 600 }}>{t('topSellingItems')}</h3>
          {(data?.topItems?.length || 0) === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-muted)' }}>
              <Package size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-4)' }} />
              <p>No sales data yet.</p>
            </div>
          ) : (
            <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              <table className="table mobile-card-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
                  <tr>
                    <th style={{ background: 'none', borderBottom: '2px solid var(--border)' }}>{t('itemName')}</th>
                    <th style={{ textAlign: 'right', background: 'none', borderBottom: '2px solid var(--border)' }}>{t('sales')}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {data.topItems.map((item: any, idx: number) => (
                    <tr key={idx} style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateX(0)'}>
                      <td data-label={t('itemName')} style={{ border: 'none', borderTopLeftRadius: 'var(--radius-md)', borderBottomLeftRadius: 'var(--radius-md)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.count} units sold</div>
                      </td>
                      <td data-label={t('sales')} style={{ textAlign: 'right', border: 'none', borderTopRightRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>৳ {(item.total || 0).toLocaleString()}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                          <ArrowUpRight size={12} /> +{Math.floor(item.total * 0.1)} profit
                        </div>
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
