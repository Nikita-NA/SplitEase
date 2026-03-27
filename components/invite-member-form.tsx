"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function InviteMemberForm({
  groupId,
  canInvite,
}: {
  groupId: string;
  canInvite: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canInvite) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string; ok?: boolean }
        | null;

      if (!res.ok) {
        const message = data?.error ?? "Invite failed.";
        setError(message);
        toast.error(message);
        return;
      }

      setSuccess("Member added.");
      toast.success("Member added.");
      setEmail("");
      router.refresh();
    } catch {
      setError("Invite failed.");
      toast.error("Invite failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card/60">
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">Invite by email</p>
          <p className="text-xs text-muted-foreground">
            Look up a user by email and add them to this group.
          </p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? (
          <p className="text-sm text-success">{success}</p>
        ) : null}

        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            placeholder="member@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!canInvite || isSubmitting}
          />
          <Button type="submit" disabled={!canInvite || isSubmitting || !email.trim()}>
            Invite
          </Button>
        </form>

        {!canInvite ? (
          <p className="text-xs text-muted-foreground">
            Only the group owner can invite members.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

