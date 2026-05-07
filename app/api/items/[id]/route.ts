import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const body = await req.json()
    const { name, description, cost } = body

    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        cost: cost ? parseFloat(cost) : 0,
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: itemId } = await params
    const id = parseInt(itemId)
    
    await prisma.item.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete item. Delete associated records first." }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
