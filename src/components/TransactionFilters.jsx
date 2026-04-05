import React, { useMemo } from "react";
import { useAppState } from "../context/AppStateContext";
import { useAppDispatch } from "../context/AppStateContext";

/** Format "2026-03" → "March 2026" */
function formatMonth(yyyyMM) {
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long" }).format(
      new Date(`${yyyyMM}-01`)
    );
  } catch {
    return yyyyMM;
  }
}

export function TransactionFilters({ transactions }) {
  const { filters } = useAppState();
  const dispatch    = useAppDispatch();

  const categories = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.category))).sort();
  }, [transactions]);

  const months = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort(
      (a, b) => (a < b ? 1 : -1)
    );
  }, [transactions]);

  return (
    <div className="filters-grid" role="search" aria-label="Filter transactions">
      <div className="filter-field">
        <label htmlFor="filter-search" className="filter-label">Search</label>
        <input
          id="filter-search"
          type="search"
          value={filters.search}
          onChange={(e) => dispatch({ type: "setFilters", payload: { search: e.target.value } })}
          placeholder="Description or category"
          aria-label="Search transactions by description or category"
        />
      </div>

      <div className="filter-field">
        <label htmlFor="filter-type" className="filter-label">Type</label>
        <select
          id="filter-type"
          value={filters.type}
          onChange={(e) => dispatch({ type: "setFilters", payload: { type: e.target.value } })}
          aria-label="Filter by transaction type"
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-category" className="filter-label">Category</label>
        <select
          id="filter-category"
          value={filters.category}
          onChange={(e) => dispatch({ type: "setFilters", payload: { category: e.target.value } })}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-month" className="filter-label">Month</label>
        <select
          id="filter-month"
          value={filters.month}
          onChange={(e) => dispatch({ type: "setFilters", payload: { month: e.target.value } })}
          aria-label="Filter by month"
        >
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>{formatMonth(m)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
