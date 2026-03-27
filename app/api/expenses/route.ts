import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SplitInput = { userId: string; amount: number };

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
      groupId?: string;
      description?: string;
      amount?: unknown;
      paidById?: string;
      splitMode?: string;
      splits?: SplitInput[];
    };

    const groupId =
      typeof body?.groupId === "string" ? body.groupId : null;
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;
    const amount =
      typeof body?.amount === "number"
        ? body.amount
        : typeof body?.amount === "string"
          ? parseFloat(body.amount)
          : NaN;
    const paidById = typeof body?.paidById === "string" ? body.paidById : null;
    const splitMode =
      typeof body?.splitMode === "string" ? body.splitMode : null;
    const splits = Array.isArray(body?.splits) ? body.splits : [];

    if (
      !groupId ||
      !description ||
      !paidById ||
      !splitMode ||
      !Number.isFinite(amount)
    ) {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0." },
        { status: 400 },
      );
    }

    if (!["equal", "percentage", "custom"].includes(splitMode)) {
      return NextResponse.json({ error: "Invalid splitMode." }, { status: 400 });
    }

    const isMember = await prisma.groupMember.findFirst({
      where: { groupId, userId: currentUser.id },
      select: { userId: true },
    });
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!splits.length) {
      return NextResponse.json({ error: "Splits are required." }, { status: 400 });
    }

    const splitsWithParsed = splits
      .map((s) => ({
        userId: typeof s?.userId === "string" ? s.userId : null,
        amount: typeof s?.amount === "number" ? s.amount : NaN,
      }))
      .filter(
        (s): s is { userId: string; amount: number } =>
          Boolean(s.userId) && Number.isFinite(s.amount),
      );

    if (!splitsWithParsed.length) {
      return NextResponse.json({ error: "Invalid splits." }, { status: 400 });
    }

    const groupMemberRows = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    const allGroupMemberIds = groupMemberRows.map((m) => m.userId);
    const allMemberSet = new Set(allGroupMemberIds);

    if (splitsWithParsed.length !== allGroupMemberIds.length) {
      return NextResponse.json(
        { error: "Splits must include every group member." },
        { status: 400 },
      );
    }

    const distinctSplitUserIds = Array.from(
      new Set(splitsWithParsed.map((s) => s.userId)),
    );
    if (distinctSplitUserIds.length !== allGroupMemberIds.length) {
      return NextResponse.json(
        { error: "Splits must include each member exactly once." },
        { status: 400 },
      );
    }

    const missingFromSplits = allGroupMemberIds.filter(
      (id) => !distinctSplitUserIds.includes(id),
    );
    if (missingFromSplits.length) {
      return NextResponse.json(
        {
          error: "Splits must include every group member.",
          missing: missingFromSplits,
        },
        { status: 400 },
      );
    }

    const splitsSum = splitsWithParsed.reduce((sum, s) => sum + s.amount, 0);
    const diff = Math.abs(splitsSum - amount);
    if (diff > 0.01) {
      return NextResponse.json(
        { error: `Splits must sum to total amount. Difference: ${diff}` },
        { status: 400 },
      );
    }

    const paidByMember = await prisma.groupMember.findFirst({
      where: { groupId, userId: paidById },
      select: { userId: true },
    });
    if (!paidByMember) {
      return NextResponse.json(
        { error: "paidById must be a group member." },
        { status: 400 },
      );
    }

    for (const s of splitsWithParsed) {
      if (!allMemberSet.has(s.userId)) {
        return NextResponse.json(
          { error: "All split users must be group members." },
          { status: 400 },
        );
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          groupId,
          paidById,
          amount,
          description,
          splitMode,
        },
      });

      await tx.expenseSplit.createMany({
        data: splitsWithParsed.map((s) => ({
          expenseId: expense.id,
          userId: s.userId,
          amount: s.amount,
        })),
      });

      const expenseWithSplits = await tx.expense.findUnique({
        where: { id: expense.id },
        include: { splits: true },
      });

      return expenseWithSplits;
    });

    if (!created) {
      return NextResponse.json(
        { error: "Failed to create expense." },
        { status: 500 },
      );
    }

    return NextResponse.json({ expense: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database error while creating expense." },
        { status: 500 },
      );
    }
    console.error("POST /api/expenses failed:", error);
    return NextResponse.json(
      { error: "Unexpected server error while creating expense." },
      { status: 500 },
    );
  }
}

