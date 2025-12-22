import { useState } from 'react';
import { QrCode, Search, X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Scanner, type IDetectedBarcode } from '@yudiel/react-qr-scanner';
import type { RegistrationData } from './RegistrationPage';

interface QRScannerPageProps {
  registrations: RegistrationData[];
  onUpdateRegistration: (id: string, updates: Partial<RegistrationData>) => void;
  onBack: () => void;
}

export default function QRScannerPage({ registrations, onUpdateRegistration }: QRScannerPageProps) {
  const [scanResult, setScanResult] = useState<RegistrationData | null>(null);
  const [manualSearch, setManualSearch] = useState('');
  const [searchResults, setSearchResults] = useState<RegistrationData[]>([]);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [success, setSuccess] = useState('');
  const [showBalanceWarning, setShowBalanceWarning] = useState(false);

  const handleScan = (detectedCodes: IDetectedBarcode[]) => {
    const code = detectedCodes[0];
    if (!code) return;

    const reg = registrations.find(r => r.id === code.rawValue.trim());
    if (!reg) {
      setError('Ticket ID not found');
      return;
    }
    
    setScanResult(reg);
    setError('');
    setIsScanning(false);
    
    // Show warning if there's a balance
    if (reg.balance > 0) {
      setShowBalanceWarning(true);
    }
  };

  const handleManualSearch = () => {
    const query = manualSearch.trim().toLowerCase();
    
    if (!query) {
      setError('Please enter a name, phone number, or ticket ID');
      return;
    }

    // Search by ID, name, phone, or email
    const results = registrations.filter(r => 
      r.id.toLowerCase().includes(query) ||
      r.name.toLowerCase().includes(query) ||
      r.phone.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      setError('No registrations found matching "' + manualSearch + '"');
      setSearchResults([]);
      return;
    }

    setSearchResults(results);
    setError('');
  };

  const handleSelectResult = (reg: RegistrationData) => {
    setScanResult(reg);
    setSearchResults([]);
    setManualSearch('');
    setError('');
    
    // Show warning if there's a balance
    if (reg.balance > 0) {
      setShowBalanceWarning(true);
    }
  };

  const handleCheckIn = () => {
    if (scanResult) {
      onUpdateRegistration(scanResult.id, { checkedIn: true });
      
      if (scanResult.balance > 0) {
        setSuccess(`✓ ${scanResult.name} checked in with ₦${scanResult.balance.toLocaleString()} balance remaining`);
      } else {
        setSuccess(`✓ ${scanResult.name} checked in successfully!`);
      }
      
      setTimeout(() => {
        setScanResult(null);
        setManualSearch('');
        setSuccess('');
        setShowBalanceWarning(false);
      }, 2500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 p-4 flex flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        <QrCode /> QR Scanner & Search
      </h2>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500 text-white px-6 py-4 rounded-xl mb-4 shadow-lg flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-6 h-6" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {!scanResult && !isScanning && searchResults.length === 0 && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <div className="mb-4">
            <button
              onClick={() => setIsScanning(true)}
              className="bg-purple-600 text-white px-4 py-3 rounded-xl w-full mb-4 hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
            >
              <QrCode /> Scan QR Code
            </button>
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Name, Phone, or Email
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="John Doe, +234801234567, email@example.com"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleManualSearch}
            className="bg-blue-600 text-white px-4 py-3 rounded-xl w-full mb-2 hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Search
          </button>

          <Link
            to="/admin/dashboard"
            className="block text-center bg-gray-300 px-4 py-3 rounded-xl w-full hover:bg-gray-400 transition font-medium"
          >
            Back to Dashboard
          </Link>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={() => {
                setSearchResults([]);
                setManualSearch('');
                setError('');
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {searchResults.map((reg) => (
              <div
                key={reg.id}
                onClick={() => handleSelectResult(reg)}
                className="border border-gray-200 rounded-xl p-4 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{reg.name}</h4>
                    <p className="text-sm text-gray-600">{reg.phone}</p>
                    <p className="text-sm text-gray-600">{reg.email}</p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Church:</span> {reg.church} ({reg.zone})
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Ticket:</span> {reg.ticketType}
                      {reg.guestName && ` + ${reg.guestName}`}
                      {reg.groupSize && ` (Group of ${reg.groupSize})`}
                    </p>
                  </div>
                  <div className="text-right">
                    {reg.balance > 0 ? (
                      <span className="inline-block px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        ₦{reg.balance.toLocaleString()} Due
                      </span>
                    ) : reg.checkedIn ? (
                      <span className="inline-block px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        ✓ Checked In
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        Ready
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isScanning && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
          <Scanner
            onScan={handleScan}
            onError={(error: unknown) => {
              if (error instanceof Error) {
                console.log(error.message);
              }
            }}
          />
          <button
            onClick={() => setIsScanning(false)}
            className="mt-4 bg-gray-300 px-4 py-3 rounded-xl w-full hover:bg-gray-400 transition font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {scanResult && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
          <div className="mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
              scanResult.checkedIn ? 'bg-green-100' : scanResult.balance > 0 ? 'bg-yellow-100' : 'bg-blue-100'
            }`}>
              {scanResult.checkedIn ? (
                <CheckCircle className="w-10 h-10 text-green-600" />
              ) : scanResult.balance > 0 ? (
                <AlertTriangle className="w-10 h-10 text-yellow-600" />
              ) : (
                <QrCode className="w-10 h-10 text-blue-600" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">{scanResult.name}</h3>
          </div>

          {/* Balance Warning */}
          {scanResult.balance > 0 && showBalanceWarning && !scanResult.checkedIn && (
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h4 className="font-bold text-yellow-900 mb-1">Outstanding Balance</h4>
                  <p className="text-sm text-yellow-800 mb-2">
                    This attendee has an outstanding balance of <span className="font-bold">₦{scanResult.balance.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-yellow-700">
                    You can still check them in, but please note the balance.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-left space-y-2">
            <p className="text-sm">
              <span className="font-medium text-gray-700">Church:</span> {scanResult.church}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Zone:</span> {scanResult.zone}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Phone:</span> {scanResult.phone}
            </p>
            <p className="text-sm">
              <span className="font-medium text-gray-700">Ticket:</span> {scanResult.ticketType}
              {scanResult.guestName && ` + ${scanResult.guestName}`}
              {scanResult.groupSize && ` (Group of ${scanResult.groupSize})`}
            </p>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm">
                <span className="font-medium text-gray-700">Total Due:</span> ₦{scanResult.totalDue.toLocaleString()}
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-700">Paid:</span>{' '}
                <span className="text-green-600 font-medium">₦{scanResult.totalPaid.toLocaleString()}</span>
              </p>
              {scanResult.balance > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Balance:</span>{' '}
                  <span className="text-yellow-600 font-bold">₦{scanResult.balance.toLocaleString()}</span>
                </p>
              )}
            </div>
          </div>

          {scanResult.checkedIn ? (
            <div className="mb-4">
              <p className="text-green-600 font-bold mb-2 text-lg">✓ Already Checked In</p>
              <p className="text-sm text-gray-600">This attendee has already been checked in</p>
            </div>
          ) : (
            <button
              onClick={handleCheckIn}
              className={`${
                scanResult.balance > 0 
                  ? 'bg-yellow-600 hover:bg-yellow-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white px-4 py-3 rounded-xl w-full mb-2 transition font-medium text-lg`}
            >
              {scanResult.balance > 0 ? 'Check In (With Balance)' : 'Check In Now'}
            </button>
          )}
          
          <button
            onClick={() => { 
              setScanResult(null); 
              setManualSearch(''); 
              setError(''); 
              setShowBalanceWarning(false);
            }}
            className="bg-gray-300 px-4 py-3 rounded-xl w-full hover:bg-gray-400 transition font-medium"
          >
            {scanResult.checkedIn ? 'Close' : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  );
}