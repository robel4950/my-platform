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
  const { action } = await req.json();

  const contract = await prisma.vipContract.findUnique({ where: { id } });
  if (!contract || contract.status !== "pending") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (action === "approve") {
    await prisma.vipContract.update({
      where: { id },
      data: { status: "active", startDate: new Date() },
    });

    // Distribute referral commissions now that it's approved
    const { distributeCommissions } = await import("@/lib/referral");
    await distributeCommissions(contract.userId, contract.amountPaid);
  } else if (action === "reject") {
    await prisma.vipContract.update({
      where: { id },
      data: { status: "rejected" },
    });
  }

  return NextResponse.json({ success: true });
}
