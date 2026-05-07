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

    const startDate = new Date(startStr)
    const endDate = new Date(endStr)
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

    const sales = salesData.map(sale => {
      const amount = sale.invoice ? Number(sale.invoice.totalAmount) : 0
      totalSales += amount
      return {
        id: sale.id,
        date: sale.createdAt,
        customer: sale.customer,
        ref: sale.invoice?.invoiceNumber || `#${sale.id}`,
        amount,
        items: sale.items.map(si => ({
          name: si.item.name,
          quantity: si.quantity,
          unit: si.unit,
          rate: Number(si.rate),
          total: Number(si.total)
        }))
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

    return NextResponse.json({
      summary: {
        totalSales,
        totalPurchases,
        netProfit: totalSales - totalPurchases
      },
      sales,
      purchases
    })

  } catch (error) {
    console.error("Error generating statement:", error)
    return NextResponse.json({ error: "Failed to generate statement" }, { status: 500 })
  }
}
