import { describe, it, expect, beforeAll, vi } from "vitest";
import {
  applyFilters,
  applySort,
  getTotals,
  getMonthlyAggregates,
  getCategoryBreakdown,
  getHighestSpendingCategory,
  getMonthlyComparison,
  getSavingsRate,
} from "./financeSelectors";

const sampleTransactions = [
  { id: "1", date: "2026-03-01", description: "Salary",    amount: 5000, category: "Salary",    type: "income"  },
  { id: "2", date: "2026-03-05", description: "Rent",      amount: 1500, category: "Housing",   type: "expense" },
  { id: "3", date: "2026-03-10", description: "Groceries", amount: 200,  category: "Groceries", type: "expense" },
  { id: "4", date: "2026-02-01", description: "Salary",    amount: 5000, category: "Salary",    type: "income"  },
  { id: "5", date: "2026-02-15", description: "Dining",    amount: 80,   category: "Dining",    type: "expense" },
];

// ─── applyFilters ──────────────────────────────────────────────────────────────
describe("applyFilters", () => {
  it("returns all transactions when filters are defaults", () => {
    const filters = { search: "", type: "all", category: "all", month: "all" };
    expect(applyFilters(sampleTransactions, filters)).toHaveLength(5);
  });

  it("filters by type=income", () => {
    const filters = { search: "", type: "income", category: "all", month: "all" };
    const result  = applyFilters(sampleTransactions, filters);
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.type === "income")).toBe(true);
  });

  it("filters by type=expense", () => {
    const filters = { search: "", type: "expense", category: "all", month: "all" };
    const result  = applyFilters(sampleTransactions, filters);
    expect(result).toHaveLength(3);
  });

  it("filters by category", () => {
    const filters = { search: "", type: "all", category: "Housing", month: "all" };
    const result  = applyFilters(sampleTransactions, filters);
    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Rent");
  });

  it("filters by month", () => {
    const filters = { search: "", type: "all", category: "all", month: "2026-02" };
    const result  = applyFilters(sampleTransactions, filters);
    expect(result).toHaveLength(2);
  });

  it("filters by search (case-insensitive)", () => {
    const filters = { search: "groc", type: "all", category: "all", month: "all" };
    const result  = applyFilters(sampleTransactions, filters);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  it("returns empty array when nothing matches", () => {
    const filters = { search: "xyznotfound", type: "all", category: "all", month: "all" };
    expect(applyFilters(sampleTransactions, filters)).toHaveLength(0);
  });
});

// ─── applySort ────────────────────────────────────────────────────────────────
describe("applySort", () => {
  it("sorts by date descending", () => {
    const result = applySort(sampleTransactions, { field: "date", direction: "desc" });
    expect(result[0].date >= result[1].date).toBe(true);
  });

  it("sorts by date ascending", () => {
    const result = applySort(sampleTransactions, { field: "date", direction: "asc" });
    expect(result[0].date <= result[1].date).toBe(true);
  });

  it("sorts by amount descending", () => {
    const result = applySort(sampleTransactions, { field: "amount", direction: "desc" });
    expect(result[0].amount).toBe(5000);
    expect(result[result.length - 1].amount).toBe(80);
  });

  it("sorts by amount ascending", () => {
    const result = applySort(sampleTransactions, { field: "amount", direction: "asc" });
    expect(result[0].amount).toBe(80);
  });

  it("does not mutate the original array", () => {
    const original = [...sampleTransactions];
    applySort(sampleTransactions, { field: "date", direction: "asc" });
    expect(sampleTransactions).toEqual(original);
  });
});

// ─── getTotals ────────────────────────────────────────────────────────────────
describe("getTotals", () => {
  it("calculates correct income, expenses, and balance", () => {
    const { income, expenses, balance } = getTotals(sampleTransactions);
    expect(income).toBe(10000);
    expect(expenses).toBe(1780);
    expect(balance).toBe(8220);
  });

  it("returns zeros for empty array", () => {
    const { income, expenses, balance } = getTotals([]);
    expect(income).toBe(0);
    expect(expenses).toBe(0);
    expect(balance).toBe(0);
  });
});

// ─── getMonthlyAggregates ─────────────────────────────────────────────────────
describe("getMonthlyAggregates", () => {
  it("returns one entry per month, sorted chronologically", () => {
    const result = getMonthlyAggregates(sampleTransactions);
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe("2026-02");
    expect(result[1].month).toBe("2026-03");
  });

  it("correctly aggregates income and expenses per month", () => {
    const result  = getMonthlyAggregates(sampleTransactions);
    const march   = result.find((m) => m.month === "2026-03");
    expect(march.income).toBe(5000);
    expect(march.expenses).toBe(1700);
    expect(march.balance).toBe(3300);
  });
});

// ─── getCategoryBreakdown ─────────────────────────────────────────────────────
describe("getCategoryBreakdown", () => {
  it("only includes expense transactions", () => {
    const result = getCategoryBreakdown(sampleTransactions);
    expect(result.every((c) => c.amount > 0)).toBe(true);
    expect(result.find((c) => c.category === "Salary")).toBeUndefined();
  });

  it("sorts by amount descending", () => {
    const result = getCategoryBreakdown(sampleTransactions);
    expect(result[0].amount).toBeGreaterThanOrEqual(result[1].amount);
  });

  it("sums amounts for the same category", () => {
    const txs = [
      { id: "a", type: "expense", category: "Food", amount: 100, date: "2026-01-01", description: "lunch" },
      { id: "b", type: "expense", category: "Food", amount: 50,  date: "2026-01-02", description: "snack" },
    ];
    const result = getCategoryBreakdown(txs);
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(150);
  });
});

// ─── getHighestSpendingCategory ───────────────────────────────────────────────
describe("getHighestSpendingCategory", () => {
  it("returns the category with highest total expense", () => {
    const top = getHighestSpendingCategory(sampleTransactions);
    expect(top.category).toBe("Housing");
    expect(top.amount).toBe(1500);
  });

  it("returns null when there are no expense transactions", () => {
    const incomeOnly = sampleTransactions.filter((t) => t.type === "income");
    expect(getHighestSpendingCategory(incomeOnly)).toBeNull();
  });
});

// ─── getMonthlyComparison ─────────────────────────────────────────────────────
describe("getMonthlyComparison", () => {
  beforeAll(() => {
    // Mock Date so "current month" is March 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15"));
  });

  it("returns currentMonth as the real calendar month", () => {
    const result = getMonthlyComparison(sampleTransactions);
    expect(result.currentMonth).toBe("2026-03");
  });

  it("returns previousMonth as one month before current", () => {
    const result = getMonthlyComparison(sampleTransactions);
    expect(result.previousMonth).toBe("2026-02");
  });

  it("returns zero delta when no data", () => {
    const result = getMonthlyComparison([]);
    expect(result.delta).toBe(0);
    expect(result.currentMonth).toBeNull();
  });

  it("calculates delta correctly", () => {
    const result = getMonthlyComparison(sampleTransactions);
    // March expenses: 1700, Feb expenses: 80 → delta = 1620
    expect(result.delta).toBe(1620);
  });
});

// ─── getSavingsRate ───────────────────────────────────────────────────────────
describe("getSavingsRate", () => {
  it("calculates rate correctly", () => {
    const { rate, savings, income, isNegative } = getSavingsRate(sampleTransactions);
    expect(income).toBe(10000);
    expect(savings).toBe(8220);
    expect(isNegative).toBe(false);
    expect(rate).toBeCloseTo(0.822);
  });

  it("returns rate=0 and isNegative=true when spending exceeds income", () => {
    const txs = [
      { id: "a", type: "income",  amount: 500, date: "2026-01-01", category: "Salary",  description: "pay" },
      { id: "b", type: "expense", amount: 800, date: "2026-01-02", category: "Housing", description: "rent" },
    ];
    const { rate, isNegative, rawRate } = getSavingsRate(txs);
    expect(isNegative).toBe(true);
    expect(rate).toBe(0);           // clamped
    expect(rawRate).toBeCloseTo(-0.6); // raw rate preserved
  });

  it("returns rate=0 when income is zero", () => {
    const txs = [
      { id: "a", type: "expense", amount: 100, date: "2026-01-01", category: "Food", description: "lunch" },
    ];
    const { rate } = getSavingsRate(txs);
    expect(rate).toBe(0);
  });

  it("returns zeros for empty transactions", () => {
    const { income, savings, rate } = getSavingsRate([]);
    expect(income).toBe(0);
    expect(savings).toBe(0);
    expect(rate).toBe(0);
  });
});
