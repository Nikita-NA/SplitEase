import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare, hash } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
const authSecret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

if (!authSecret) {
  throw new Error("Missing NEXTAUTH_SECRET (or AUTH_SECRET) environment variable.");
}

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Missing Google OAuth env vars. Set GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET (or AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET).",
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret,
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) return null;

        const passwordMatches = await compare(password, user.password);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar ?? undefined,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
});

// Helper for signup flow (hash before storing in DB).
export async function hashPassword(password: string) {
  return hash(password, 10);
}
