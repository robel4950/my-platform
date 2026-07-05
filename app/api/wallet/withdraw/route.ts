import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { amount } = await req.json()

  if (!amount || amount < 50) {
    return NextResponse.json({ error: "Minimum withdrawal is ETB 50" }, { status: 400 })
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: session.user.id },
  })

  const totalBalance = (wallet?.mainBalance || 0) + (wallet?.investmentBalance || 0) + (wallet?.referralBalance || 0)

  if (totalBalance < amount) {
    return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
  }

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      type: "withdraw",
      amount,
      status: "pending",
    },
  })

  return NextResponse.json({ success: true })
}