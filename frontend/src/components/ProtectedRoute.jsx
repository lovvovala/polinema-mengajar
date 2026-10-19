import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const lokasi = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ dari: lokasi.pathname }} />;
  return children;
}
