import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const startStr = searchParams.get("start")
    const endStr = searchParams.get("end")

    if (!startStr || !endStr) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 })
    }

    const parseLocalDate = (s: string) => {
      const [y, m, d] = s.split('-').map(Number)
      return new Date(y, m - 1, d)
    }

    const startDate = parseLocalDate(startStr)
    const endDate = parseLocalDate(endStr)
    endDate.setHours(23, 59, 59, 999)

    // 1. Fetch Sales within range
    const salesData = await prisma.sale.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { 
        invoice: true,
        items: { include: { item: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    // 2. Fetch Purchases within range
    const purchasesData = await prisma.purchase.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { 
        items: { include: { item: true } }
      },
      orderBy: { createdAt: 'asc' }
    })

    let totalSales = 0
    let totalPurchases = 0
    let totalSalesProfit = 0

    const sales = salesData.map(sale => {
      const itemSum = sale.items.reduce((sum, si) => sum + Number(si.total), 0)
      const amount = sale.invoice ? Number(sale.invoice.totalAmount) : itemSum
      // Scale line totals to the invoice total so discounts/tax are reflected per row
      const scale = itemSum > 0 ? amount / itemSum : 0
      totalSales += amount
      return {
        id: sale.id,
        date: sale.createdAt,
        customer: sale.customer,
        ref: sale.invoice?.invoiceNumber || `#${sale.id}`,
        amount,
        discount: sale.invoice ? Number(sale.invoice.discountAmount) || 0 : 0,
        items: sale.items.map(si => {
          const cost = Number(si.item.cost) || 0
          const discountedTotal = Number(si.total) * scale
          const profit = discountedTotal - cost * si.quantity
          totalSalesProfit += profit
          return {
            name: si.item.name,
            quantity: si.quantity,
            unit: si.unit,
            rate: Number(si.rate),
            total: discountedTotal,
            cost,
            profit
          }
        })
      }
    })

    const purchases = purchasesData.map(purchase => {
      const amount = purchase.items.reduce((sum, item) => sum + Number(item.total), 0)
      totalPurchases += amount
      return {
        id: purchase.id,
        date: purchase.createdAt,
        ref: `#${purchase.id}`,
        amount,
        items: purchase.items.map(pi => ({
          name: pi.item.name,
          quantity: pi.quantity,
          unit: pi.unit,
          rate: Number(pi.rate),
          total: Number(pi.total)
        }))
      }
    })

    // 3. Current stock snapshot
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

    const stockItems = await prisma.item.findMany({
      where: { itemType: 'product' },
      orderBy: { name: 'asc' }
    })

    let totalStockValue = 0
    const stock = stockItems.map(item => {
      const balance = (inMap.get(item.id) || 0) - (outMap.get(item.id) || 0)
      const value = balance * Number(item.cost)
      totalStockValue += value
      return {
        id: item.id,
        name: item.name,
        cost: Number(item.cost),
        price: Number(item.price),
        balance,
        value
      }
    })

    return NextResponse.json({
      summary: {
        totalSales,
        totalPurchases,
        salesProfit: totalSalesProfit,
        totalStockValue,
        netProfit: totalSales - totalPurchases
      },
      sales,
      purchases,
      stock
    })

  } catch (error) {
    console.error("Error generating statement:", error)
    return NextResponse.json({ error: "Failed to generate statement" }, { status: 500 })
  }
}
