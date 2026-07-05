import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Get all income-related transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["daily_income", "commission"] },
    },
    orderBy: { createdAt: "desc" },
  });

  // Get VIP purchase transactions too (for context)
  const vipPurchases = await prisma.transaction.findMany({
    where: { userId, type: "vip" },
    orderBy: { createdAt: "desc" },
  });

  // Calculate totals
  const dailyIncomeTotal = transactions
    .filter((t) => t.type === "daily_income")
    .reduce((sum, t) => sum + t.amount, 0);

  const commissionTotal = transactions
    .filter((t) => t.type === "commission")
    .reduce((sum, t) => sum + t.amount, 0);

  // Active VIP contracts summary
  const activeContracts = await prisma.vipContract.findMany({
    where: { userId, status: "active" },
  });

  const expiredContracts = await prisma.vipContract.findMany({
    where: { userId, status: "expired" },
  });

  return NextResponse.json({
    transactions,
    vipPurchases,
    summary: {
      dailyIncomeTotal,
      commissionTotal,
      totalIncome: dailyIncomeTotal + commissionTotal,
      activeContractsCount: activeContracts.length,
      expiredContractsCount: expiredContracts.length,
    },
    activeContracts,
  });
}
