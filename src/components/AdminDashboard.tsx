import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, LogOut, QrCode, Search, Filter } from 'lucide-react';
import type { RegistrationData } from './RegistrationPage';

interface AdminDashboardProps {
  registrations: RegistrationData[];
  onUpdateRegistration: (id: string, updates: Partial<RegistrationData>) => void;
  onSendETicket: (id: string) => void;
  onLogout: () => void;
  onBackToRegister: () => void;
  onOpenScanner: () => void;
}

const MEAL_LABELS: Record<string, string> = {
  'semo-egusi': 'Semo & Egusi Elefo',
  'amala-gbegiri': 'Amala, Gbegiri & Ewedu',
  'fufu-edikaikong': 'Fufu & Edikaikong',
  'eba-edikaikong': 'Yellow Eba & Edikaikong',
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  registrations,
  onUpdateRegistration,
  onLogout,
}) => {
  const [showAddPayment, setShowAddPayment] = useState<string | null>(null);
  const [partialAmount, setPartialAmount] = useState('');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [viewTicket, setViewTicket] = useState<RegistrationData | null>(null);
  const [approvingPayment, setApprovingPayment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleApprove = async (reg: RegistrationData) => {
    try {
      // Generate QR code
      const qrData = JSON.stringify({
        id: reg.id,
        name: reg.name,
        ticketType: reg.ticketType,
        guestName: reg.guestName,
      });
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

      console.log('=== APPROVE BUTTON CLICKED ===');
      console.log('Registration ID:', reg.id);
      console.log('Approving payment...');
      
      setApprovingPayment(reg.id);
      
      await onUpdateRegistration(reg.id, {
        status: 'paid',
        totalPaid: reg.totalDue,
        balance: 0,
        ticketQR: qrCode,
        ticketGenerated: true,
      });

      console.log('✅ Payment approved successfully!');
      setApprovingPayment(null);
    } catch (error) {
      console.error('❌ Error approving payment:', error);
      setApprovingPayment(null);
      alert('Failed to approve payment. Please try again.');
    }
  };

 [{
	"resource": "/Users/apple/my-web-app/src/components/AdminDashboard.tsx",
	"owner": "typescript",
	"code": "6133",
	"severity": 4,
	"message": "'handleSendETicket' is declared but its value is never read.",
	"source": "ts",
	"startLineNumber": 72,
	"startColumn": 9,
	"endLineNumber": 72,
	"endColumn": 26,
	"tags": [
		1
	],
	"origin": "extHost1"
},{
	"resource": "/Users/apple/my-web-app/src/components/AdminDashboard.tsx",
	"owner": "typescript",
	"code": "2304",
	"severity": 8,
	"message": "Cannot find name 'setSendingEmail'.",
	"source": "ts",
	"startLineNumber": 75,
	"startColumn": 22,
	"endLineNumber": 75,
	"endColumn": 37,
	"origin": "extHost1"
},{
	"resource": "/Users/apple/my-web-app/src/components/AdminDashboard.tsx",
	"owner": "typescript",
	"code": "2304",
	"severity": 8,
	"message": "Cannot find name 'setSendingEmail'.",
	"source": "ts",
	"startLineNumber": 73,
	"startColumn": 5,
	"endLineNumber": 73,
	"endColumn": 20,
	"origin": "extHost1"
}]

  const handleAddPartialPayment = async (reg: RegistrationData) => {
    try {
      const amount = parseFloat(partialAmount);
      if (isNaN(amount) || amount <= 0) return;

      const newTotalPaid = reg.totalPaid + amount;
      const newBalance = reg.totalDue - newTotalPaid;

      // If fully paid, generate ticket immediately
      if (newBalance <= 0) {
        const qrData = JSON.stringify({
          id: reg.id,
          name: reg.name,
          ticketType: reg.ticketType,
          guestName: reg.guestName,
        });
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
        
        await onUpdateRegistration(reg.id, {
          totalPaid: newTotalPaid,
          balance: 0,
          status: 'paid',
          ticketQR: qrCode,
          ticketGenerated: true,
        });
      } else {
        await onUpdateRegistration(reg.id, {
          totalPaid: newTotalPaid,
          balance: newBalance,
          status: 'pending',
        });
      }

      setShowAddPayment(null);
      setPartialAmount('');
    } catch (error) {
      console.error('Error adding partial payment:', error);
      alert('Failed to add payment. Please try again.');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Church', 'Zone', 'Ticket Type', 'Guest Name', 'Group Size', 'Additional Attendees', 'Meal Choice', 'Total Due', 'Total Paid', 'Balance', 'Payment Method', 'Receiver/Ref', 'Status', 'Checked In'];
    const rows = filteredRegistrations.map(reg => {
      // Format additional attendees
      let attendeesText = '-';
      if (reg.additionalAttendees && reg.additionalAttendees.length > 0) {
        attendeesText = reg.additionalAttendees.map(a => `${a.name} (${MEAL_LABELS[a.mealChoice] || a.mealChoice})`).join('; ');
      }

      return [
        reg.name,
        reg.email,
        reg.phone,
        reg.church,
        reg.zone,
        reg.ticketType === 'solo' ? 'Solo' : reg.ticketType === 'guest' ? 'Me + 1 Guest' : 'Group',
        reg.guestName || '-',
        reg.groupSize || '-',
        attendeesText,
        reg.mealChoice ? MEAL_LABELS[reg.mealChoice] || reg.mealChoice : '-',
        reg.totalDue,
        reg.totalPaid,
        reg.balance,
        reg.paymentMethod === 'cash' ? 'Cash' : 'Bank Transfer',
        reg.receiverName || reg.transactionRef || '-',
        reg.status === 'paid' ? 'Paid' : 'Pending',
        reg.checkedIn ? 'Yes' : 'No',
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      reg.name.toLowerCase().includes(query) ||
      reg.email.toLowerCase().includes(query) ||
      reg.phone.toLowerCase().includes(query) ||
      reg.church.toLowerCase().includes(query) ||
      reg.zone.toLowerCase().includes(query) ||
      reg.guestName?.toLowerCase().includes(query) ||
      reg.id.toLowerCase().includes(query);

    const matchesZone = zoneFilter === 'all' || reg.zone === zoneFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || reg.paymentMethod === paymentMethodFilter;
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;

    return matchesSearch && matchesZone && matchesPaymentMethod && matchesStatus;
  });

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

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, phone, church, zone, or ticket ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="all">All Zones</option>
            <option value="Akoka">Akoka</option>
            <option value="Ilaje">Ilaje</option>
            <option value="Jebako">Jebako</option>
            <option value="Shomolu">Shomolu</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="cash">Cash</option>
            <option value="transfer">Bank Transfer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          {(zoneFilter !== 'all' || paymentMethodFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setZoneFilter('all');
                setPaymentMethodFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Showing {filteredRegistrations.length} of {registrations.length} registrations
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Name</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Church</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Zone</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Meal</th>
                <th className="px-3 py-3 text-right font-semibold text-gray-700">Amount</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchQuery || zoneFilter !== 'all' || paymentMethodFilter !== 'all' || statusFilter !== 'all'
                      ? 'No registrations match your filters'
                      : 'No registrations yet'}
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">{reg.name}</div>
                      {reg.guestName && (
                        <div className="text-xs text-gray-500">+ {reg.guestName}</div>
                      )}
                      {reg.ticketType === 'group' && reg.groupSize && (
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          Group of {reg.groupSize} people
                        </div>
                      )}
                      {reg.additionalAttendees && reg.additionalAttendees.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {reg.additionalAttendees.slice(0, 2).map((attendee, i) => (
                            <div key={i}>• {attendee.name}</div>
                          ))}
                          {reg.additionalAttendees.length > 2 && (
                            <div className="text-blue-600">
                              + {reg.additionalAttendees.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{reg.phone}</div>
                      {reg.receiverName && (
                        <div className="text-xs text-blue-600">Paid to: {reg.receiverName}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-sm">{reg.church}</td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {reg.zone}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-600">
                        {reg.mealChoice ? MEAL_LABELS[reg.mealChoice] || reg.mealChoice : '-'}
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
                      <div className="text-xs text-gray-500 mt-1">
                        {reg.paymentMethod === 'cash' ? '💵 Cash' : '🏦 Transfer'}
                      </div>
                      {reg.ticketGenerated && (
                        <div className="text-xs text-blue-600 mt-1">✓ Ticket Ready</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {reg.status === 'pending' && reg.paymentMethod === 'transfer' && (
                          <button
                            onClick={() => handleApprove(reg)}
                            disabled={approvingPayment === reg.id}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approvingPayment === reg.id ? 'Approving...' : 'Approve'}
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
                        {reg.balance === 0 && !reg.ticketGenerated && (
                          <button
                            onClick={() => handleApprove(reg)}
                            disabled={approvingPayment === reg.id}
                            className="px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {approvingPayment === reg.id ? 'Generating...' : 'Generate'}
                          </button>
                        )}
                        {reg.ticketQR && (
                          <button
                            onClick={() => setViewTicket(reg)}
                            className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition"
                          >
                            View
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

        {/* Ticket Modal */}
        {viewTicket && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setViewTicket(null)}
          >
            <div
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">E-Ticket</h3>
                <button
                  onClick={() => setViewTicket(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="text-center mb-4">
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">Thanksgiving Dinner</h4>
                  <p className="text-gray-600">Dec 31, 2024 • 7:00 PM</p>
                </div>
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-500">Name</div>
                      <div className="font-semibold">{viewTicket.name}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Church</div>
                      <div className="font-semibold">{viewTicket.church}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Zone</div>
                      <div className="font-semibold">{viewTicket.zone}</div>
                    </div>
                    {viewTicket.guestName && (
                      <div>
                        <div className="text-gray-500">Guest</div>
                        <div className="font-semibold">{viewTicket.guestName}</div>
                      </div>
                    )}
                    {viewTicket.ticketType === 'group' && viewTicket.groupSize && (
                      <div className="col-span-2">
                        <div className="text-gray-500">Group Size</div>
                        <div className="font-semibold">{viewTicket.groupSize} people</div>
                      </div>
                    )}
                    {viewTicket.mealChoice && (
                      <div className="col-span-2">
                        <div className="text-gray-500">Meal Choice (Primary)</div>
                        <div className="font-semibold">
                          {MEAL_LABELS[viewTicket.mealChoice] || viewTicket.mealChoice}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Attendees */}
                  {viewTicket.additionalAttendees && viewTicket.additionalAttendees.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-gray-500 text-sm mb-2 font-medium">Group Members:</div>
                      <div className="space-y-2">
                        {viewTicket.additionalAttendees.map((attendee, index) => (
                          <div key={index} className="bg-purple-50 rounded-lg p-2 text-xs">
                            <div className="font-semibold text-purple-900">
                              {index + 2}. {attendee.name}
                            </div>
                            <div className="text-purple-700">
                              Meal: {MEAL_LABELS[attendee.mealChoice] || attendee.mealChoice}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {viewTicket.ticketQR && (
                  <div className="text-center">
                    <img
                      src={viewTicket.ticketQR}
                      alt="QR"
                      className="w-48 h-48 mx-auto mb-2"
                    />
                    <p className="text-xs text-gray-600">Scan at entrance</p>
                    <p className="text-xs text-gray-500 mt-2">ID: {viewTicket.id}</p>
                  </div>
                )}
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