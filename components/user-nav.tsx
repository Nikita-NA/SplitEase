"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserNav({
  name,
  email,
  avatar,
}: {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
}) {
  const label = name ?? email ?? "User";
  const initial = label.charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary px-2 py-1">
        <Avatar className="h-7 w-7">
          <AvatarImage src={avatar ?? undefined} />
          <AvatarFallback className="text-xs">{initial}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-foreground max-w-28 truncate">{label}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Sign out
      </Button>
    </div>
  );
}

