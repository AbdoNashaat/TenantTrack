import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ 
  children, 
  allowedRole 
}: { 
  children: React.ReactNode, 
  allowedRole?: 'admin' | 'tenant' 
}) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && role !== allowedRole) {
    // Redirect to their respective dashboard if they try to access the wrong one
    return <Navigate to={role === 'admin' ? '/admin' : '/tenant'} replace />
  }

  return <>{children}</>
}