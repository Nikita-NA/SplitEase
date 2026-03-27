"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddExpenseModal } from "@/components/add-expense-modal";

export function GroupAddExpenseLauncher({
  groupId,
  currentUserId,
  members,
}: {
  groupId: string;
  currentUserId: string;
  members: Array<{ id: string; name: string; avatar: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 px-6 gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </Button>
      </div>

      <AddExpenseModal
        open={isOpen}
        onOpenChange={setIsOpen}
        groupId={groupId}
        currentUserId={currentUserId}
        members={members}
      />
    </>
  );
}

