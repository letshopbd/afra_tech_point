import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const phoneId = parseInt(id)

    const existing = await prisma.mobilePhone.findUnique({
      where: { id: phoneId },
      include: { mobileSale: true }
    })

    if (!existing) {
      return NextResponse.json({ error: "Mobile phone not found" }, { status: 404 })
    }

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
      warrantyUnit,
      notes
    } = body

    if (!brand) return NextResponse.json({ error: "Brand is required" }, { status: 400 })
    if (!model) return NextResponse.json({ error: "Model is required" }, { status: 400 })
    if (!imei1) return NextResponse.json({ error: "IMEI 1 is required" }, { status: 400 })

    // Check IMEI 1 uniqueness (exclude self)
    if (imei1 !== existing.imei1) {
      const existingImei1 = await prisma.mobilePhone.findUnique({ where: { imei1 } })
      if (existingImei1) {
        return NextResponse.json({ error: `IMEI 1 "${imei1}" already exists` }, { status: 400 })
      }
    }

    // Check IMEI 2 uniqueness (exclude self)
    if (imei2 && imei2 !== existing.imei2) {
      const existingImei2 = await prisma.mobilePhone.findUnique({ where: { imei2 } })
      if (existingImei2) {
        return NextResponse.json({ error: `IMEI 2 "${imei2}" already exists` }, { status: 400 })
      }
    }

    const updated = await prisma.mobilePhone.update({
      where: { id: phoneId },
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
        warrantyUnit: hasWarranty ? (warrantyUnit || 'day') : null,
        notes: notes || null,
        // Do not update status if already sold
        ...(existing.status !== 'sold' ? {} : {})
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating mobile phone:", error)
    return NextResponse.json({ error: "Failed to update mobile phone" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const phoneId = parseInt(id)

    const existing = await prisma.mobilePhone.findUnique({
      where: { id: phoneId },
      include: { mobileSale: true }
    })

    if (!existing) {
      return NextResponse.json({ error: "Mobile phone not found" }, { status: 404 })
    }

    if (existing.mobileSale) {
      return NextResponse.json(
        { error: "Cannot delete: this phone has a sale record. Delete the sale first." },
        { status: 400 }
      )
    }

    await prisma.mobilePhone.delete({ where: { id: phoneId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting mobile phone:", error)
    return NextResponse.json({ error: "Failed to delete mobile phone" }, { status: 500 })
  }
}
