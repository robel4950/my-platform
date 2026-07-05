import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIP_PLANS } from "@/lib/vipPlans";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { vipLevel, reference } = await req.json();
  const plan = VIP_PLANS.find((p) => p.level === vipLevel);
  if (!plan)
    return NextResponse.json({ error: "Invalid VIP level" }, { status: 400 });

  if (!reference || !reference.trim()) {
    return NextResponse.json(
      { error: "Transaction reference is required" },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  // Check if already has a pending or active request for this level
  const existing = await prisma.vipContract.findFirst({
    where: { userId, vipLevel, status: { in: ["pending", "active"] } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You already have a request or active plan for this level." },
      { status: 400 },
    );
  }

  await prisma.vipContract.create({
    data: {
      userId,
      vipLevel: plan.level,
      amountPaid: plan.price,
      dailyIncome: plan.dailyIncome,
      totalIncomeLimit: plan.totalLimit,
      status: "pending",
      reference,
    },
  });

  return NextResponse.json({ success: true });
}
