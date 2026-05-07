import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    
    console.log(`Attempting to delete purchase with ID: ${id}`);
    
    await prisma.$transaction(async (tx) => {
      // 1. Delete stock ledger entries associated with this purchase
      await tx.stockLedger.deleteMany({
        where: { 
          refId: id,
          refType: { in: ['purchase', 'PURCHASE'] }
        }
      })
      
      // 2. Delete purchase
      await tx.purchase.delete({
        where: { id }
      })
    })

    console.log(`Successfully deleted purchase: ${id}`);
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting purchase:", error)
    return NextResponse.json({ error: `Server Error: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}
