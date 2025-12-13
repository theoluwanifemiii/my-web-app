import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegistrationPage, { type RegistrationData } from './components/RegistrationPage';
import AdminDashboard from './components/AdminDashboard';
import QRScannerPage from './components/QRScannerPage';
import AdminLogin from './components/AdminLogin';
import { supabase } from './lib/supabase';

function App() {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true';
  });

  // Load registrations from Supabase on mount
  useEffect(() => {
    loadRegistrations();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('registrations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'registrations' },
        () => {
          loadRegistrations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('isAdmin', isAdmin.toString());
  }, [isAdmin]);

  const loadRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert snake_case to camelCase
      const formattedData = (data || []).map((reg: any) => ({
        id: reg.id,
        name: reg.name,
        phone: reg.phone,
        email: reg.email,
        church: reg.church,
        zone: reg.zone,
        ticketType: reg.ticket_type,
        guestName: reg.guest_name,
        totalDue: reg.total_due,
        totalPaid: reg.total_paid,
        balance: reg.balance,
        paymentMethod: reg.payment_method,
        status: reg.status,
        transactionRef: reg.transaction_ref,
        receiptImage: reg.receipt_image,
        ticketQR: reg.ticket_qr,
        ticketGenerated: reg.ticket_generated,
        checkedIn: reg.checked_in,
        createdAt: reg.created_at,
      }));

      setRegistrations(formattedData);
    } catch (error) {
      console.error('Error loading registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegistration = async (registration: RegistrationData) => {
    try {
      // Convert camelCase to snake_case for Supabase
      const { error } = await supabase
        .from('registrations')
        .insert({
          id: registration.id,
          name: registration.name,
          phone: registration.phone,
          email: registration.email,
          church: registration.church,
          zone: registration.zone,
          ticket_type: registration.ticketType,
          guest_name: registration.guestName,
          total_due: registration.totalDue,
          total_paid: registration.totalPaid,
          balance: registration.balance,
          payment_method: registration.paymentMethod,
          status: registration.status,
          transaction_ref: registration.transactionRef,
          receipt_image: registration.receiptImage,
          created_at: registration.createdAt,
        });

      if (error) throw error;
      
      // Reload to get the new data
      await loadRegistrations();
    } catch (error) {
      console.error('Error adding registration:', error);
      alert('Failed to save registration. Please try again.');
    }
  };

  const handleUpdateRegistration = async (id: string, updates: Partial<RegistrationData>) => {
    try {
      // Convert camelCase to snake_case
      const supabaseUpdates: any = {};
      if (updates.totalPaid !== undefined) supabaseUpdates.total_paid = updates.totalPaid;
      if (updates.balance !== undefined) supabaseUpdates.balance = updates.balance;
      if (updates.status !== undefined) supabaseUpdates.status = updates.status;
      if (updates.ticketQR !== undefined) supabaseUpdates.ticket_qr = updates.ticketQR;
      if (updates.ticketGenerated !== undefined) supabaseUpdates.ticket_generated = updates.ticketGenerated;
      if (updates.checkedIn !== undefined) supabaseUpdates.checked_in = updates.checkedIn;

      const { error } = await supabase
        .from('registrations')
        .update(supabaseUpdates)
        .eq('id', id);

      if (error) throw error;
      
      // Reload to get the updated data
      await loadRegistrations();
    } catch (error) {
      console.error('Error updating registration:', error);
      alert('Failed to update registration. Please try again.');
    }
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('isAdmin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

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