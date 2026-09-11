import { Navigate, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell.jsx";
import Login from "./pages/Login/Login.jsx";
import Execute from "./pages/Execute/Execute.jsx";
import ExecutionResult from "./pages/ExecutionResult/ExecutionResult.jsx";
import History from "./pages/History/History.jsx";
import Policies from "./pages/Policies/Policies.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import { getAuthSession } from "./auth.js";

function ProtectedRoute({ children }) {
  return getAuthSession() ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Login />
        }
      />

      <Route
        path="/execute"
        element={
          <ProtectedRoute>
            <AppShell>
              <Execute />
            </AppShell>
          </ProtectedRoute>
        }
      />

      {/* One page renders both outcomes — the API returns a single
          execution result resource with a `status` field of
          "success" | "blocked", so the UI branches on that instead
          of living as two near-duplicate pages. */}
      <Route
        path="/execute/result/:id"
        element={
          <ProtectedRoute>
            <AppShell fullBleed>
              <ExecutionResult />
            </AppShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppShell>
              <History />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/policies"
        element={
          <ProtectedRoute>
            <AppShell>
              <Policies />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <Settings />
            </AppShell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
