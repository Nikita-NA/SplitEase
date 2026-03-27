import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/data";

import { CreateGroupModal } from "@/components/create-group-modal";
import { UserNav } from "@/components/user-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Receipt,
  TrendingUp,
  TrendingDown,
  Users,
  ChevronRight,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, avatar: true },
  });

  if (!user) redirect("/login");

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      members: { include: { user: true } },
      expenses: { include: { splits: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const groupsWithBalances = groups.map((group) => {
    const memberCount = group.members.length || 0;

    let netBalance = 0;
    for (const expense of group.expenses) {
      const paid = expense.paidById === user.id ? expense.amount : 0;

      const splitForUser = expense.splits.find((s) => s.userId === user.id);
      let share = 0;
      if (splitForUser) {
        share = splitForUser.amount;
      } else if (memberCount > 0) {
        // Default to equal split for now if no split record exists.
        share = expense.amount / memberCount;
      }

      netBalance += paid - share;
    }

    return { group, netBalance };
  });

  const totalOwed = groupsWithBalances.reduce(
    (sum, g) => sum + (g.netBalance > 0 ? g.netBalance : 0),
    0,
  );
  const totalOwe = groupsWithBalances.reduce(
    (sum, g) => sum + (g.netBalance < 0 ? Math.abs(g.netBalance) : 0),
    0,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg text-foreground">SplitEase</span>
          </Link>

          <div className="flex items-center gap-3">
            <CreateGroupModal />
            <UserNav name={user.name} email={user.email} avatar={user.avatar} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Balance Summary */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">You are owed</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(totalOwed)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">You owe</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalOwe)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Groups</h2>
            <span className="text-sm text-muted-foreground">
              {groupsWithBalances.length} groups
            </span>
          </div>

          {groupsWithBalances.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No groups yet — create one!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
            {groupsWithBalances.map(({ group, netBalance }) => {
              const members = group.members.map((gm) => gm.user);
              const memberAvatars = members.filter(Boolean);

              const balance = netBalance;
              const isPositive = balance > 0;
              const isNeutral = balance === 0;

              return (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <Users className="w-6 h-6 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {group.name}
                          </h3>

                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex -space-x-2">
                              {memberAvatars.slice(0, 4).map((member) => (
                                <Avatar
                                  key={member.id}
                                  className="w-6 h-6 border-2 border-card"
                                >
                                  <AvatarImage src={member.avatar ?? undefined} />
                                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                    {(member.name ?? member.email)?.charAt(0) ??
                                      "?"}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground ml-1">
                              {members.length} members
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            {isNeutral ? (
                              <span className="text-sm text-muted-foreground">
                                Settled up
                              </span>
                            ) : (
                              <>
                                <p
                                  className={`text-sm font-medium ${
                                    isPositive
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {isPositive ? "you are owed" : "you owe"}
                                </p>
                                <p
                                  className={`font-semibold ${
                                    isPositive
                                      ? "text-success"
                                      : "text-destructive"
                                  }`}
                                >
                                  {formatCurrency(Math.abs(balance))}
                                </p>
                              </>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

