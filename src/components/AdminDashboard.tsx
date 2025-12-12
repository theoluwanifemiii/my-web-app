import React from 'react';
import type { RegistrationData } from './RegistrationPage'; // Add 'type' keyword

interface AdminDashboardProps {
  registrations: RegistrationData[];
  onUpdateRegistration: (id: string, updates: Partial<RegistrationData>) => void;
  onSendETicket: (id: string) => void;
  onLogout: () => void;
  onBackToRegister: () => void;
  onOpenScanner: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  registrations,
  onUpdateRegistration,
  onSendETicket,
  onLogout,
  onBackToRegister,
  onOpenScanner,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-2">
          <button
            className="bg-white text-purple-700 px-4 py-2 rounded-lg"
            onClick={onOpenScanner}
          >
            Open Scanner
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="bg-white rounded-2xl shadow-2xl p-6">
        <button
          className="mb-4 bg-gray-200 px-3 py-2 rounded"
          onClick={onBackToRegister}
        >
          Back to Registration
        </button>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2">Name</th>
              <th className="border-b p-2">Email</th>
              <th className="border-b p-2">Ticket Type</th>
              <th className="border-b p-2">Payment Status</th>
              <th className="border-b p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((reg) => (
              <tr key={reg.id} className="hover:bg-gray-100">
                <td className="border-b p-2">{reg.name}</td>
                <td className="border-b p-2">{reg.email}</td>
                <td className="border-b p-2">{reg.ticketType}</td>
                <td className="border-b p-2">{reg.status}</td>
                <td className="border-b p-2 flex gap-2">
                  <button
                    className="bg-green-500 text-white px-2 py-1 rounded"
                    onClick={() => onUpdateRegistration(reg.id, { checkedIn: true })}
                  >
                    Check In
                  </button>
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => onSendETicket(reg.id)}
                  >
                    Send E-Ticket
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default AdminDashboard;