import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  const { email, password, inviteCode } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 })
  }

  let referrerId = null
  if (inviteCode) {
    const referrer = await prisma.user.findUnique({ where: { inviteCode } })
    if (referrer) referrerId = referrer.id
  }

  const hashed = await bcrypt.hash(password, 10)
  const newInviteCode = nanoid(8).toUpperCase()

  await prisma.user.create({
    data: {
      email,
      password: hashed,
      inviteCode: newInviteCode,
      referrerId,
      wallet: { create: {} },
    },
  })

  return NextResponse.json({ success: true })
}