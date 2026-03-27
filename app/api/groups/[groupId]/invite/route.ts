import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ groupId: string }> },
) {
  try {
    const params = await context.params;
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

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: params.groupId, userId: currentUser.id },
      select: { role: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a group member." }, { status: 403 });
    }

    if (membership.role !== "owner") {
      return NextResponse.json(
        { error: "Only the group owner can invite members." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { email?: unknown };
    const invitedEmail =
      typeof body?.email === "string" ? body.email.trim() : null;

    if (!invitedEmail) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const invitedUser = await prisma.user.findUnique({
      where: { email: invitedEmail },
      select: { id: true },
    });

    if (!invitedUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.groupMember.create({
      data: {
        groupId: params.groupId,
        userId: invitedUser.id,
        role: "member",
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "That user is already in this group." },
          { status: 409 },
        );
      }
    }

    console.error("POST /api/groups/[groupId]/invite failed:", err);
    return NextResponse.json({ error: "Invite failed." }, { status: 500 });
  }
}

