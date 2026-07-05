import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contractId } = await req.json();

  const contract = await prisma.vipContract.findFirst({
    where: { id: contractId, userId: session.user.id, status: "active" },
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Active contract not found" },
      { status: 404 },
    );
  }

  // Check if already claimed today
  if (contract.lastClaimedAt) {
    const lastClaim = new Date(contract.lastClaimedAt);
    const now = new Date();
    const sameDay =
      lastClaim.getFullYear() === now.getFullYear() &&
      lastClaim.getMonth() === now.getMonth() &&
      lastClaim.getDate() === now.getDate();

    if (sameDay) {
      return NextResponse.json(
        { error: "Already claimed today. Come back tomorrow!" },
        { status: 400 },
      );
    }
  }

  const remaining = contract.totalIncomeLimit - contract.earnedSoFar;
  if (remaining <= 0) {
    await prisma.vipContract.update({
      where: { id: contract.id },
      data: { status: "expired" },
    });
    return NextResponse.json(
      { error: "This VIP plan has reached its earning limit" },
      { status: 400 },
    );
  }

  const claimAmount = Math.min(contract.dailyIncome, remaining);

  await prisma.$transaction([
    prisma.vipContract.update({
      where: { id: contract.id },
      data: {
        earnedSoFar: { increment: claimAmount },
        lastClaimedAt: new Date(),
        status: claimAmount >= remaining ? "expired" : "active",
      },
    }),
    prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: "daily_income",
        amount: claimAmount,
        status: "approved",
      },
    }),
  ]);

  return NextResponse.json({ success: true, amount: claimAmount });
}
