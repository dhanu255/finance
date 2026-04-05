import React, { createContext, useContext, useEffect, useReducer } from "react";
import { mockTransactions } from "../data/mockTransactions";

const LOCAL_STORAGE_KEY = "finance-dashboard-state-v1";

const defaultFilters = { search: "", type: "all", category: "all", month: "all" };
const defaultSort    = { field: "date", direction: "desc" };

const initialState = {
  transactions: mockTransactions,
  filters:      defaultFilters,
  sort:         defaultSort,
  theme:        "dark",
};

function reducer(state, action) {
  switch (action.type) {
    case "addTransaction":
      return { ...state, transactions: [action.payload, ...state.transactions] };
    case "updateTransaction":
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "removeTransaction":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };
    case "setFilters":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "setSort":
      return { ...state, sort: { ...state.sort, ...action.payload } };
    case "setTheme":
      return { ...state, theme: action.payload };
    case "setTransactions":
      return { ...state, transactions: action.payload };
    default:
      return state;
  }
}

function loadInitialState() {
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
      filters: { ...defaultFilters, ...(parsed.filters || {}) },
      sort:    { ...defaultSort,    ...(parsed.sort    || {}) },
    };
  } catch {
    return initialState;
  }
}

// Separate contexts so dispatch consumers don't re-render on state changes
const AppStateContext   = createContext(undefined);
const AppDispatchContext = createContext(undefined);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState);

  // Persist transactions separately — only when transactions change
  useEffect(() => {
    try {
      const raw    = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ ...stored, transactions: state.transactions })
      );
    } catch { /* ignore */ }
  }, [state.transactions]);

  // Persist filters — only when filters change (not on every keystroke of other state)
  useEffect(() => {
    try {
      const raw    = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ ...stored, filters: state.filters })
      );
    } catch { /* ignore */ }
  }, [state.filters]);

  // Persist sort
  useEffect(() => {
    try {
      const raw    = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ ...stored, sort: state.sort })
      );
    } catch { /* ignore */ }
  }, [state.sort]);

  // Persist theme & apply to document
  useEffect(() => {
    try {
      const raw    = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({ ...stored, theme: state.theme })
      );
    } catch { /* ignore */ }
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (value === undefined) throw new Error("useAppState must be used within AppStateProvider");
  return value;
}

export function useAppDispatch() {
  const value = useContext(AppDispatchContext);
  if (value === undefined) throw new Error("useAppDispatch must be used within AppStateProvider");
  return value;
}
