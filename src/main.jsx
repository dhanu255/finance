import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppStateProvider } from "./context/AppStateContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppStateProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppStateProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
