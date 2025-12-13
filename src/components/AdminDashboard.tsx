import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, LogOut, QrCode } from 'lucide-react';
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
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const handleApprove = (reg: RegistrationData) => {
    onUpdateRegistration(reg.id, {
      status: 'paid',
      totalPaid: reg.totalDue,
      balance: 0,
    });
  };

  const handleSendETicket = (id: string) => {
    setSendingEmail(id);
    onSendETicket(id);
    setTimeout(() => setSendingEmail(null), 1000);
  };

  const handleAddPartialPayment = (reg: RegistrationData) => {
    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newTotalPaid = reg.totalPaid + amount;
    const newBalance = reg.totalDue - newTotalPaid;

    onUpdateRegistration(reg.id, {
      totalPaid: newTotalPaid,
      balance: newBalance,
      status: newBalance <= 0 ? 'paid' : reg.status,
    });

    setShowAddPayment(null);
    setPartialAmount('');
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Church', 'Zone', 'Ticket Type', 'Guest Name', 'Total Due', 'Total Paid', 'Balance', 'Payment Method', 'Status'];
    const rows = registrations.map(reg => [
      reg.name,
      reg.email,
      reg.phone,
      reg.church,
      reg.zone,
      reg.ticketType === 'solo' ? 'Solo' : 'Me + 1 Guest',
      reg.guestName || '-',
      reg.totalDue,
      reg.totalPaid,
      reg.balance,
      reg.paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer',
      reg.status === 'paid' ? 'Paid' : 'Pending',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalRevenue = registrations.reduce((sum, reg) => sum + reg.totalPaid, 0);
  const pendingAmount = registrations.reduce((sum, reg) => sum + reg.balance, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            <div className="flex gap-2 flex-wrap">
              <Link
                to="/admin/scanner"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <QrCode className="w-4 h-4" />
                Scanner
              </Link>
              <Link
                to="/"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Register New
              </Link>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="text-sm opacity-90">Total Revenue</div>
              <div className="text-3xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
              <div className="text-sm opacity-90">Pending Balance</div>
              <div className="text-3xl font-bold">₦{pendingAmount.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="text-sm opacity-90">Total Registrations</div>
              <div className="text-3xl font-bold">{registrations.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Church</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Zone</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">Amount</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {registrations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No registrations yet
                  </td>
                </tr>
              ) : (
                registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{reg.name}</div>
                      {reg.guestName && (
                        <div className="text-xs text-gray-500">+ {reg.guestName}</div>
                      )}
                      <div className="text-xs text-gray-500">{reg.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-sm">{reg.church}</td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {reg.zone}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-medium">₦{reg.totalDue.toLocaleString()}</div>
                      <div className="text-xs text-green-600">
                        Paid: ₦{reg.totalPaid.toLocaleString()}
                      </div>
                      {reg.balance > 0 && (
                        <div className="text-xs text-red-600">
                          Bal: ₦{reg.balance.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          reg.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {reg.status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {reg.status === 'pending' && reg.paymentMethod === 'transfer' && (
                          <button
                            onClick={() => handleApprove(reg)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                          >
                            Approve
                          </button>
                        )}
                        {reg.balance > 0 && (
                          <button
                            onClick={() => setShowAddPayment(reg.id)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                          >
                            Add $
                          </button>
                        )}
                        {reg.balance === 0 && (
                          <button
                            onClick={() => handleSendETicket(reg.id)}
                            disabled={sendingEmail === reg.id}
                            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition disabled:opacity-50"
                          >
                            {sendingEmail === reg.id ? 'Sending...' : 'E-Ticket'}
                          </button>
                        )}
                        {reg.receiptImage && (
                          <button
                            onClick={() => setViewReceipt(reg.receiptImage!)}
                            className="px-2 py-1 bg-gray-400 text-white text-xs rounded hover:bg-gray-500 transition"
                          >
                            Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add Payment Modal */}
        {showAddPayment && registrations.find((r) => r.id === showAddPayment) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Add Partial Payment</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Balance: ₦
                  {registrations
                    .find((r) => r.id === showAddPayment)
                    ?.balance.toLocaleString()}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddPayment(null);
                    setPartialAmount('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleAddPartialPayment(
                      registrations.find((r) => r.id === showAddPayment)!
                    )
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        {viewReceipt && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setViewReceipt(null)}
          >
            <div
              className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Payment Receipt</h3>
                <button
                  onClick={() => setViewReceipt(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <img src={viewReceipt} alt="Receipt" className="w-full rounded" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;