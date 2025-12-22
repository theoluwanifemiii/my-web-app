import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import type { RegistrationData } from './RegistrationPage';

interface CheckInSheetProps {
  registrations: RegistrationData[];
}

const MEAL_LABELS: Record<string, string> = {
  'semo-egusi': 'Semo & Egusi',
  'amala-gbegiri': 'Amala & Gbegiri',
  'fufu-edikaikong': 'Fufu & Edikaikong',
  'eba-edikaikong': 'Eba & Edikaikong',
};

const CheckInSheet: React.FC<CheckInSheetProps> = ({ registrations }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredRegistrations = registrations.filter((reg) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      reg.name.toLowerCase().includes(query) ||
      reg.phone.toLowerCase().includes(query) ||
      reg.church.toLowerCase().includes(query) ||
      reg.zone.toLowerCase().includes(query);

    const matchesZone = zoneFilter === 'all' || reg.zone === zoneFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'checked-in' && reg.checkedIn) ||
      (statusFilter === 'not-checked-in' && !reg.checkedIn);

    return matchesSearch && matchesZone && matchesStatus;
  });

  const totalCheckedIn = registrations.filter(r => r.checkedIn).length;
  const totalNotCheckedIn = registrations.length - totalCheckedIn;
  const checkInRate = registrations.length > 0 
    ? Math.round((totalCheckedIn / registrations.length) * 100) 
    : 0;

  const exportCheckInSheet = () => {
    const headers = ['Name', 'Phone', 'Church', 'Zone', 'Ticket Type', 'Guest/Group', 'Meal Choice', 'Total Due', 'Paid', 'Balance', 'Checked In', 'Check-In Time'];
    const rows = filteredRegistrations.map(reg => {
      const checkInTime = reg.checkedIn ? new Date().toLocaleString() : '-';
      
      return [
        reg.name,
        reg.phone,
        reg.church,
        reg.zone,
        reg.ticketType === 'solo' ? 'Solo' : reg.ticketType === 'guest' ? 'Me + 1' : 'Group',
        reg.guestName || (reg.groupSize ? `${reg.groupSize} people` : '-'),
        reg.mealChoice ? MEAL_LABELS[reg.mealChoice] : '-',
        reg.totalDue,
        reg.totalPaid,
        reg.balance,
        reg.checkedIn ? 'YES' : 'NO',
        checkInTime,
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `check-in-sheet-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = zoneFilter !== 'all' || statusFilter !== 'all' || searchQuery;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link 
                to="/admin/dashboard" 
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Check-In Sheet</h1>
            </div>
            <button 
              onClick={exportCheckInSheet} 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />Export
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="text-sm text-blue-700 font-medium">Total</div>
              </div>
              <div className="text-2xl font-bold text-blue-900">{registrations.length}</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div className="text-sm text-green-700 font-medium">Checked In</div>
              </div>
              <div className="text-2xl font-bold text-green-900">{totalCheckedIn}</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <div className="text-sm text-yellow-700 font-medium">Pending</div>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{totalNotCheckedIn}</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <div className="text-sm text-purple-700 font-medium">Check-In Rate</div>
              </div>
              <div className="text-2xl font-bold text-purple-900">{checkInRate}%</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, phone, church..."
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
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Filters</span>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setZoneFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
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
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="checked-in">Checked In</option>
                  <option value="not-checked-in">Not Checked In</option>
                </select>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 mt-3">
            Showing {filteredRegistrations.length} of {registrations.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Church</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Zone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Meal</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Payment</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      {hasActiveFilters ? 'No registrations match your filters' : 'No registrations yet'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <tr key={reg.id} className={`hover:bg-gray-50 transition ${reg.checkedIn ? 'bg-green-50/30' : ''}`}>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{reg.name}</div>
                        <div className="text-xs text-gray-500">{reg.phone}</div>
                        {reg.guestName && (
                          <div className="text-xs text-purple-600 mt-0.5">+ {reg.guestName}</div>
                        )}
                        {reg.groupSize && (
                          <div className="text-xs text-purple-600 mt-0.5">👥 Group of {reg.groupSize}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{reg.church}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {reg.zone}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {reg.ticketType === 'solo' ? 'Solo' : reg.ticketType === 'guest' ? 'Me + 1' : 'Group'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {reg.mealChoice ? MEAL_LABELS[reg.mealChoice] : '-'}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">₦{reg.totalPaid.toLocaleString()}</div>
                        {reg.balance > 0 && (
                          <div className="text-xs text-yellow-600">₦{reg.balance.toLocaleString()} due</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {reg.checkedIn ? (
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Checked In
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            Pending
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInSheet;