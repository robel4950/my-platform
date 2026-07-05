import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const { action } = await req.json(); // "approve" or "reject"

  const tx = await prisma.transaction.findUnique({ where: { id } });
  if (!tx)
    return NextResponse.json(
      { error: "Transaction not found" },
      { status: 404 },
    );
  if (tx.status !== "pending") {
    return NextResponse.json(
      { error: "Transaction already processed" },
      { status: 400 },
    );
  }

  if (action === "approve") {
    if (tx.type === "deposit") {
      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: tx.userId },
          data: { mainBalance: { increment: tx.amount } },
        }),
        prisma.transaction.update({
          where: { id },
          data: { status: "approved" },
        }),
      ]);
    } else if (tx.type === "withdraw") {
      // Deduct from wallet (priority: main -> investment -> referral)
      const wallet = await prisma.wallet.findUnique({
        where: { userId: tx.userId },
      });
      if (!wallet)
        return NextResponse.json(
          { error: "Wallet not found" },
          { status: 404 },
        );

      let remaining = tx.amount;
      const mainDeduct = Math.min(wallet.mainBalance, remaining);
      remaining -= mainDeduct;
      const investDeduct = Math.min(wallet.investmentBalance, remaining);
      remaining -= investDeduct;
      const referralDeduct = Math.min(wallet.referralBalance, remaining);

      await prisma.$transaction([
        prisma.wallet.update({
          where: { userId: tx.userId },
          data: {
            mainBalance: { decrement: mainDeduct },
            investmentBalance: { decrement: investDeduct },
            referralBalance: { decrement: referralDeduct },
          },
        }),
        prisma.transaction.update({
          where: { id },
          data: { status: "approved" },
        }),
      ]);
    }
  } else if (action === "reject") {
    await prisma.transaction.update({
      where: { id },
      data: { status: "rejected" },
    });
  }

  return NextResponse.json({ success: true });
}
