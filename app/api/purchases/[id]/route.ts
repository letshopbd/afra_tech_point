import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: purchaseId } = await params
    const id = parseInt(purchaseId)
    
    await prisma.$transaction([
      prisma.stockLedger.deleteMany({ where: { refId: id, refType: { in: ['purchase', 'PURCHASE'] } } }),
      prisma.purchase.delete({ where: { id } })
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
