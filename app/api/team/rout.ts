import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id

  // Level 1 — direct referrals
  const level1Users = await prisma.user.findMany({
    where: { referrerId: userId },
    select: {
      id: true,
      email: true,
      createdAt: true,
      vipContracts: { where: { status: "active" }, select: { vipLevel: true } },
    },
  })

  const level1Ids = level1Users.map((u: { id: string }) => u.id)

  // Level 2 — referrals of level 1
  const level2Users = level1Ids.length
    ? await prisma.user.findMany({
        where: { referrerId: { in: level1Ids } },
        select: {
          id: true,
          email: true,
          createdAt: true,
          vipContracts: { where: { status: "active" }, select: { vipLevel: true } },
        },
      })
    : []

  const level2Ids = level2Users.map((u: { id: string }) => u.id)

  // Level 3 — referrals of level 2
  const level3Users = level2Ids.length
    ? await prisma.user.findMany({
        where: { referrerId: { in: level2Ids } },
        select: {
          id: true,
          email: true,
          createdAt: true,
          vipContracts: { where: { status: "active" }, select: { vipLevel: true } },
        },
      })
    : []

  // Commission earned per level
  const commissions = await prisma.commission.findMany({
    where: { toUserId: userId },
  })

  const earningsByLevel = {
    1: commissions.filter(c => c.level === 1).reduce((sum, c) => sum + c.amount, 0),
    2: commissions.filter(c => c.level === 2).reduce((sum, c) => sum + c.amount, 0),
    3: commissions.filter(c => c.level === 3).reduce((sum, c) => sum + c.amount, 0),
  }

  const totalEarnings = earningsByLevel[1] + earningsByLevel[2] + earningsByLevel[3]

  return NextResponse.json({
    level1: {
      count: level1Users.length,
      users: level1Users,
      earnings: earningsByLevel[1],
    },
    level2: {
      count: level2Users.length,
      users: level2Users,
      earnings: earningsByLevel[2],
    },
    level3: {
      count: level3Users.length,
      users: level3Users,
      earnings: earningsByLevel[3],
    },
    totalEarnings,
    totalTeamSize: level1Users.length + level2Users.length + level3Users.length,
  })
}