import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Nav from './components/Nav'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Assessments from './pages/Assessments'
import AllAssessments from './pages/AllAssessments'
import Antibiotics from './pages/Antibiotics'
import Admin from './pages/Admin'

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Nav />
      <main className="app-main">{children}</main>
    </div>
  )
}

function AppRoutes() {
  const { loading } = useAuth()
  if (loading) return <div className="page-loading">Memuat…</div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessments"
        element={
          <ProtectedRoute>
            <Layout>
              <Assessments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessments/all"
        element={
          <ProtectedRoute>
            <Layout>
              <AllAssessments />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/antibiotics"
        element={
          <ProtectedRoute>
            <Layout>
              <Antibiotics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
