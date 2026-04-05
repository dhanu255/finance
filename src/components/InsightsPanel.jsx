import React from "react";
import { useAppState } from "../context/AppStateContext";
import {
  getHighestSpendingCategory,
  getMonthlyComparison,
  getSavingsRate,
} from "../utils/financeSelectors";

const fmt = (value) =>
  Number(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

/** Format "2026-03" → "Mar 2026" */
function formatMonth(yyyyMM) {
  if (!yyyyMM) return "N/A";
  try {
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(
      new Date(`${yyyyMM}-01`)
    );
  } catch {
    return yyyyMM;
  }
}

export function InsightsPanel() {
  const { transactions } = useAppState();
  const topCategory = getHighestSpendingCategory(transactions);
  const monthly     = getMonthlyComparison(transactions);
  const savings     = getSavingsRate(transactions);

  return (
    <aside className="panel insights-panel" aria-label="Financial insights">
      <header className="panel-header">
        <h2>Insights</h2>
      </header>

      <div className="insight-item">
        <h3>Highest Spending Category</h3>
        <p>
          {topCategory
            ? `${topCategory.category} (${fmt(topCategory.amount)})`
            : "Not enough expense data yet."}
        </p>
      </div>

      <div className="insight-item">
        <h3>Monthly Comparison</h3>
        <p>
          {monthly.currentMonth
            ? <>
                <strong>{formatMonth(monthly.currentMonth)}</strong>
                {" vs "}
                <strong>{formatMonth(monthly.previousMonth)}</strong>
                {`: ${monthly.delta >= 0 ? "+" : ""}${fmt(monthly.delta)} expense change`}
              </>
            : "No monthly data available."}
        </p>
      </div>

      <div className="insight-item">
        <h3>Savings</h3>
        {savings.isNegative ? (
          <p className="insight-warning" role="alert">
            ⚠️ You are spending more than you earn! Your expenses exceed your income by{" "}
            <strong>{fmt(Math.abs(savings.savings))}</strong>.
          </p>
        ) : (
          <>
            <p className="insight-savings-amount">{fmt(savings.savings)} saved overall</p>
            <p className="insight-savings-rate">
              {(savings.rawRate * 100).toFixed(1)}% of total income — net after expenses.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
