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
    const sales = await prisma.mobileSale.findMany({
      include: { mobile: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error("Error fetching mobile sales:", error)
    return NextResponse.json({ error: "Failed to fetch mobile sales" }, { status: 500 })
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
      mobileId,
      customer,
      customerPhone,
      customerAddress,
      salePrice,
      discountAmount,
      notes,
      saleDate
    } = body

    if (!mobileId) return NextResponse.json({ error: "Mobile phone is required" }, { status: 400 })
    if (!customer) return NextResponse.json({ error: "Customer name is required" }, { status: 400 })

    const phone = await prisma.mobilePhone.findUnique({ where: { id: parseInt(mobileId) } })
    if (!phone) {
      return NextResponse.json({ error: "Mobile phone not found" }, { status: 404 })
    }

    if (phone.status !== 'available') {
      return NextResponse.json({ error: "This phone is not available for sale" }, { status: 400 })
    }

    // Generate invoice number: MOB-YYYY-NNNNNN
    const year = new Date().getFullYear()
    const lastSale = await prisma.mobileSale.findFirst({
      where: { invoiceNumber: { startsWith: `MOB-${year}-` } },
      orderBy: { id: 'desc' }
    })

    let nextSeq = 1
    if (lastSale) {
      const parts = lastSale.invoiceNumber.split('-')
      const lastSeq = parseInt(parts[2] || '0', 10)
      nextSeq = lastSeq + 1
    }

    const invoiceNumber = `MOB-${year}-${String(nextSeq).padStart(6, '0')}`

    const finalSalePrice = salePrice !== undefined ? parseFloat(salePrice) : Number(phone.salePrice)
    const finalDiscount = discountAmount ? parseFloat(discountAmount) : 0
    const totalAmount = finalSalePrice - finalDiscount

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.mobileSale.create({
        data: {
          invoiceNumber,
          mobileId: parseInt(mobileId),
          customer,
          customerPhone: customerPhone || null,
          customerAddress: customerAddress || null,
          salePrice: finalSalePrice,
          discountAmount: finalDiscount,
          totalAmount,
          notes: notes || null,
          saleDate: saleDate ? new Date(saleDate) : new Date()
        },
        include: { mobile: true }
      })

      await tx.mobilePhone.update({
        where: { id: parseInt(mobileId) },
        data: { status: 'sold' }
      })

      return sale
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating mobile sale:", error)
    return NextResponse.json({ error: "Failed to create mobile sale" }, { status: 500 })
  }
}
