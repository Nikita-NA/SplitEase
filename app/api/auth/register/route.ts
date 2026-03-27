import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };

    const email = typeof body?.email === "string" ? body.email.trim() : null;
    const password =
      typeof body?.password === "string" ? body.password : null;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to register." },
      { status: 500 },
    );
  }
}

