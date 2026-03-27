import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      groupId?: unknown;
      fromUserId?: unknown;
      toUserId?: unknown;
      amount?: unknown;
    };

    const groupId = typeof body.groupId === "string" ? body.groupId : null;
    const fromUserId =
      typeof body.fromUserId === "string" ? body.fromUserId : null;
    const toUserId = typeof body.toUserId === "string" ? body.toUserId : null;
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.amount === "string"
          ? parseFloat(body.amount)
          : NaN;

    if (!groupId || !fromUserId || !toUserId || !Number.isFinite(amount)) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be > 0." }, { status: 400 });
    }
    if (fromUserId === toUserId) {
      return NextResponse.json(
        { error: "Cannot settle with the same user." },
        { status: 400 },
      );
    }

    const memberships = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: [fromUserId, toUserId, currentUser.id] },
      },
      select: { userId: true },
    });
    const memberSet = new Set(memberships.map((m) => m.userId));
    if (
      !memberSet.has(fromUserId) ||
      !memberSet.has(toUserId) ||
      !memberSet.has(currentUser.id)
    ) {
      return NextResponse.json(
        { error: "Users must be members of this group." },
        { status: 403 },
      );
    }

    if (currentUser.id !== fromUserId && currentUser.id !== toUserId) {
      return NextResponse.json(
        { error: "You can only settle transactions involving you." },
        { status: 403 },
      );
    }

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        fromUserId,
        toUserId,
        amount,
      },
    });

    return NextResponse.json({ settlement }, { status: 201 });
  } catch (error) {
    console.error("POST /api/settlements failed:", error);
    return NextResponse.json(
      { error: "Unexpected server error while creating settlement." },
      { status: 500 },
    );
  }
}

