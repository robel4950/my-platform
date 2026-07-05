import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const contracts = await prisma.vipContract.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json({ contracts });
}
