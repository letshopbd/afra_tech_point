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
    const statusFilter = searchParams.get('status')

    const phones = await prisma.mobilePhone.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      include: { mobileSale: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(phones)
  } catch (error) {
    console.error("Error fetching mobile phones:", error)
    return NextResponse.json({ error: "Failed to fetch mobile phones" }, { status: 500 })
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
      brand,
      model,
      color,
      ram,
      rom,
      imei1,
      imei2,
      purchasePrice,
      salePrice,
      hasWarranty,
      warrantyDays,
      notes
    } = body

    if (!brand) return NextResponse.json({ error: "Brand is required" }, { status: 400 })
    if (!model) return NextResponse.json({ error: "Model is required" }, { status: 400 })
    if (!imei1) return NextResponse.json({ error: "IMEI 1 is required" }, { status: 400 })

    // Check IMEI 1 uniqueness
    const existingImei1 = await prisma.mobilePhone.findUnique({ where: { imei1 } })
    if (existingImei1) {
      return NextResponse.json({ error: `IMEI 1 "${imei1}" already exists` }, { status: 400 })
    }

    // Check IMEI 2 uniqueness if provided
    if (imei2) {
      const existingImei2 = await prisma.mobilePhone.findUnique({ where: { imei2 } })
      if (existingImei2) {
        return NextResponse.json({ error: `IMEI 2 "${imei2}" already exists` }, { status: 400 })
      }
    }

    const phone = await prisma.mobilePhone.create({
      data: {
        brand,
        model,
        color: color || null,
        ram: ram || null,
        rom: rom || null,
        imei1,
        imei2: imei2 || null,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        salePrice: salePrice ? parseFloat(salePrice) : 0,
        hasWarranty: !!hasWarranty,
        warrantyDays: hasWarranty && warrantyDays ? parseInt(warrantyDays) : null,
        notes: notes || null,
        status: 'available'
      }
    })

    return NextResponse.json(phone, { status: 201 })
  } catch (error) {
    console.error("Error creating mobile phone:", error)
    return NextResponse.json({ error: "Failed to create mobile phone" }, { status: 500 })
  }
}
