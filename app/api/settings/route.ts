import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let settings = await prisma.settings.findFirst()
    
    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          adminName: "Admin",
          companyName: "Afra Tech Point",
          currency: "৳",
          invoiceCompanyName: "Afra Tech Point",
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { id, ...data } = body

    let settings
    if (id) {
      settings = await prisma.settings.update({
        where: { id: parseInt(id) },
        data
      })
    } else {
      settings = await prisma.settings.create({ data })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
