import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import RegistrationPage, { type RegistrationData } from './components/RegistrationPage';
import AdminDashboard from './components/AdminDashboard';
import QRScannerPage from './components/QRScannerPage';
import AdminLogin from './components/AdminLogin';

function App() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>(() => {
    const saved = localStorage.getItem('registrations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('registrations', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin.toString());
  }, [isAdmin]);

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
    localStorage.removeItem('isAdmin');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={<RegistrationPage onRegister={handleAddRegistration} />} 
        />
        
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
        
        <Route 
          path="/admin/dashboard" 
          element={
            isAdmin ? (
              <AdminDashboard
                registrations={registrations}
                onUpdateRegistration={handleUpdateRegistration}
                onSendETicket={(id: string) => console.log('Send e-ticket to', id)}
                onLogout={handleLogout}
                onBackToRegister={() => {}}
                onOpenScanner={() => {}}
              />
            ) : (
              <Navigate to="/admin" replace />
            )
          } 
        />
        
        <Route 
          path="/admin/scanner" 
          element={
            isAdmin ? (
              <QRScannerPage
                registrations={registrations}
                onUpdateRegistration={handleUpdateRegistration}
                onBack={() => {}}
              />
            ) : (
              <Navigate to="/admin" replace />
            )
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;