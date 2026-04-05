export function applyFilters(transactions, filters) {
  return transactions.filter((tx) => {
    if (filters.type !== "all" && tx.type !== filters.type) return false;
    if (filters.category !== "all" && tx.category !== filters.category) return false;
    if (filters.month !== "all" && tx.date.slice(0, 7) !== filters.month) return false;
    if (filters.search.trim()) {
      const needle = filters.search.toLowerCase();
      const haystack = `${tx.description} ${tx.category}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function applySort(transactions, sort) {
  const sorted = [...transactions];
  sorted.sort((a, b) => {
    if (sort.field === "date") {
      const at = new Date(a.date).getTime();
      const bt = new Date(b.date).getTime();
      return sort.direction === "asc" ? at - bt : bt - at;
    }
    return sort.direction === "asc" ? a.amount - b.amount : b.amount - a.amount;
  });
  return sorted;
}

export function getTotals(transactions) {
  const income   = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

export function getMonthlyAggregates(transactions) {
  const byMonth = new Map();
  for (const t of transactions) {
    const month   = t.date.slice(0, 7);
    const current = byMonth.get(month) || { income: 0, expenses: 0, balance: 0 };
    if (t.type === "income") {
      current.income  += t.amount;
      current.balance += t.amount;
    } else {
      current.expenses += t.amount;
      current.balance  -= t.amount;
    }
    byMonth.set(month, current);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, values]) => ({ month, ...values }));
}

export function getCategoryBreakdown(transactions) {
  const byCategory = new Map();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    byCategory.set(t.category, (byCategory.get(t.category) || 0) + t.amount);
  }
  return Array.from(byCategory.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({ category, amount }));
}

export function getHighestSpendingCategory(transactions) {
  const top = getCategoryBreakdown(transactions)[0];
  return top || null;
}

/**
 * Returns monthly expense comparison using the real calendar (not array index).
 * "Current month" = the calendar month containing today.
 * "Previous month" = one calendar month prior.
 */
export function getMonthlyComparison(transactions) {
  const monthly = getMonthlyAggregates(transactions);
  if (!monthly.length) {
    return { currentMonth: null, previousMonth: null, currentExpenses: 0, previousExpenses: 0, delta: 0 };
  }

  const now         = new Date();
  const currentKey  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevDate    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  const currentData  = monthly.find((m) => m.month === currentKey);
  const previousData = monthly.find((m) => m.month === previousKey);

  // Fallback: if no data for real "current" month, use the most recent month in data
  const fallback = monthly[monthly.length - 1];
  const current  = currentData || fallback;
  const previous = previousData || monthly[monthly.length - 2] || null;

  const currentExpenses  = current  ? current.expenses  : 0;
  const previousExpenses = previous ? previous.expenses : 0;

  return {
    currentMonth:    current  ? current.month  : null,
    previousMonth:   previous ? previous.month : null,
    currentExpenses,
    previousExpenses,
    delta: currentExpenses - previousExpenses,
  };
}

/**
 * Returns savings rate. When income is zero or balance is negative, provides
 * an isNegative flag so the UI can show a warning.
 */
export function getSavingsRate(transactions) {
  const { income, balance } = getTotals(transactions);
  const rate       = income === 0 ? 0 : balance / income;
  const isNegative = balance < 0;
  return { income, savings: balance, rate: Math.max(rate, 0), rawRate: rate, isNegative };
}
