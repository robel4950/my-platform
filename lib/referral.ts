import { prisma } from "./prisma";

const COMMISSION_RATES: Record<number, number> = { 1: 0.18, 2: 0.05, 3: 0.02 };

export async function distributeCommissions(
  investorId: string,
  investmentAmount: number,
) {
  let currentUserId = investorId;

  for (let level = 1; level <= 3; level++) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { referrerId: true },
    });

    if (!currentUser?.referrerId) break;

    const referrerId = currentUser.referrerId;
    const rate = COMMISSION_RATES[level];
    const commissionAmount = investmentAmount * rate;

    await prisma.commission.create({
      data: {
        fromUserId: investorId,
        toUserId: referrerId,
        level,
        percentage: rate * 100,
        amount: commissionAmount,
      },
    });

    await prisma.wallet.update({
      where: { userId: referrerId },
      data: { referralBalance: { increment: commissionAmount } },
    });

    await prisma.transaction.create({
      data: {
        userId: referrerId,
        type: "commission",
        amount: commissionAmount,
        status: "approved",
      },
    });

    currentUserId = referrerId;
  }
}
