import React, { useState } from 'react';
import RegistrationPage, { RegistrationData } from './components/RegistrationPage';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

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

  return (
    <div>
      {!isAdmin && <AdminLogin onLogin={() => setIsAdmin(true)} />}
      {isAdmin && (
        <AdminDashboard
          registrations={registrations}
          onUpdateRegistration={handleUpdateRegistration}
          onSendETicket={(id) => console.log('Send e-ticket to', id)}
          onLogout={() => setIsAdmin(false)}
          onBackToRegister={() => console.log('Back to registration')}
          onOpenScanner={() => console.log('Open scanner')}
        />
      )}
      <RegistrationPage onRegister={handleAddRegistration} />
    </div>
  );
}

export default App;
