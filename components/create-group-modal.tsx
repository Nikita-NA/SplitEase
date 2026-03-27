"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Plus } from "lucide-react";

export function CreateGroupModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setDescription("");
    setError(null);
  };

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        const message = data?.error ?? "Failed to create group.";
        setError(message);
        toast.error(message);
        return;
      }

      const data = (await res.json()) as { groupId: string };
      setOpen(false);
      reset();
      router.push(`/groups/${data.groupId}`);
    } catch {
      setError("Failed to create group.");
      toast.error("Failed to create group.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : setOpen(false))}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Create Group</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Add a name and description for your new expense group.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive text-center">{error}</p>
        ) : null}

        <FieldGroup className="py-4">
          <Field>
            <FieldLabel htmlFor="groupName">Group Name</FieldLabel>
            <Input
              id="groupName"
              placeholder="e.g., Weekend Trip"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="groupDescription">Description</FieldLabel>
            <Input
              id="groupDescription"
              placeholder="Optional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              reset();
            }}
            type="button"
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !name.trim()}
            type="button"
          >
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

