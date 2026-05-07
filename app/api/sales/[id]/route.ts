import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    
    console.log(`Attempting to delete sale with ID: ${id}`);
    
    await prisma.$transaction(async (tx) => {
      // 1. Delete stock ledger entries
      await tx.stockLedger.deleteMany({
        where: { 
          refId: id,
          refType: { in: ['sale', 'SALE'] }
        }
      })
      
      // 2. Delete invoice associated with sale
      await tx.invoice.deleteMany({
        where: { saleId: id }
      })
      
      // 3. Delete sale
      await tx.sale.delete({
        where: { id }
      })
    })

    console.log(`Successfully deleted sale: ${id}`);
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting sale:", error)
    return NextResponse.json({ error: `Server Error: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}
