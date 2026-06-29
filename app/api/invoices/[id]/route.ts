import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: {
          include: {
            items: { include: { item: true } }
          }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: invoiceId } = await params
    const id = parseInt(invoiceId)

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { saleId: true }
    })

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

    await prisma.$transaction([
      prisma.stockLedger.deleteMany({ where: { refId: invoice.saleId, refType: { in: ['sale', 'SALE'] } } }),
      prisma.sale.delete({ where: { id: invoice.saleId } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete Error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
