import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 1. Total Investment (Optimized)
    // Get aggregate stock balance per item
    const stockBalances = await prisma.stockLedger.groupBy({
      by: ['itemId'],
      _sum: {
        quantity: true
      },
      where: {
        type: { in: [1, 2] } // 1: In, 2: Out
      }
    })

    // This is still a bit tricky because balance = In - Out. 
    // Let's do it in two steps or use a more direct approach if possible.
    // Actually, for SQLite/Prisma, a better way for balance is separate sums:
    const stockIn = await prisma.stockLedger.groupBy({
      by: ['itemId'],
      _sum: { quantity: true },
      where: { type: 1 }
    })
    
    const stockOut = await prisma.stockLedger.groupBy({
      by: ['itemId'],
      _sum: { quantity: true },
      where: { type: 2 }
    })

    const inMap = new Map(stockIn.map(s => [s.itemId, s._sum.quantity || 0]))
    const outMap = new Map(stockOut.map(s => [s.itemId, s._sum.quantity || 0]))

    const itemCosts = await prisma.item.findMany({
      select: { id: true, cost: true, name: true }
    })

    let totalInvestment = 0
    itemCosts.forEach(item => {
      const balance = (inMap.get(item.id) || 0) - (outMap.get(item.id) || 0)
      if (balance > 0) {
        totalInvestment += balance * Number(item.cost)
      }
    })

    // 2. Total Sales & 3. Estimated Profit (Optimized)
    const recentSalesItems = await prisma.saleItem.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      include: { item: true }
    })

    const itemSalesMap = new Map()
    let estimatedProfit = 0
    let totalSalesRevenue = 0

    recentSalesItems.forEach(si => {
      const current = itemSalesMap.get(si.itemId) || { name: si.item.name, qty: 0, revenue: 0, cost: 0 }
      current.qty += si.quantity
      current.revenue += Number(si.total)
      current.cost += si.quantity * Number(si.item.cost)
      itemSalesMap.set(si.itemId, current)
      
      totalSalesRevenue += Number(si.total)
      estimatedProfit += (Number(si.total) - (si.quantity * Number(si.item.cost)))
    })

    const topItems = Array.from(itemSalesMap.values())
      .map(data => ({ ...data, profit: data.revenue - data.cost }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    // 4. Daily Sales Trend (Optimized)
    const dailySales = await prisma.saleItem.groupBy({
      by: ['createdAt'],
      _sum: { total: true },
      where: { createdAt: { gte: thirtyDaysAgo } }
    })

    const salesByDay = new Map()
    // Since groupBy on Date includes time, we need to normalize or use a different approach for chart
    // For simplicity and accuracy with timezones, we'll process the recentSalesItems we already have
    recentSalesItems.forEach(si => {
      const dateStr = si.createdAt.toISOString().split('T')[0]
      salesByDay.set(dateStr, (salesByDay.get(dateStr) || 0) + Number(si.total))
    })

    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      chartData.push({
        date: dateStr,
        amount: salesByDay.get(dateStr) || 0
      })
    }

    return NextResponse.json({
      totalInvestment,
      totalSalesRevenue,
      estimatedProfit,
      topItems,
      chartData
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
