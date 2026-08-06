import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './screens/Landing'
import { SignIn } from './screens/SignIn'
import { SignUp } from './screens/SignUp'
import { Dashboard } from './screens/Dashboard'
import { Game } from './screens/Game'

// Split the engine-backed screen into its own chunk (loads Stockfish on demand).
const PlayComputer = lazy(() =>
  import('./screens/PlayComputer').then((m) => ({ default: m.PlayComputer })),
)

const RouteFallback = () => (
  <div className="flex min-h-[100dvh] items-center justify-center text-muted-foreground">
    <div className="animate-pulse">Loading…</div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              }
            />
            <Route
              path="/play/computer"
              element={
                <ProtectedRoute>
                  <PlayComputer />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
