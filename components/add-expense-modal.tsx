"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, Equal, Percent, PiSquare } from "lucide-react";
import { formatCurrency } from "@/lib/data";

interface Member {
  id: string;
  name: string;
  avatar: string;
}

interface AddExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  groupId: string;
  currentUserId: string;
}

export function AddExpenseModal({
  open,
  onOpenChange,
  members,
  groupId,
  currentUserId,
}: AddExpenseModalProps) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "");
  const [splitMode, setSplitMode] = useState<"equal" | "percentage" | "custom">(
    "equal"
  );
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [percentageSplits, setPercentageSplits] = useState<
    Record<string, string>
  >({});

  const amountNumber = parseFloat(amount) || 0;
  const memberCount = members.length;
  const equalShare = memberCount > 0 ? amountNumber / memberCount : 0;

  // Initialize splits when members change
  useEffect(() => {
    const initialCustom: Record<string, string> = {};
    const initialPercentage: Record<string, string> = {};
    members.forEach((m) => {
      initialCustom[m.id] = "";
      initialPercentage[m.id] = (100 / members.length).toFixed(1);
    });
    setCustomSplits(initialCustom);
    setPercentageSplits(initialPercentage);
    // Default payer to the current user if present; otherwise fall back to the first member.
    if (members.some((m) => m.id === currentUserId)) {
      setPaidBy(currentUserId);
    } else {
      setPaidBy(members[0]?.id ?? "");
    }
  }, [members]);

  // Calculate totals
  const customTotal = Object.values(customSplits).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );
  const percentageTotal = Object.values(percentageSplits).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const isCustomValid =
    splitMode !== "custom" || Math.abs(customTotal - amountNumber) < 0.01;
  const isPercentageValid =
    splitMode !== "percentage" || Math.abs(percentageTotal - 100) < 0.01;
  const isValid =
    description.trim() !== "" &&
    amountNumber > 0 &&
    isCustomValid &&
    isPercentageValid;

  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const computedSplits = () => {
    if (splitMode === "equal") {
      const perPerson = memberCount > 0 ? amountNumber / memberCount : 0;
      return members.map((m) => ({ userId: m.id, amount: perPerson }));
    }

    if (splitMode === "percentage") {
      return members.map((m) => {
        const pct = parseFloat(percentageSplits[m.id] || "0");
        return { userId: m.id, amount: (pct / 100) * amountNumber };
      });
    }

    // custom
    return members.map((m) => {
      const splitAmount = parseFloat(customSplits[m.id] || "0");
      return { userId: m.id, amount: splitAmount };
    });
  };

  const handleSubmit = async () => {
    setInlineError(null);
    if (!isValid) return;

    if (!groupId) {
      setInlineError("Missing group id.");
      toast.error("Missing group id.");
      return;
    }

    setIsSubmitting(true);
    try {
      const splits = computedSplits();
      const splitsSum = splits.reduce((sum, s) => sum + s.amount, 0);
      const diff = Math.abs(splitsSum - amountNumber);

      if (diff > 0.01) {
        setInlineError("Splits must add up exactly to the total amount.");
        toast.error("Splits must add up exactly to the total amount.");
        return;
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          description,
          amount: amountNumber,
          paidById: paidBy,
          splitMode,
          splits,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        const message = data?.error ?? "Failed to add expense.";
        setInlineError(message);
        toast.error(message);
        return;
      }

      onOpenChange(false);
      resetForm();
      toast.success("Expense added.");
    } catch {
      setInlineError("Failed to add expense.");
      toast.error("Failed to add expense.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setPaidBy(currentUserId);
    setSplitMode("equal");
  };

  const handleCustomSplitChange = (memberId: string, value: string) => {
    setCustomSplits((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const handlePercentageSplitChange = (memberId: string, value: string) => {
    setPercentageSplits((prev) => ({
      ...prev,
      [memberId]: value,
    }));
  };

  const splitEqually = () => {
    const equalSplit = (amountNumber / members.length).toFixed(2);
    const newSplits: Record<string, string> = {};
    members.forEach((m) => {
      newSplits[m.id] = equalSplit;
    });
    setCustomSplits(newSplits);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Add a new expense and split it with group members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Input
                id="description"
                placeholder="What was this expense for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Amount</FieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </Field>

            <Field>
              <FieldLabel>Paid by</FieldLabel>
              <Select value={paidBy} onValueChange={setPaidBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {member.id === currentUserId ? "You" : member.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {/* Split Mode */}
          <div className="space-y-4">
            <FieldLabel>Split Mode</FieldLabel>
            <Tabs
              value={splitMode}
              onValueChange={(v) =>
                setSplitMode(v as "equal" | "percentage" | "custom")
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="equal" className="gap-1.5">
                  <Equal className="w-4 h-4" />
                  Equal
                </TabsTrigger>
                <TabsTrigger value="percentage" className="gap-1.5">
                  <Percent className="w-4 h-4" />
                  Percentage
                </TabsTrigger>
                <TabsTrigger value="custom" className="gap-1.5">
                  <PiSquare className="w-4 h-4" />
                  Custom
                </TabsTrigger>
              </TabsList>

              {/* Equal Split */}
              <TabsContent value="equal" className="mt-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Split equally between {memberCount} members
                  </p>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between py-2 px-3 rounded-md bg-card"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">
                            {member.id === currentUserId ? "You" : member.name}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">
                          {formatCurrency(equalShare)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Percentage Split */}
              <TabsContent value="percentage" className="mt-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Assign percentage to each member
                  </p>
                  <div className="space-y-2">
                    {members.map((member) => {
                      const percentage = parseFloat(
                        percentageSplits[member.id] || "0"
                      );
                      const memberAmount = (amountNumber * percentage) / 100;

                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 py-2 px-3 rounded-md bg-card"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">
                              {member.id === currentUserId
                                ? "You"
                                : member.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="relative w-20">
                              <Input
                                type="number"
                                value={percentageSplits[member.id] || ""}
                                onChange={(e) =>
                                  handlePercentageSplitChange(
                                    member.id,
                                    e.target.value
                                  )
                                }
                                className="pr-6 h-9 text-right"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                %
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground w-20 text-right">
                              {formatCurrency(memberAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Percentage Total */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Total
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          isPercentageValid ? "default" : "destructive"
                        }
                        className="gap-1"
                      >
                        {isPercentageValid ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {percentageTotal.toFixed(1)}%
                      </Badge>
                      {!isPercentageValid && (
                        <span className="text-xs text-destructive">
                          Must equal 100%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Custom Split */}
              <TabsContent value="custom" className="mt-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      Enter custom amount for each member
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={splitEqually}
                      className="text-xs"
                    >
                      Split Equally
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 py-2 px-3 rounded-md bg-card"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                              {member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">
                            {member.id === currentUserId
                              ? "You"
                              : member.name}
                          </span>
                        </div>
                        <div className="relative w-28">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            ₹
                          </span>
                          <Input
                            type="number"
                            value={customSplits[member.id] || ""}
                            onChange={(e) =>
                              handleCustomSplitChange(member.id, e.target.value)
                            }
                            className="pl-6 h-9 text-right"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Total */}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Total
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isCustomValid ? "default" : "destructive"}
                        className="gap-1"
                      >
                        {isCustomValid ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {formatCurrency(customTotal)}
                      </Badge>
                      {!isCustomValid && (
                        <span className="text-xs text-destructive">
                          Must equal {formatCurrency(amountNumber)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
          {inlineError ? (
            <div className="w-full text-sm text-destructive pb-2 sm:pb-0">
              {inlineError}
            </div>
          ) : null}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            Add Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
