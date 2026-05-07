import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: saleId } = await params
    const id = parseInt(saleId)
    
    await prisma.$transaction([
      prisma.stockLedger.deleteMany({ where: { refId: id, refType: { in: ['sale', 'SALE'] } } }),
      prisma.invoice.deleteMany({ where: { saleId: id } }),
      prisma.sale.delete({ where: { id } })
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
