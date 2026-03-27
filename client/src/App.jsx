import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn } from '@clerk/clerk-react'
import Dashboard from './pages/Dashboard'
import LandingPage from './pages/LandingPage'
import MainLayout from './layouts/MainLayout'
import SavedItems from './pages/SavedItems'
import Collections from './pages/Collections'
import GraphView from './pages/GraphView'
import ItemDetail from './pages/ItemDetail'
import Profile from './pages/Profile'
import ChatView from './pages/ChatView'
import SharedCollection from './pages/SharedCollection'

const ProtectedRoute = ({ children }) => {
  return (
    <>
      <SignedIn>
        <MainLayout>{children}</MainLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <>
            <SignedIn>
              <Navigate to="/dashboard" replace />
            </SignedIn>
            <SignedOut>
              <LandingPage />
            </SignedOut>
          </>
        } />
        
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
        
        {/* Unprotected Public Share Route */}
        <Route path="/shared/:id" element={<SharedCollection />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedItems /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatView /></ProtectedRoute>} />
        <Route path="/graph" element={<ProtectedRoute><GraphView /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
      </Routes>
    </Router>
  )
}

export default App
