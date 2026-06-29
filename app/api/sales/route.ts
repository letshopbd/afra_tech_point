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

    const sales = await prisma.sale.findMany({
      where: typeFilter === 'service'
        ? { isServiceJob: true }
        : typeFilter === 'product'
        ? { isServiceJob: false }
        : undefined,
      include: {
        items: { include: { item: true } },
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error fetching sales:", error)
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { 
      customer, 
      customerPhone, 
      customerAddress, 
      remarks, 
      items, 
      discountAmount, 
      taxAmount,
      isServiceJob,
      deviceModel,
      problemDesc,
      serviceStatus
    } = body

    if (!items || !items.length) {
      return NextResponse.json({ error: "Sale items are required" }, { status: 400 })
    }

    interface SaleItemInput {
      itemId: string
      quantity: string
      unit?: string
      rate: string
      imeiNumber?: string
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          customer,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          remarks,
          isServiceJob: !!isServiceJob,
          deviceModel: deviceModel || null,
          problemDesc: problemDesc || null,
          serviceStatus: serviceStatus || "pending",
          items: {
            create: items.map((item: SaleItemInput) => ({
              itemId: parseInt(item.itemId),
              quantity: parseInt(item.quantity),
              unit: item.unit || "pcs",
              rate: parseFloat(item.rate),
              total: parseFloat(item.rate) * parseInt(item.quantity),
              imeiNumber: item.imeiNumber || null
            }))
          }
        },
        include: { items: true }
      })

      // 2. Update Stock Ledger (Only for products, not services)
      for (const sItem of sale.items) {
        const itemInfo = await tx.item.findUnique({
          where: { id: sItem.itemId },
          select: { itemType: true }
        })
        if (itemInfo?.itemType === 'product') {
          await tx.stockLedger.create({
            data: {
              itemId: sItem.itemId,
              quantity: sItem.quantity,
              unit: sItem.unit,
              rate: sItem.rate,
              type: 2, // 2 = Stock Out
              refType: 'sale',
              refId: sale.id
            }
          })
        }
      }

      // 3. Generate Invoice
      const subtotal = sale.items.reduce((acc, item) => acc + Number(item.total), 0)
      const dAmount = discountAmount ? parseFloat(discountAmount) : 0
      const tAmount = taxAmount ? parseFloat(taxAmount) : 0
      const totalAmount = subtotal + tAmount - dAmount
      
      const invoiceCount = await tx.invoice.count()
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`

      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          saleId: sale.id,
          customerName: customer,
          customerPhone,
          customerAddress,
          subtotal,
          discountAmount: dAmount,
          taxAmount: tAmount,
          totalAmount,
          paymentStatus: "paid"
        }
      })

      return { sale, invoice }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating sale:", error)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }
}
