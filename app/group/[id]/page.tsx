"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Receipt,
  ArrowLeft,
  Plus,
  Wallet,
  Clock,
  ArrowRight,
  Users,
} from "lucide-react";
import {
  getGroupById,
  getUserById,
  getExpensesByGroupId,
  getBalancesByGroupId,
  getActivitiesByGroupId,
  formatCurrency,
  formatDate,
  currentUser,
} from "@/lib/data";
import { AddExpenseModal } from "@/components/add-expense-modal";

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const group = getGroupById(groupId);
  const expenses = getExpensesByGroupId(groupId);
  const balances = getBalancesByGroupId(groupId);
  const activities = getActivitiesByGroupId(groupId);

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const members = group.members.map((id) => getUserById(id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="font-semibold text-lg text-foreground truncate">
              {group.name}
            </h1>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </header>

      {/* Members Row */}
      <div className="container mx-auto px-4 py-4 max-w-3xl">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-sm text-muted-foreground shrink-0">Members:</span>
          <div className="flex items-center gap-2">
            {members.map((member) => (
              <div
                key={member?.id}
                className="flex items-center gap-2 bg-secondary rounded-full pr-3 pl-1 py-1 shrink-0"
              >
                <Avatar className="w-7 h-7">
                  <AvatarImage src={member?.avatar} />
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {member?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {member?.id === currentUser.id ? "You" : member?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 max-w-3xl">
        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Expenses</span>
            </TabsTrigger>
            <TabsTrigger value="balances" className="gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Balances</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-3">
            {expenses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center mb-3">
                    <Receipt className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No expenses yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add your first expense to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              expenses.map((expense) => {
                const payer = getUserById(expense.paidBy);
                const isYou = payer?.id === currentUser.id;
                const sharePerPerson = expense.amount / expense.splitBetween.length;

                return (
                  <Card key={expense.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                          <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-medium text-foreground">
                                {expense.description}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={payer?.avatar} />
                                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                    {payer?.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                  {isYou ? "You" : payer?.name} paid
                                </span>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-semibold text-foreground">
                                {formatCurrency(expense.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(expense.date)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className="text-sm text-muted-foreground">
                              Split equally:{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(sharePerPerson)}
                              </span>{" "}
                              per person
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Balances Tab */}
          <TabsContent value="balances" className="space-y-3">
            {balances.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-success/10 mx-auto flex items-center justify-center mb-3">
                    <Wallet className="w-6 h-6 text-success" />
                  </div>
                  <p className="text-success font-medium">All settled up!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No outstanding balances in this group
                  </p>
                </CardContent>
              </Card>
            ) : (
              balances.map((balance, index) => {
                const fromUser = getUserById(balance.from);
                const toUser = getUserById(balance.to);
                const isYouOwing = balance.from === currentUser.id;
                const isYouOwed = balance.to === currentUser.id;

                return (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 shrink-0">
                            <AvatarImage src={fromUser?.avatar} />
                            <AvatarFallback className="bg-muted text-muted-foreground">
                              {fromUser?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`font-medium truncate ${
                                isYouOwing
                                  ? "text-destructive"
                                  : "text-foreground"
                              }`}
                            >
                              {isYouOwing ? "You" : fromUser?.name}
                            </span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span
                              className={`font-medium truncate ${
                                isYouOwed ? "text-success" : "text-foreground"
                              }`}
                            >
                              {isYouOwed ? "You" : toUser?.name}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`font-semibold ${
                              isYouOwed
                                ? "text-success"
                                : isYouOwing
                                ? "text-destructive"
                                : "text-foreground"
                            }`}
                          >
                            {formatCurrency(balance.amount)}
                          </span>
                          <Button
                            size="sm"
                            variant={isYouOwing ? "default" : "outline"}
                          >
                            Settle Up
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}

            <Card className="bg-secondary/50 border-dashed">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Settling up will record a payment between you and another
                  member
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-3">
            {activities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No activity yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {activities.map((activity) => {
                    const user = getUserById(activity.userId);
                    const isYou = user?.id === currentUser.id;

                    if (activity.type === "expense") {
                      return (
                        <div key={activity.id} className="relative pl-12">
                          <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-primary" />
                          <Card>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={user?.avatar} />
                                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                    {user?.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm text-foreground flex-1">
                                  <span className="font-medium">
                                    {isYou ? "You" : user?.name}
                                  </span>{" "}
                                  added{" "}
                                  <span className="font-medium text-primary">
                                    {formatCurrency(activity.amount)}
                                  </span>{" "}
                                  for {activity.description}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {formatDate(activity.date)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    if (activity.type === "settlement") {
                      const settledWith = getUserById(activity.settledWith || "");
                      return (
                        <div key={activity.id} className="relative pl-12">
                          <div className="absolute left-3 top-1 w-4 h-4 rounded-full bg-success" />
                          <Card className="bg-success/5 border-success/20">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={user?.avatar} />
                                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                    {user?.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="text-sm text-foreground flex-1">
                                  <span className="font-medium">
                                    {isYou ? "You" : user?.name}
                                  </span>{" "}
                                  settled{" "}
                                  <span className="font-medium text-success">
                                    {formatCurrency(activity.amount)}
                                  </span>{" "}
                                  with {settledWith?.name}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {formatDate(activity.date)}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Add Expense Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 px-6 gap-2"
          onClick={() => setIsAddExpenseOpen(true)}
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </Button>
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={isAddExpenseOpen}
        onOpenChange={setIsAddExpenseOpen}
        groupId={groupId}
        currentUserId={currentUser.id}
        members={members.filter((m): m is NonNullable<typeof m> => m !== undefined)}
      />
    </div>
  );
}
