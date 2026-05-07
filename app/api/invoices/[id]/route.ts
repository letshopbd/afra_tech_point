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
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)

    console.log(`Attempting to delete invoice with ID: ${id}`);

    // 1. Find the invoice to get the saleId
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { saleId: true }
    })

    if (!invoice) {
      console.log(`Invoice with ID ${id} not found`);
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    console.log(`Associated Sale ID: ${invoice.saleId}`);

    // 2. Delete the Sale (this cascades to Invoice and SaleItems)
    // and manually delete StockLedger entries associated with this Sale
    await prisma.$transaction([
      prisma.stockLedger.deleteMany({
        where: {
          OR: [
            { refType: "SALE", refId: invoice.saleId },
            { refType: "sale", refId: invoice.saleId }
          ]
        }
      }),
      prisma.sale.delete({
        where: { id: invoice.saleId }
      })
    ])

    console.log(`Successfully deleted invoice ${id} and sale ${invoice.saleId}`);

    return NextResponse.json({ success: true, message: "Invoice and associated sale deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: `Server Error: ${error.message || 'Unknown error'}` }, { status: 500 })
  }
}
