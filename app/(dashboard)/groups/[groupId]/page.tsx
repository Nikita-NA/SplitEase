import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { simplifyDebts } from "@/lib/debt";
import { formatCurrency, formatDateFromDate } from "@/lib/data";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InviteMemberForm } from "@/components/invite-member-form";
import { GroupAddExpenseLauncher } from "@/components/group-add-expense-launcher";
import { BalancesTab } from "@/components/balances-tab";
import { UserNav } from "@/components/user-nav";

import { Receipt, Wallet, Clock } from "lucide-react";

type ActivityItem = {
  id: string;
  type: "expense" | "settlement";
  date: Date;
  actorName: string;
  actorAvatar: string | null;
  text: string;
};

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, avatar: true },
  });
  if (!user) redirect("/login");

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: {
          paidBy: true,
          splits: true,
        },
        orderBy: { createdAt: "desc" },
      },
      settlements: {
        include: {
          from: true,
          to: true,
        },
        orderBy: { settledAt: "desc" },
      },
    },
  });

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const currentMembership = group.members.find((m) => m.userId === user.id);
  if (!currentMembership) redirect("/dashboard");
  const canInvite = currentMembership.role === "owner";

  const membersForModal = group.members.map((gm) => ({
    id: gm.user.id,
    name: gm.user.name ?? gm.user.email ?? "Member",
    avatar:
      gm.user.avatar ??
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        gm.user.email ?? gm.user.id,
      )}`,
  }));

  const memberById = new Map(
    group.members.map((gm) => [
      gm.user.id,
      {
        name: gm.user.name ?? gm.user.email ?? "Member",
        avatar:
          gm.user.avatar ??
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            gm.user.email ?? gm.user.id,
          )}`,
      },
    ]),
  );

  // Compute net balances from expenses and settlements.
  const netByUserId = new Map<string, number>();
  for (const gm of group.members) netByUserId.set(gm.userId, 0);

  for (const expense of group.expenses) {
    netByUserId.set(
      expense.paidById,
      (netByUserId.get(expense.paidById) ?? 0) + expense.amount,
    );

    for (const split of expense.splits) {
      netByUserId.set(
        split.userId,
        (netByUserId.get(split.userId) ?? 0) - split.amount,
      );
    }
  }

  // Settlements reduce debt: debtor(from) pays creditor(to).
  for (const settlement of group.settlements) {
    netByUserId.set(
      settlement.fromUserId,
      (netByUserId.get(settlement.fromUserId) ?? 0) + settlement.amount,
    );
    netByUserId.set(
      settlement.toUserId,
      (netByUserId.get(settlement.toUserId) ?? 0) - settlement.amount,
    );
  }

  const simplifiedRows = simplifyDebts(
    Array.from(netByUserId.entries()).map(([userId, balance]) => ({
      userId,
      balance,
    })),
  ).map((row) => ({
    ...row,
    fromName: memberById.get(row.fromUserId)?.name ?? "Member",
    toName: memberById.get(row.toUserId)?.name ?? "Member",
  }));

  const activities: ActivityItem[] = [
    ...group.expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      type: "expense" as const,
      date: expense.createdAt,
      actorName: expense.paidBy.name ?? expense.paidBy.email ?? "Member",
      actorAvatar:
        expense.paidBy.avatar ??
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          expense.paidBy.email ?? expense.paidBy.id,
        )}`,
      text: `${expense.paidBy.name ?? expense.paidBy.email ?? "Member"} added ${formatCurrency(expense.amount)} for ${expense.description}`,
    })),
    ...group.settlements.map((settlement) => ({
      id: `settlement-${settlement.id}`,
      type: "settlement" as const,
      date: settlement.settledAt,
      actorName: settlement.from.name ?? settlement.from.email ?? "Member",
      actorAvatar:
        settlement.from.avatar ??
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
          settlement.from.email ?? settlement.from.id,
        )}`,
      text: `${settlement.from.name ?? settlement.from.email ?? "Member"} settled ${formatCurrency(settlement.amount)} with ${settlement.to.name ?? settlement.to.email ?? "Member"}`,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground">
            Back
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg text-foreground truncate">
              {group.name}
            </h1>
            {group.description ? (
              <p className="text-sm text-muted-foreground truncate">
                {group.description}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">
              {group.members.length} members
            </span>
            <UserNav name={user.name} email={user.email} avatar={user.avatar} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl space-y-6">
        <section>
          <div className="flex items-center gap-2 flex-wrap">
            {group.members.map((gm) => {
              const member = gm.user;
              const initial = (member.name ?? member.email ?? "?").charAt(0);
              const label =
                member.id === user.id ? "You" : member.name ?? member.email;

              return (
                <div
                  key={`${gm.groupId}-${gm.userId}`}
                  className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1"
                >
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={member.avatar ?? undefined} />
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <InviteMemberForm groupId={group.id} canInvite={canInvite} />

        <Tabs defaultValue="expenses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="expenses" className="gap-2">
              <Receipt className="w-4 h-4" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="balances" className="gap-2">
              <Wallet className="w-4 h-4" />
              Balances
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Clock className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-3">
            {group.expenses.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No expenses yet</p>
                </CardContent>
              </Card>
            ) : (
              group.expenses.map((expense) => (
                <Card key={expense.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {expense.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(expense.paidBy.name ?? expense.paidBy.email) ===
                        (user.name ?? user.email)
                          ? "You"
                          : expense.paidBy.name ?? expense.paidBy.email}{" "}
                        paid
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateFromDate(expense.createdAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="balances">
            <BalancesTab
              rows={simplifiedRows}
              groupId={group.id}
              currentUserId={user.id}
            />
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            {activities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No activity yet</p>
                </CardContent>
              </Card>
            ) : (
              activities.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={item.actorAvatar ?? undefined} />
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        {item.actorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-foreground flex-1">
                      {item.text} ·{" "}
                      {formatDateFromDate(item.date)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <GroupAddExpenseLauncher
        groupId={group.id}
        currentUserId={user.id}
        members={membersForModal}
      />
    </div>
  );
}

