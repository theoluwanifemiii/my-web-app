import { useState } from 'react'; // Remove React import
import RegistrationPage, { type RegistrationData } from './components/RegistrationPage';
import AdminDashboard from './components/AdminDashboard';
import QRScannerPage from './components/QRScannerPage';

function App() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleAddRegistration = (registration: RegistrationData) => {
    setRegistrations(prev => [...prev, registration]);
  };

  const handleUpdateRegistration = (id: string, updates: Partial<RegistrationData>) => {
    setRegistrations(prev =>
      prev.map(reg => (reg.id === id ? { ...reg, ...updates } : reg))
    );
  };

  // Show scanner view
  if (showScanner) {
    return (
      <QRScannerPage
        registrations={registrations}
        onUpdateRegistration={handleUpdateRegistration}
        onBack={() => setShowScanner(false)}
      />
    );
  }

  // Show admin dashboard
  if (isAdmin) {
    return (
      <AdminDashboard
        registrations={registrations}
        onUpdateRegistration={handleUpdateRegistration}
        onSendETicket={(id: string) => console.log('Send e-ticket to', id)}
        onLogout={() => setIsAdmin(false)}
        onBackToRegister={() => setIsAdmin(false)}
        onOpenScanner={() => setShowScanner(true)}
      />
    );
  }

  // Show registration page (default view)
  return <RegistrationPage onRegister={handleAddRegistration} />;
}

export default App;