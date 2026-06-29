import { NextResponse } from "next/server"
import { scanQueue } from "../queue"

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || ""

    let barcode = ""

    if (contentType.includes("json")) {
      const body = await req.json()
      barcode = body.barcode || body.code || body.text || body.data || ""
    } else {
      const text = await req.text()
      const params = new URLSearchParams(text)
      barcode = params.get("barcode") || params.get("code") || params.get("text") || params.get("data") || text.trim()
    }

    if (!barcode) {
      return NextResponse.json({ error: "barcode is required" }, { status: 400 })
    }

    scanQueue.push(barcode.trim())
    console.log(`[Scan Input] ${barcode.trim()}`)

    return NextResponse.json({ success: true, barcode: barcode.trim() })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const barcode = searchParams.get("barcode") || searchParams.get("code") || searchParams.get("text") || searchParams.get("data")

  if (barcode) {
    scanQueue.push(barcode.trim())
    console.log(`[Scan Input GET] ${barcode.trim()}`)
    return NextResponse.json({ success: true, barcode: barcode.trim() })
  }

  return NextResponse.json({ error: "Send barcode via ?barcode=XXX or POST" }, { status: 400 })
}
