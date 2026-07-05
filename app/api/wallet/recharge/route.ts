import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount } = await req.json()

  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Minimum deposit is ETB 10" }, { status: 400 })
  }

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "deposit",
      amount,
      status: "pending",
    },
  })

  return NextResponse.json({ success: true })
}