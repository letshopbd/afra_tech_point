import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id: saleId } = await params
    const id = parseInt(saleId)
    
    await prisma.$transaction([
      prisma.stockLedger.deleteMany({ where: { refId: id, refType: { in: ['sale', 'SALE'] } } }),
      prisma.invoice.deleteMany({ where: { saleId: id } }),
      prisma.sale.delete({ where: { id } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
