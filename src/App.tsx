import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage, { type RegistrationData } from './components/RegistrationPage';
import AdminDashboard from './components/AdminDashboard';
import QRScannerPage from './components/QRScannerPage';
import AdminLogin from './components/AdminLogin';

function App() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleAddRegistration = (registration: RegistrationData) => {
    setRegistrations(prev => [...prev, registration]);
  };

  const handleUpdateRegistration = (id: string, updates: Partial<RegistrationData>) => {
    setRegistrations(prev =>
      prev.map(reg => (reg.id === id ? { ...reg, ...updates } : reg))
    );
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Registration Page */}
        <Route 
          path="/" 
          element={<RegistrationPage onRegister={handleAddRegistration} />} 
        />
        
        {/* Admin Login Page */}
        <Route 
          path="/admin" 
          element={
            isAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminLogin onLogin={handleAdminLogin} />
            )
          } 
        />
        
        {/* Admin Dashboard (Protected) */}
        <Route 
          path="/admin/dashboard" 
          element={
            isAdmin ? (
              <AdminDashboard
                registrations={registrations}
                onUpdateRegistration={handleUpdateRegistration}
                onSendETicket={(id: string) => console.log('Send e-ticket to', id)}
                onLogout={handleLogout}
                onBackToRegister={() => window.location.href = '/'}
                onOpenScanner={() => window.location.href = '/admin/scanner'}
              />
            ) : (
              <Navigate to="/admin" replace />
            )
          } 
        />
        
        {/* QR Scanner Page (Protected) */}
        <Route 
          path="/admin/scanner" 
          element={
            isAdmin ? (
              <QRScannerPage
                registrations={registrations}
                onUpdateRegistration={handleUpdateRegistration}
                onBack={() => window.location.href = '/admin/dashboard'}
              />
            ) : (
              <Navigate to="/admin" replace />
            )
          } 
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;