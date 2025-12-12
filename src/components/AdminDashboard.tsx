import React from 'react';
import { Link } from 'react-router-dom';
import type { RegistrationData } from './RegistrationPage';

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
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Link
            to="/admin/scanner"
            className="bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            Open Scanner
          </Link>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main className="bg-white rounded-2xl shadow-2xl p-6">
        <Link
          to="/"
          className="mb-4 inline-block bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 transition"
        >
          ← Back to Registration
        </Link>

        <h2 className="text-xl font-bold mb-4 mt-4">
          Registrations ({registrations.length})
        </h2>

        {registrations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No registrations yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-b p-3">Name</th>
                  <th className="border-b p-3">Email</th>
                  <th className="border-b p-3">Phone</th>
                  <th className="border-b p-3">Church</th>
                  <th className="border-b p-3">Zone</th>
                  <th className="border-b p-3">Ticket</th>
                  <th className="border-b p-3">Status</th>
                  <th className="border-b p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="border-b p-3">{reg.name}</td>
                    <td className="border-b p-3">{reg.email}</td>
                    <td className="border-b p-3">{reg.phone}</td>
                    <td className="border-b p-3">{reg.church}</td>
                    <td className="border-b p-3">{reg.zone}</td>
                    <td className="border-b p-3">
                      {reg.ticketType}
                      {reg.guestName && (
                        <span className="text-xs text-gray-500 block">
                          +{reg.guestName}
                        </span>
                      )}
                    </td>
                    <td className="border-b p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        reg.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="border-b p-3">
                      <div className="flex gap-2">
                        <button
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600 transition disabled:bg-gray-300"
                          onClick={() => onUpdateRegistration(reg.id, { checkedIn: true })}
                          disabled={reg.checkedIn}
                        >
                          {reg.checkedIn ? '✓ Checked In' : 'Check In'}
                        </button>
                        <button
                          className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600 transition"
                          onClick={() => onSendETicket(reg.id)}
                        >
                          E-Ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;