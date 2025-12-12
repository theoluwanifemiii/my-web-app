import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RegistrationData } from './RegistrationPage';

interface QRScannerPageProps {
  registrations: RegistrationData[];
  onUpdateRegistration: (id: string, updates: Partial<RegistrationData>) => void;
  onBack: () => void;
}

export default function QRScannerPage({ registrations, onUpdateRegistration }: QRScannerPageProps) {
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
            onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
            className="border p-3 rounded-xl w-full mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            onClick={handleManualSearch}
            className="bg-blue-600 text-white px-4 py-3 rounded-xl w-full mb-2 hover:bg-blue-700 transition font-medium"
          >
            Search Ticket
          </button>
          <Link
            to="/admin/dashboard"
            className="block text-center bg-gray-300 px-4 py-3 rounded-xl w-full hover:bg-gray-400 transition font-medium"
          >
            Back to Dashboard
          </Link>
          {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
        </div>
      )}

      {scanResult && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
          <h3 className="text-xl font-bold mb-2">{scanResult.name}</h3>
          <p className="mb-1"><strong>Church:</strong> {scanResult.church}</p>
          <p className="mb-1"><strong>Zone:</strong> {scanResult.zone}</p>
          <p className="mb-4">
            <strong>Ticket:</strong> {scanResult.ticketType} 
            {scanResult.guestName && ` (Guest: ${scanResult.guestName})`}
          </p>

          {scanResult.checkedIn ? (
            <p className="text-green-600 font-bold mb-4 text-lg">✓ Already Checked In</p>
          ) : (
            <button
              onClick={handleCheckIn}
              className="bg-green-600 text-white px-4 py-3 rounded-xl w-full mb-2 hover:bg-green-700 transition font-medium"
            >
              Check In Now
            </button>
          )}
          <button
            onClick={() => { setScanResult(null); setManualId(''); setError(''); }}
            className="bg-gray-300 px-4 py-3 rounded-xl w-full hover:bg-gray-400 transition font-medium"
          >
            Scan Another
          </button>
        </div>
      )}
    </div>
  );
}