import { NextResponse } from "next/server"
import { scanQueue } from "../queue"

export async function GET() {
  const barcodes = [...scanQueue]
  scanQueue.length = 0
  return NextResponse.json({ barcodes })
}
