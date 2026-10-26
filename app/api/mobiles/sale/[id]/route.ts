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
    const { id } = await params
    const saleId = parseInt(id)

    const sale = await prisma.mobileSale.findUnique({
      where: { id: saleId },
      include: { mobile: true }
    })

    if (!sale) {
      return NextResponse.json({ error: "Mobile sale not found" }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    console.error("Error fetching mobile sale:", error)
    return NextResponse.json({ error: "Failed to fetch mobile sale" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const saleId = parseInt(id)

    const sale = await prisma.mobileSale.findUnique({
      where: { id: saleId },
      include: { mobile: true }
    })

    if (!sale) {
      return NextResponse.json({ error: "Mobile sale not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.mobileSale.delete({ where: { id: saleId } })

      await tx.mobilePhone.update({
        where: { id: sale.mobileId },
        data: { status: 'available' }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting mobile sale:", error)
    return NextResponse.json({ error: "Failed to delete mobile sale" }, { status: 500 })
  }
}
