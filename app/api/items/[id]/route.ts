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
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const body = await req.json()
    const { name, description, cost, price, itemType, barcode } = body

    if (barcode) {
      const duplicateBarcode = await prisma.item.findUnique({
        where: { barcode }
      })
      if (duplicateBarcode && duplicateBarcode.id !== id) {
        return NextResponse.json(
          { error: `This barcode is already assigned to item: ${duplicateBarcode.name}` }, 
          { status: 400 }
        )
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        cost: cost ? parseFloat(cost) : 0,
        price: price ? parseFloat(price) : 0,
        itemType: itemType || "product",
        barcode: barcode || null
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: itemId } = await params
    const id = parseInt(itemId)
    
    await prisma.item.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    const err = error as { code?: string; message?: string }
    if (err.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete item. Delete associated records first." }, { status: 400 })
    }
    return NextResponse.json({ error: err.message || "Failed to delete item" }, { status: 500 })
  }
}
