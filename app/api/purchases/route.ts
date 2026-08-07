import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Parse "YYYY-MM-DD" as local time (avoid UTC off-by-one)
function parseLocalDate(s?: string) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        items: {
          include: { item: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(purchases)
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { items, remarks, purchaseDate } = body

    if (!items || !items.length) {
      return NextResponse.json({ error: "Purchase items are required" }, { status: 400 })
    }

    interface PurchaseItemInput {
      itemId: string
      quantity: string
      unit?: string
      rate: string
      price?: string
    }

    // Use transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      const purchaseDateParsed = parseLocalDate(purchaseDate)

      // 1. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          remarks,
          ...(purchaseDateParsed ? { createdAt: purchaseDateParsed } : {}),
          items: {
            create: items.map((item: PurchaseItemInput) => ({
              itemId: parseInt(item.itemId),
              quantity: parseInt(item.quantity),
              unit: item.unit || "pcs",
              rate: parseFloat(item.rate),
              total: parseFloat(item.rate) * parseInt(item.quantity)
            }))
          }
        },
        include: { items: true }
      })

      // 2. Update Stock Ledger & parent item cost/retail price
      for (const pItem of purchase.items) {
        const inputItem = items.find((i: PurchaseItemInput) => parseInt(i.itemId) === pItem.itemId)
        const retailPrice = inputItem && inputItem.price ? parseFloat(inputItem.price) : null

        await tx.stockLedger.create({
          data: {
            itemId: pItem.itemId,
            quantity: pItem.quantity,
            unit: pItem.unit,
            rate: pItem.rate,
            type: 1, // 1 = Stock In
            refType: 'purchase',
            refId: purchase.id,
            ...(purchaseDateParsed ? { createdAt: purchaseDateParsed } : {})
          }
        })

        // Update item base prices
        await tx.item.update({
          where: { id: pItem.itemId },
          data: {
            cost: pItem.rate,
            ...(retailPrice !== null ? { price: retailPrice } : {})
          }
        })
      }

      return purchase
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating purchase:", error)
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
  }
}
