# Finance Dashboard UI

A clean and interactive frontend-only finance dashboard built with React (JavaScript), Vite, and mock data.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

## Features Implemented

### 1) Dashboard Overview
- Summary cards: Total Balance, Income, Expenses
- Time-based visualization: monthly balance/income/expense trend (line chart)
- Categorical visualization: spending breakdown by category (pie chart)

### 2) Transactions Section
- Transaction list with date, description, amount, category, and type
- Simple filtering:
  - text search
  - type filter
  - category filter
  - month filter
- Sorting:
  - date (asc/desc)
  - amount (asc/desc)

### 3) Insights Section
- Highest spending category
- Monthly expense comparison (current vs previous)
- Savings rate insight

### 4) State Management
- Centralized app state using React Context + `useReducer`
- Managed state includes:
  - transactions
  - filters
  - sort options
  - theme

### 5) UI/UX Expectations
- Clean card-based layout
- Responsive behavior for desktop/tablet/mobile
- Empty/no-result states for charts and transaction list

## Optional Enhancements Included
- Dark mode toggle
- Local storage persistence for transactions, filters, sorting, and theme

## Project Structure

- `src/context/AppStateContext.jsx` - centralized state and persistence
- `src/utils/financeSelectors.js` - calculations and derived insights
- `src/components/*` - reusable UI sections and controls
- `src/styles/app.css` - responsive styling and light/dark theme variables

## Assumptions and Trade-offs

- Uses mock data only; no backend or authentication
- Focused on clarity and modularity over advanced enterprise patterns

