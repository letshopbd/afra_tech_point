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
    const typeFilter = searchParams.get('type')
    const barcodeFilter = searchParams.get('barcode')

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
      where: {
        ...(typeFilter ? { itemType: typeFilter } : {}),
        ...(barcodeFilter ? { barcode: barcodeFilter } : {})
      },
      orderBy: { createdAt: 'desc' }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsWithStock = items.map((item: any) => {
      const si = inMap.get(item.id) || 0
      const so = outMap.get(item.id) || 0
      return {
        ...item,
        stock: si - so
      }
    })

    return NextResponse.json(itemsWithStock)
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, cost, price, itemType, barcode } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    let finalBarcode = barcode || null
    if (itemType !== "service" && !finalBarcode) {
      // Auto generate a unique SKU: ATP- followed by 6 random characters
      finalBarcode = `ATP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }

    if (finalBarcode) {
      const duplicateBarcode = await prisma.item.findUnique({
        where: { barcode: finalBarcode }
      })
      if (duplicateBarcode) {
        return NextResponse.json(
          { error: `This barcode is already assigned to item: ${duplicateBarcode.name}` }, 
          { status: 400 }
        )
      }
    }

    const newItem = await prisma.item.create({
      data: {
        name,
        description,
        cost: cost ? parseFloat(cost) : 0,
        price: price ? parseFloat(price) : 0,
        itemType: itemType || "product",
        barcode: finalBarcode
      }
    })

    return NextResponse.json(newItem, { status: 201 })
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 })
  }
}
