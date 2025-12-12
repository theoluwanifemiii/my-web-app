import React, { useState } from 'react';
import { QrCode } from 'lucide-react';

interface RegistrationData {
  id: string;
  name: string;
  phone: string;
  email: string;
  church: string;
  zone: string;
  ticketType: 'solo' | 'guest';
  guestName?: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  paymentMethod: 'cash' | 'transfer' | null;
  status: 'paid' | 'pending';
  transactionRef?: string;
  receiptImage?: string | null;
  createdAt: string;
  checkedIn?: boolean;
}

interface QRScannerPageProps {
  registrations: RegistrationData[];
  onUpdateRegistration: (id: string, updates: Partial<RegistrationData>) => void;
  onBack: () => void;
}

export default function QRScannerPage({ registrations, onUpdateRegistration, onBack }: QRScannerPageProps) {
  const [scanResult, setScanResult] = useState<RegistrationData | null>(null);
  const [manualId, setManualId] = useState('');
  const [error, setError] = useState('');

  const handleManualSearch = () => {
    const reg = registrations.find(r => r.id === manualId.trim());
    if (!reg) {
      setError('Ticket ID not found');
      return;
    }
    if (reg.balance > 0) {
      setError('Payment incomplete. Balance: ₦' + reg.balance.toLocaleString());
      return;
    }
    setScanResult(reg);
    setError('');
  };

  const handleCheckIn = () => {
    if (scanResult) {
      onUpdateRegistration(scanResult.id, { checkedIn: true });
      setTimeout(() => {
        setScanResult(null);
        setManualId('');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 p-4 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <QrCode /> QR Scanner
      </h2>

      {!scanResult && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <input
            type="text"
            placeholder="Enter Ticket ID manually"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className="border p-2 rounded w-full mb-4"
          />
          <button
            onClick={handleManualSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-2"
          >
            Search Ticket
          </button>
          <button
            onClick={onBack}
            className="bg-gray-300 px-4 py-2 rounded w-full"
          >
            Back
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      )}

      {scanResult && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
          <h3 className="text-xl font-bold mb-2">{scanResult.name}</h3>
          <p className="mb-1">Church: {scanResult.church}</p>
          <p className="mb-1">Zone: {scanResult.zone}</p>
          <p className="mb-4">
            Ticket: {scanResult.ticketType} {scanResult.guestName ? `with guest: ${scanResult.guestName}` : ''}
          </p>

          {scanResult.checkedIn ? (
            <p className="text-green-600 font-bold mb-4">Already Checked In</p>
          ) : (
            <button
              onClick={handleCheckIn}
              className="bg-green-600 text-white px-4 py-2 rounded w-full mb-2"
            >
              Check In
            </button>
          )}
          <button
            onClick={() => { setScanResult(null); setManualId(''); setError(''); }}
            className="bg-gray-300 px-4 py-2 rounded w-full"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}