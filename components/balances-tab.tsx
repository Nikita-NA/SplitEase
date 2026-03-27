"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/data";

type BalanceRow = {
  fromUserId: string;
  toUserId: string;
  amount: number;
  fromName: string;
  toName: string;
};

export function BalancesTab({
  rows,
  groupId,
  currentUserId,
}: {
  rows: BalanceRow[];
  groupId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const settleUp = async (row: BalanceRow) => {
    const key = `${row.fromUserId}-${row.toUserId}-${row.amount}`;
    setLoadingKey(key);

    try {
      const res = await fetch("/api/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          fromUserId: row.fromUserId,
          toUserId: row.toUserId,
          amount: row.amount,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!res.ok) {
        toast.error(data?.error ?? "Failed to settle up.");
        return;
      }

      toast.success("Settlement recorded.");
      router.refresh();
    } catch {
      toast.error("Failed to settle up.");
    } finally {
      setLoadingKey(null);
    }
  };

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-success font-medium">All settled up!</p>
          <p className="text-sm text-muted-foreground mt-1">
            No outstanding balances in this group
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, idx) => {
        const involved =
          row.fromUserId === currentUserId || row.toUserId === currentUserId;
        const isLoading =
          loadingKey === `${row.fromUserId}-${row.toUserId}-${row.amount}`;

        return (
          <Card
            key={`${row.fromUserId}-${row.toUserId}-${idx}`}
            className={involved ? "border-primary/40 bg-primary/5" : ""}
          >
            <CardContent className="p-4 flex items-center justify-between gap-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-8 w-24" />
                </>
              ) : (
                <>
                  <p className="text-sm text-foreground">
                    <span className={involved ? "font-semibold" : "font-medium"}>
                      {row.fromUserId === currentUserId ? "You" : row.fromName}
                    </span>{" "}
                    owes{" "}
                    <span className={involved ? "font-semibold" : "font-medium"}>
                      {row.toUserId === currentUserId ? "You" : row.toName}
                    </span>{" "}
                    <span className="font-semibold">{formatCurrency(row.amount)}</span>
                  </p>

                  <Button
                    size="sm"
                    onClick={() => settleUp(row)}
                    disabled={isLoading}
                  >
                    Settle Up
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

