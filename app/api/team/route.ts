import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Get level 1 referrals
  const level1Users = await prisma.user.findMany({
    where: { referrerId: userId },
    include: { vipContracts: { select: { vipLevel: true } } },
  });

  // Get level 2 referrals
  const level2Users = await prisma.user.findMany({
    where: { referrerId: { in: level1Users.map((u) => u.id) } },
    include: { vipContracts: { select: { vipLevel: true } } },
  });

  // Get level 3 referrals
  const level3Users = await prisma.user.findMany({
    where: { referrerId: { in: level2Users.map((u) => u.id) } },
    include: { vipContracts: { select: { vipLevel: true } } },
  });

  // Calculate earnings from commissions
  const commissions = await prisma.commission.findMany({
    where: { toUserId: userId },
  });

  const level1Earnings = commissions
    .filter((c) => c.level === 1)
    .reduce((sum, c) => sum + c.amount, 0);
  const level2Earnings = commissions
    .filter((c) => c.level === 2)
    .reduce((sum, c) => sum + c.amount, 0);
  const level3Earnings = commissions
    .filter((c) => c.level === 3)
    .reduce((sum, c) => sum + c.amount, 0);

  return NextResponse.json({
    level1: {
      count: level1Users.length,
      users: level1Users,
      earnings: level1Earnings,
    },
    level2: {
      count: level2Users.length,
      users: level2Users,
      earnings: level2Earnings,
    },
    level3: {
      count: level3Users.length,
      users: level3Users,
      earnings: level3Earnings,
    },
    totalEarnings: level1Earnings + level2Earnings + level3Earnings,
    totalTeamSize: level1Users.length + level2Users.length + level3Users.length,
  });
}
