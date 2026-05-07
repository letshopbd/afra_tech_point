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
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    
    console.log(`Attempting to delete item with ID: ${id}`);
    
    const deletedItem = await prisma.item.delete({
      where: { id }
    })
    
    console.log(`Successfully deleted item: ${deletedItem.id}`);
    
    return NextResponse.json({ success: true, id: deletedItem.id })
  } catch (error: any) {
    console.error("Error deleting item:", error)
    // If it's a Prisma error P2003 (Foreign key constraint failed)
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Cannot delete item because it is used in sales or purchases. Delete those records first." 
      }, { status: 400 })
    }
    return NextResponse.json({ error: `Server Error: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}
