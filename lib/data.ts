export const currentUser = {
  id: "1",
  name: "You",
  email: "you@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=You",
};

export const users = [
  currentUser,
  {
    id: "2",
    name: "Nikita",
    email: "nikita@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nikita",
  },
  {
    id: "3",
    name: "Raman",
    email: "raman@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Raman",
  },
  {
    id: "4",
    name: "Priya",
    email: "priya@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
  },
  {
    id: "5",
    name: "Arjun",
    email: "arjun@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
  },
];

export const groups = [
  {
    id: "1",
    name: "Trip to Goa",
    members: ["1", "2", "3", "4"],
    totalExpenses: 12500,
    youOwe: 0,
    youAreOwed: 890,
  },
  {
    id: "2",
    name: "Flat Expenses",
    members: ["1", "2", "5"],
    totalExpenses: 8400,
    youOwe: 350,
    youAreOwed: 0,
  },
  {
    id: "3",
    name: "Office Lunch",
    members: ["1", "3", "4", "5"],
    totalExpenses: 3200,
    youOwe: 0,
    youAreOwed: 350,
  },
];

export const expenses = [
  {
    id: "1",
    groupId: "1",
    description: "Beach Shack Dinner",
    amount: 2400,
    paidBy: "2",
    splitBetween: ["1", "2", "3", "4"],
    date: "2024-03-25",
    createdAt: "2024-03-25T19:30:00",
  },
  {
    id: "2",
    groupId: "1",
    description: "Scooter Rental",
    amount: 1800,
    paidBy: "1",
    splitBetween: ["1", "2", "3", "4"],
    date: "2024-03-24",
    createdAt: "2024-03-24T10:00:00",
  },
  {
    id: "3",
    groupId: "1",
    description: "Hotel Booking",
    amount: 6000,
    paidBy: "3",
    splitBetween: ["1", "2", "3", "4"],
    date: "2024-03-23",
    createdAt: "2024-03-23T14:00:00",
  },
  {
    id: "4",
    groupId: "1",
    description: "Groceries",
    amount: 850,
    paidBy: "4",
    splitBetween: ["1", "2", "3", "4"],
    date: "2024-03-23",
    createdAt: "2024-03-23T11:30:00",
  },
  {
    id: "5",
    groupId: "2",
    description: "Electricity Bill",
    amount: 2800,
    paidBy: "2",
    splitBetween: ["1", "2", "5"],
    date: "2024-03-20",
    createdAt: "2024-03-20T09:00:00",
  },
  {
    id: "6",
    groupId: "2",
    description: "Internet Bill",
    amount: 1200,
    paidBy: "5",
    splitBetween: ["1", "2", "5"],
    date: "2024-03-18",
    createdAt: "2024-03-18T15:00:00",
  },
  {
    id: "7",
    groupId: "3",
    description: "Friday Lunch",
    amount: 1600,
    paidBy: "1",
    splitBetween: ["1", "3", "4", "5"],
    date: "2024-03-22",
    createdAt: "2024-03-22T13:30:00",
  },
  {
    id: "8",
    groupId: "3",
    description: "Coffee Run",
    amount: 480,
    paidBy: "4",
    splitBetween: ["1", "3", "4", "5"],
    date: "2024-03-21",
    createdAt: "2024-03-21T10:00:00",
  },
];

export const balances = [
  { groupId: "1", from: "1", to: "2", amount: 450 },
  { groupId: "1", from: "1", to: "3", amount: 0 },
  { groupId: "1", from: "4", to: "1", amount: 200 },
  { groupId: "1", from: "2", to: "3", amount: 300 },
  { groupId: "2", from: "1", to: "2", amount: 350 },
  { groupId: "2", from: "1", to: "5", amount: 0 },
  { groupId: "3", from: "3", to: "1", amount: 200 },
  { groupId: "3", from: "5", to: "1", amount: 150 },
];

export const activities = [
  {
    id: "1",
    groupId: "1",
    type: "expense",
    userId: "2",
    description: "Beach Shack Dinner",
    amount: 2400,
    date: "2024-03-25",
  },
  {
    id: "2",
    groupId: "1",
    type: "expense",
    userId: "1",
    description: "Scooter Rental",
    amount: 1800,
    date: "2024-03-24",
  },
  {
    id: "3",
    groupId: "1",
    type: "settlement",
    userId: "3",
    settledWith: "2",
    amount: 450,
    date: "2024-03-24",
  },
  {
    id: "4",
    groupId: "1",
    type: "expense",
    userId: "3",
    description: "Hotel Booking",
    amount: 6000,
    date: "2024-03-23",
  },
  {
    id: "5",
    groupId: "1",
    type: "expense",
    userId: "4",
    description: "Groceries",
    amount: 850,
    date: "2024-03-23",
  },
  {
    id: "6",
    groupId: "2",
    type: "expense",
    userId: "2",
    description: "Electricity Bill",
    amount: 2800,
    date: "2024-03-20",
  },
  {
    id: "7",
    groupId: "3",
    type: "expense",
    userId: "1",
    description: "Friday Lunch",
    amount: 1600,
    date: "2024-03-22",
  },
];

export function getUserById(id: string) {
  return users.find((u) => u.id === id);
}

export function getGroupById(id: string) {
  return groups.find((g) => g.id === id);
}

export function getExpensesByGroupId(groupId: string) {
  return expenses.filter((e) => e.groupId === groupId);
}

export function getBalancesByGroupId(groupId: string) {
  return balances.filter((b) => b.groupId === groupId && b.amount > 0);
}

export function getActivitiesByGroupId(groupId: string) {
  return activities.filter((a) => a.groupId === groupId);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateFromDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
