import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      wallet: true,
      vipContracts: { where: { status: "active" } },
      referrals: true,
    },
  });

  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Count team levels
  const level1 = user.referrals.length;

  const level2Users = await prisma.user.findMany({
    where: { referrerId: { in: user.referrals.map((r) => r.id) } },
  });

  const level3Users = await prisma.user.findMany({
    where: { referrerId: { in: level2Users.map((r) => r.id) } },
  });

  return NextResponse.json({
    email: user.email,
    inviteCode: user.inviteCode,
    wallet: user.wallet,
    activeVip: user.vipContracts[0] || null,
    team: {
      level1: level1,
      level2: level2Users.length,
      level3: level3Users.length,
    },
  });
}
