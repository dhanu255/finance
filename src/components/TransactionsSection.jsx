import React, { useMemo, useState } from "react";
import { useAppState } from "../context/AppStateContext";
import { useAppDispatch } from "../context/AppStateContext";
import { applyFilters, applySort } from "../utils/financeSelectors";
import { TransactionFilters } from "./TransactionFilters";
import { TransactionsTable } from "./TransactionsTable";

const emptyForm = {
  id:          "",
  date:        "",
  description: "",
  amount:      "",
  category:    "",
  type:        "expense",
};

const emptyErrors = {
  date:        "",
  description: "",
  amount:      "",
  category:    "",
};

/** Generate a unique ID using the Web Crypto API when available */
function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function validateForm(form) {
  const errors = { ...emptyErrors };
  let valid = true;

  if (!form.date) {
    errors.date = "Date is required.";
    valid = false;
  }

  const desc = form.description.trim();
  if (!desc) {
    errors.description = "Description is required.";
    valid = false;
  } else if (desc.length < 2) {
    errors.description = "Description must be at least 2 characters.";
    valid = false;
  }

  const amount = Number(form.amount);
  if (form.amount === "" || form.amount === null) {
    errors.amount = "Amount is required.";
    valid = false;
  } else if (isNaN(amount) || amount <= 0) {
    errors.amount = "Amount must be a positive number.";
    valid = false;
  } else if (amount > 1_000_000_000) {
    errors.amount = "Amount seems unrealistically large.";
    valid = false;
  }

  const cat = form.category.trim();
  if (!cat) {
    errors.category = "Category is required.";
    valid = false;
  }

  return { errors, valid };
}

export function TransactionsSection() {
  const { transactions, filters, sort } = useAppState();
  const dispatch = useAppDispatch();

  const [form,      setForm]      = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [errors,    setErrors]    = useState(emptyErrors);

  const visibleTransactions = useMemo(() => {
    return applySort(applyFilters(transactions, filters), sort);
  }, [transactions, filters, sort]);

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(visibleTransactions.length / PAGE_SIZE));
  const pagedTransactions = visibleTransactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 whenever filters/sort change
  useMemo(() => setPage(1), [filters, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSort = (field) => {
    const direction = sort.field === field && sort.direction === "desc" ? "asc" : "desc";
    dispatch({ type: "setSort", payload: { field, direction } });
  };

  const startEdit = (tx) => {
    setEditingId(tx.id);
    setForm({ ...tx, amount: String(tx.amount) });
    setErrors(emptyErrors);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors(emptyErrors);
  };

  const handleDelete = (tx) => {
    const label = `${tx.description} (${tx.date})`;
    if (!window.confirm(`Remove this transaction from history?\n\n${label}`)) return;
    dispatch({ type: "removeTransaction", payload: tx.id });
    if (editingId === tx.id) resetForm();
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submitForm = (e) => {
    e.preventDefault();
    const { errors: validationErrors, valid } = validateForm(form);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      id:          editingId || generateId(),
      date:        form.date,
      description: form.description.trim(),
      amount:      Number(form.amount),
      category:    form.category.trim(),
      type:        form.type,
    };

    dispatch({ type: editingId ? "updateTransaction" : "addTransaction", payload });
    resetForm();
  };

  return (
    <article className="panel">
      <header className="panel-header">
        <h2>Transactions</h2>
        <p className="muted">Add, edit, or delete entries. Changes persist in your browser.</p>
      </header>

      <TransactionFilters transactions={transactions} />

      {/* Pagination info */}
      {visibleTransactions.length > PAGE_SIZE && (
        <div className="pagination-info" aria-live="polite">
          Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, visibleTransactions.length)} of{" "}
          {visibleTransactions.length} transactions
        </div>
      )}

      <TransactionsTable
        transactions={pagedTransactions}
        onEdit={startEdit}
        onDelete={handleDelete}
        sort={sort}
        onSortChange={handleSort}
      />

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="pagination" role="navigation" aria-label="Pagination">
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            type="button"
            aria-label="Previous page"
          >
            ← Previous
          </button>
          <span className="pagination-pages" aria-current="page">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-small"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            type="button"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      )}

      <form className="tx-form" onSubmit={submitForm} noValidate aria-label="Transaction form">
        <h3>{editingId ? "Edit transaction" : "Add transaction"}</h3>
        <div className="tx-form-grid">

          <div className="form-field">
            <label htmlFor="tx-date" className="form-label">Date <span aria-hidden="true">*</span></label>
            <input
              id="tx-date"
              type="date"
              value={form.date}
              onChange={(e) => handleFieldChange("date", e.target.value)}
              aria-required="true"
              aria-describedby={errors.date ? "tx-date-error" : undefined}
              aria-invalid={!!errors.date}
            />
            {errors.date && <span id="tx-date-error" className="form-error" role="alert">{errors.date}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="tx-description" className="form-label">Description <span aria-hidden="true">*</span></label>
            <input
              id="tx-description"
              type="text"
              placeholder="e.g. Monthly rent"
              value={form.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              aria-required="true"
              aria-describedby={errors.description ? "tx-description-error" : undefined}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <span id="tx-description-error" className="form-error" role="alert">{errors.description}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="tx-amount" className="form-label">Amount (USD) <span aria-hidden="true">*</span></label>
            <input
              id="tx-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 1500"
              value={form.amount}
              onChange={(e) => handleFieldChange("amount", e.target.value)}
              aria-required="true"
              aria-describedby={errors.amount ? "tx-amount-error" : undefined}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <span id="tx-amount-error" className="form-error" role="alert">{errors.amount}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="tx-category" className="form-label">Category <span aria-hidden="true">*</span></label>
            <input
              id="tx-category"
              type="text"
              placeholder="e.g. Housing"
              value={form.category}
              onChange={(e) => handleFieldChange("category", e.target.value)}
              aria-required="true"
              aria-describedby={errors.category ? "tx-category-error" : undefined}
              aria-invalid={!!errors.category}
            />
            {errors.category && (
              <span id="tx-category-error" className="form-error" role="alert">{errors.category}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="tx-type" className="form-label">Type</label>
            <select
              id="tx-type"
              value={form.type}
              onChange={(e) => handleFieldChange("type", e.target.value)}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="tx-actions">
            <button className="btn" type="submit">
              {editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button className="btn btn-secondary" onClick={resetForm} type="button">
                Cancel
              </button>
            )}
          </div>

        </div>
      </form>
    </article>
  );
}
