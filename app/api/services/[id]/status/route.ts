import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const body = await req.json()
    const { serviceStatus } = body

    if (!serviceStatus) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: { serviceStatus }
    })

    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error("Error updating service status:", error)
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
