import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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

    const items = await prisma.item.findMany({
      where: { itemType: 'product' },
      orderBy: { name: 'asc' }
    })

    const stockData = items.map((item) => {
      const si = inMap.get(item.id) || 0
      const so = outMap.get(item.id) || 0
      return {
        ...item,
        stockIn: si,
        stockOut: so,
        balance: si - so
      }
    })

    return NextResponse.json(stockData)
  } catch (error) {
    console.error("Error fetching stock:", error)
    return NextResponse.json({ error: "Failed to fetch stock" }, { status: 500 })
  }
}
