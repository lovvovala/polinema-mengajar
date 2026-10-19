import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/Layouts';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cbt from './pages/Cbt';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/daftar" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<div className="p-16 text-center text-slate-500">Halaman tidak ditemukan.</div>} />
      </Route>
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/ujian" element={<ProtectedRoute><Cbt /></ProtectedRoute>} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
