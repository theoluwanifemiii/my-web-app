import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  LogOut,
  QrCode,
  Search,
  Filter,
  X,
  Eye,
  Check,
  DollarSign,
  History,
} from "lucide-react";
import type { RegistrationData } from './RegistrationPage';
import { getPaymentHistory, approvePayment, addPayment, type Payment } from '../services/paymentService';
import { supabase } from '../lib/supabase';

interface AdminDashboardProps {
  registrations: RegistrationData[];
  onUpdateRegistration: (id: string, updates: Partial<RegistrationData>) => void;
  onSendETicket: (id: string) => void;
  onLogout: () => void;
  onBackToRegister: () => void;
  onOpenScanner: () => void;
}

const MEAL_LABELS: Record<string, string> = {
  'semo-egusi': 'Semo & Egusi',
  'amala-gbegiri': 'Amala & Gbegiri',
  'fufu-edikaikong': 'Fufu & Edikaikong',
  'eba-edikaikong': 'Eba & Edikaikong',
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  registrations,
  onLogout,
}) => {
  const [selectedReg, setSelectedReg] = useState<RegistrationData | null>(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer'>('cash');
  const [receiverName, setReceiverName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const [approvingPayment, setApprovingPayment] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedReg && showPaymentHistory) {
      loadPaymentHistory(selectedReg.id);
    }
  }, [selectedReg, showPaymentHistory]);

  const loadPaymentHistory = async (registrationId: string) => {
    const history = await getPaymentHistory(registrationId);
    setPaymentHistory(history);
  };

  const handleApprove = async (reg: RegistrationData) => {
    try {
      setApprovingPayment(reg.id);
      setError('');

      const { data: pendingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('registration_id', reg.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (!pendingPayments || pendingPayments.length === 0) {
        setError('No pending payments to approve');
        setApprovingPayment(null);
        return;
      }

      const payment = pendingPayments[0];

      const result = await approvePayment(payment.id, reg.id, 'Admin');

      if (!result.success) {
        setError(result.error || 'Failed to approve payment');
        setApprovingPayment(null);
        return;
      }

      const { data: updatedReg } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', reg.id)
        .single();

      if (updatedReg && updatedReg.balance <= 0 && !updatedReg.ticket_qr) {
        const qrData = JSON.stringify({
          id: reg.id,
          name: reg.name,
          ticketType: reg.ticketType,
          guestName: reg.guestName,
        });
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;

        await supabase
          .from('registrations')
          .update({
            ticket_qr: qrCode,
            ticket_generated: true,
          })
          .eq('id', reg.id);
      }

      setApprovingPayment(null);
      setSelectedReg(null);
      setShowTicket(false);
    } catch (error) {
      console.error('Error approving payment:', error);
      setError('Failed to approve payment');
      setApprovingPayment(null);
    }
  };

  const handleAddPartialPayment = async () => {
    if (!selectedReg) return;

    const amount = parseFloat(partialAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > selectedReg.balance) {
      setError(`Amount cannot exceed balance of ₦${selectedReg.balance.toLocaleString()}`);
      return;
    }

    if (paymentMethod === 'cash' && !receiverName.trim()) {
      setError('Please enter receiver name');
      return;
    }

    if (paymentMethod === 'transfer' && !transactionRef.trim()) {
      setError('Please enter transaction reference');
      return;
    }

    const result = await addPayment({
      registrationId: selectedReg.id,
      amount,
      paymentMethod,
      receiverName: paymentMethod === 'cash' ? receiverName : undefined,
      transactionRef: paymentMethod === 'transfer' ? transactionRef : undefined,
    });

    if (!result.success) {
      setError(result.error || 'Failed to add payment');
      return;
    }

    setShowAddPayment(false);
    setPartialAmount('');
    setReceiverName('');
    setTransactionRef('');
    setPaymentMethod('cash');
    setError('');
    setSelectedReg(null);
    setApprovingPayment(null);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Church', 'Zone', 'Ticket Type', 'Guest Name', 'Group Size', 'Additional Attendees', 'Meal Choice', 'Total Due', 'Total Paid', 'Balance', 'Payment Method', 'Receiver/Ref', 'Status', 'Checked In'];
    const rows = filteredRegistrations.map(reg => {
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

  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      reg.name.toLowerCase().includes(query) ||
      reg.email.toLowerCase().includes(query) ||
      reg.phone.toLowerCase().includes(query) ||
      reg.church.toLowerCase().includes(query) ||
      reg.zone.toLowerCase().includes(query) ||
      reg.id.toLowerCase().includes(query);

    const matchesZone = zoneFilter === 'all' || reg.zone === zoneFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || reg.paymentMethod === paymentMethodFilter;
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;

    return matchesSearch && matchesZone && matchesPaymentMethod && matchesStatus;
  });

  const totalRevenue = registrations.reduce((sum, reg) => sum + reg.totalPaid, 0);
  const pendingAmount = registrations.reduce((sum, reg) => sum + reg.balance, 0);
  const hasActiveFilters = zoneFilter !== 'all' || paymentMethodFilter !== 'all' || statusFilter !== 'all' || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex gap-2">
              <Link to="/admin/scanner" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2">
                <QrCode className="w-4 h-4" />Scanner
              </Link>
              <button onClick={onLogout} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center gap-2">
                <LogOut className="w-4 h-4" />Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="text-sm text-green-700 font-medium">Total Revenue</div>
              <div className="text-2xl font-bold text-green-900">₦{totalRevenue.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <div className="text-sm text-yellow-700 font-medium">Pending</div>
              <div className="text-2xl font-bold text-yellow-900">₦{pendingAmount.toLocaleString()}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="text-sm text-purple-700 font-medium">Registrations</div>
              <div className="text-2xl font-bold text-purple-900">{registrations.length}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, phone, church..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg border transition flex items-center gap-2 ${showFilters ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && !showFilters && (
                <span className="w-2 h-2 bg-purple-600 rounded-full"></span>
              )}
            </button>
            <button onClick={exportToCSV} className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
              <Download className="w-4 h-4" />Export
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setZoneFilter('all');
                      setPaymentMethodFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
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
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="all">All Payments</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 mt-3">
            Showing {filteredRegistrations.length} of {registrations.length}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Attendee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Church</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zone</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      {hasActiveFilters ? 'No registrations match your filters' : 'No registrations yet'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{reg.name}</div>
                        {reg.ticketType === 'group' && reg.groupSize && (
                          <div className="text-xs text-purple-600 font-medium mt-0.5">
                            Group of {reg.groupSize}
                          </div>
                        )}
                        {reg.guestName && (
                          <div className="text-xs text-gray-500 mt-0.5">+ {reg.guestName}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5">{reg.phone}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{reg.church}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {reg.zone}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="font-semibold text-gray-900">₦{reg.totalDue.toLocaleString()}</div>
                        <div className="text-xs text-green-600">Paid: ₦{reg.totalPaid.toLocaleString()}</div>
                        {reg.balance > 0 && (
                          <div className="text-xs text-red-600">Due: ₦{reg.balance.toLocaleString()}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reg.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reg.status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {reg.paymentMethod === 'cash' ? 'Cash' : 'Transfer'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedReg(reg);
                              setShowPaymentHistory(false);
                              setShowAddPayment(false);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {reg.status === 'pending' && reg.paymentMethod === 'transfer' && (
                            <button
                              onClick={() => handleApprove(reg)}
                              disabled={approvingPayment === reg.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                              title="Approve Payment"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}

                          {reg.balance > 0 && (
                            <button
                              onClick={() => {
                                setSelectedReg(reg);
                                setShowAddPayment(true);
                                setShowPaymentHistory(false);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Add Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedReg(reg);
                              setShowPaymentHistory(true);
                              setShowAddPayment(false);
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Payment History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedReg && !showAddPayment && !showPaymentHistory && !showTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => {
          setSelectedReg(null);
          setShowTicket(false);
        }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Registration Details</h3>
              <button onClick={() => {
                setSelectedReg(null);
                setShowTicket(false);
              }} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="font-medium">{selectedReg.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="font-medium">{selectedReg.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-medium">{selectedReg.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Church</div>
                    <div className="font-medium">{selectedReg.church}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Zone</div>
                    <div className="font-medium">{selectedReg.zone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Meal Choice</div>
                    <div className="font-medium">{selectedReg.mealChoice ? MEAL_LABELS[selectedReg.mealChoice] : '-'}</div>
                  </div>
                </div>
              </div>

              {selectedReg.additionalAttendees && selectedReg.additionalAttendees.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Group Members ({selectedReg.groupSize} total)</h4>
                  <div className="space-y-2">
                    {selectedReg.additionalAttendees.map((attendee, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="font-medium text-purple-900">{index + 2}. {attendee.name}</div>
                        <div className="text-sm text-purple-700">Meal: {MEAL_LABELS[attendee.mealChoice]}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Due:</span>
                    <span className="font-semibold">₦{selectedReg.totalDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-semibold text-green-600">₦{selectedReg.totalPaid.toLocaleString()}</span>
                  </div>
                  {selectedReg.balance > 0 && (
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-semibold text-red-600">₦{selectedReg.balance.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-medium">{selectedReg.paymentMethod === 'cash' ? 'Cash' : 'Transfer'}</span>
                  </div>
                  {selectedReg.receiverName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Received By:</span>
                      <span className="font-medium">{selectedReg.receiverName}</span>
                    </div>
                  )}
                  {selectedReg.transactionRef && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-medium">{selectedReg.transactionRef}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {selectedReg.status === 'pending' && selectedReg.paymentMethod === 'transfer' && (
                  <button
                    onClick={() => {
                      handleApprove(selectedReg);
                    }}
                    disabled={approvingPayment === selectedReg.id}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                  >
                    {approvingPayment === selectedReg.id ? 'Approving...' : 'Approve Payment'}
                  </button>
                )}
                {selectedReg.receiptImage && (
                  <button
                    onClick={() => setViewReceipt(selectedReg.receiptImage!)}
                    className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                  >
                    View Receipt
                  </button>
                )}
                {selectedReg.ticketQR && (
                  <button
                    onClick={() => setShowTicket(true)}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                  >
                    View Ticket
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowPaymentHistory(true);
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <History className="w-4 h-4" />
                  Payment History
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      {showTicket && selectedReg && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setShowTicket(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold">E-Ticket</h3>
              <button onClick={() => setShowTicket(false)} className="p-1 hover:bg-white/20 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-gray-900 mb-1">Thanksgiving Dinner 2024</h4>
                <p className="text-gray-600">December 31, 2024 • 7:00 PM</p>
              </div>

              {/* Primary Attendee */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 mb-4 border-2 border-purple-200">
                <div className="text-sm text-purple-600 font-medium mb-2">Primary Registrant</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs">Name</div>
                    <div className="font-semibold text-gray-900">{selectedReg.name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Church</div>
                    <div className="font-semibold text-gray-900">{selectedReg.church}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Zone</div>
                    <div className="font-semibold text-gray-900">{selectedReg.zone}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Meal</div>
                    <div className="font-semibold text-gray-900 text-xs">
                      {selectedReg.mealChoice ? MEAL_LABELS[selectedReg.mealChoice] : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest or Group Members */}
              {selectedReg.guestName && (
                <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium mb-2">Guest</div>
                  <div className="font-semibold text-gray-900">{selectedReg.guestName}</div>
                </div>
              )}

              {selectedReg.additionalAttendees && selectedReg.additionalAttendees.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 font-medium mb-2">
                    Additional Attendees ({selectedReg.additionalAttendees.length})
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedReg.additionalAttendees.map((attendee, index) => (
                      <div key={index} className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-purple-900 text-sm">
                              {index + 2}. {attendee.name}
                            </div>
                            <div className="text-xs text-purple-700">
                              {MEAL_LABELS[attendee.mealChoice] || attendee.mealChoice}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* QR Code */}
              {selectedReg.ticketQR && (
                <div className="text-center bg-white rounded-xl p-4 border-2 border-gray-200">
                  <img
                    src={selectedReg.ticketQR}
                    alt="QR Code"
                    className="w-48 h-48 mx-auto mb-3"
                  />
                  <p className="text-sm text-gray-600 mb-1">Scan at entrance</p>
                  <p className="text-xs text-gray-500 font-mono">ID: {selectedReg.id}</p>
                </div>
              )}

              {/* Total Attendees Summary */}
              {selectedReg.ticketType === 'group' && selectedReg.groupSize && (
                <div className="mt-4 bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                  <div className="text-sm text-green-700">
                    <span className="font-semibold">Total Attendees: {selectedReg.groupSize}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddPayment && selectedReg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Add Payment</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={partialAmount}
                  onChange={(e) => setPartialAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Balance: ₦{selectedReg.balance.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'transfer')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                </select>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Receiver Name</label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="Name of person receiving payment"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Reference</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Transaction reference"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddPayment(false);
                  setPartialAmount('');
                  setReceiverName('');
                  setTransactionRef('');
                  setError('');
                }}
                disabled={approvingPayment === selectedReg?.id}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPartialPayment}
                disabled={approvingPayment === selectedReg?.id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {approvingPayment === selectedReg?.id ? 'Processing...' : 'Add Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentHistory && selectedReg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowPaymentHistory(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Payment History - {selectedReg.name}</h3>
              <button onClick={() => setShowPaymentHistory(false)} className="p-2 hover:bg-gray-100 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {paymentHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No payment history found
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className={`p-4 rounded-lg border ${
                      payment.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-lg">₦{payment.amount.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">
                            {payment.payment_method === 'cash' ? 'Cash Payment' : 'Bank Transfer'}
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                      </div>

                      {payment.receiver_name && (
                        <div className="text-sm text-gray-600">
                          Received by: {payment.receiver_name}
                        </div>
                      )}

                      {payment.transaction_ref && (
                        <div className="text-sm text-gray-600">
                          Reference: {payment.transaction_ref}
                        </div>
                      )}

                      {payment.approved_by && (
                        <div className="text-sm text-gray-600">
                          Approved by: {payment.approved_by}
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(payment.created_at).toLocaleString()}
                      </div>

                      {payment.receipt_image && (
                        <button
                          onClick={() => setViewReceipt(payment.receipt_image!)}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          View Receipt
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setViewReceipt(null)}>
          <div className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Payment Receipt</h3>
              <button onClick={() => setViewReceipt(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            <img src={viewReceipt} alt="Receipt" className="w-full rounded" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
