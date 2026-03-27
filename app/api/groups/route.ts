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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
    };

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const description =
      typeof body?.description === "string" ? body.description.trim() : null;

    if (!name) {
      return NextResponse.json(
        { error: "Group name is required." },
        { status: 400 },
      );
    }

    const group = await prisma.$transaction(async (tx) => {
      const createdGroup = await tx.group.create({
        data: {
          name,
          description: description || undefined,
          createdBy: user.id,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: createdGroup.id,
          userId: user.id,
          role: "owner",
        },
      });

      return createdGroup;
    });

    return NextResponse.json({ groupId: group.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/groups failed:", error);
    return NextResponse.json({ error: "Failed to create group." }, { status: 500 });
  }
}

