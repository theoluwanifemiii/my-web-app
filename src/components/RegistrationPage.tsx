import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { sendTicketEmail } from '../services/emailService';

export interface RegistrationData {
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

interface RegistrationPageProps {
  onRegister: (registration: RegistrationData) => void;
}

export default function RegistrationPage({ onRegister }: RegistrationPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    church: '',
    zone: 'Akoka',
    ticketType: 'solo' as 'solo' | 'guest',
    guestName: '',
  });
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | null>(null);
  const [staffPin, setStaffPin] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const ticketPrice = formData.ticketType === 'solo' ? 2000 : 3000;

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.email || !formData.church) {
      setError('Please fill all required fields');
      return;
    }
    if (formData.ticketType === 'guest' && !formData.guestName) {
      setError('Please enter guest name');
      return;
    }
    setError('');
    setPaymentStep(true);
  };

  const handlePayment = () => {
    if (!paymentMethod) {
      setError('Select a payment method');
      return;
    }

    if (paymentMethod === 'cash') {
      if (staffPin !== '1234') {
        setError('Invalid Staff PIN');
        return;
      }
    } else if (paymentMethod === 'transfer') {
      if (!transactionRef.trim()) {
        setError('Please enter transaction reference');
        return;
      }
      if (!receiptImage) {
        setError('Please upload payment receipt');
        return;
      }
    }

    const registration: RegistrationData = {
  id: Date.now().toString(),
  name: formData.name,
  phone: formData.phone,
  email: formData.email,
  church: formData.church,
  zone: formData.zone,
  ticketType: formData.ticketType,
  guestName: formData.ticketType === 'guest' ? formData.guestName : undefined,
  totalDue: ticketPrice,
  totalPaid: paymentMethod === 'cash' ? ticketPrice : 0,
  balance: paymentMethod === 'cash' ? 0 : ticketPrice,
  paymentMethod,
  status: paymentMethod === 'cash' ? 'paid' : 'pending',
  transactionRef: paymentMethod === 'transfer' ? transactionRef : undefined,
  receiptImage: paymentMethod === 'transfer' ? receiptImage : undefined,
  createdAt: new Date().toISOString(),
};

onRegister(registration);

// Send confirmation email
try {
  await sendTicketEmail({
    to: registration.email,
    name: registration.name,
    ticketId: registration.id,
    church: registration.church,
    zone: registration.zone,
    ticketType: registration.ticketType,
    guestName: registration.guestName
  });
  console.log('✅ Email sent successfully');
} catch (error) {
  console.error('❌ Email failed:', error);
}

setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setPaymentStep(false);
      setPaymentMethod(null);
      setStaffPin('');
      setTransactionRef('');
      setReceiptImage(null);
      setFormData({ name: '', phone: '', email: '', church: '', zone: 'Akoka', ticketType: 'solo', guestName: '' });
    }, 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Success screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-blue-500/10"></div>
        
        <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100 animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Success! 🎉</h2>
          
          {paymentMethod === 'transfer' ? (
            <>
              <p className="text-gray-600 mb-2">Your registration has been received!</p>
              <p className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                ⏳ Your ticket will be activated once we verify your payment
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-2">Your payment has been confirmed!</p>
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                ✓ You're all set! See you at the event
              </p>
            </>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">Check your email for confirmation</p>
          </div>
        </div>
      </div>
    );
  }

  // Payment step
  if (paymentStep) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"></div>
        
        <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment</h2>
            <p className="text-3xl font-bold text-purple-600">₦{ticketPrice.toLocaleString()}</p>
          </div>

          <div className="space-y-3 mb-6">
            <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-purple-500 hover:bg-purple-50/50">
              <input 
                type="radio" 
                name="payment" 
                value="cash" 
                onChange={() => setPaymentMethod('cash')} 
                checked={paymentMethod === 'cash'}
                className="w-5 h-5 text-purple-600"
              />
              <span className="ml-3 font-medium text-gray-700">💵 Cash Payment</span>
            </label>
            
            <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-purple-500 hover:bg-purple-50/50">
              <input 
                type="radio" 
                name="payment" 
                value="transfer" 
                onChange={() => setPaymentMethod('transfer')} 
                checked={paymentMethod === 'transfer'}
                className="w-5 h-5 text-purple-600"
              />
              <span className="ml-3 font-medium text-gray-700">🏦 Bank Transfer</span>
            </label>
          </div>

          {paymentMethod === 'cash' && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Staff PIN</label>
              <input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
              />
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Reference</label>
                <input
                  type="text"
                  placeholder="Enter transaction reference"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Receipt</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-purple-500 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    {receiptImage ? (
                      <img src={receiptImage} alt="Receipt Preview" className="max-h-40 mx-auto rounded-lg" />
                    ) : (
                      <div className="text-gray-500">
                        <div className="text-4xl mb-2">📎</div>
                        <p className="text-sm">Click to upload receipt</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={() => { setPaymentStep(false); setError(''); }} 
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              ← Back
            </button>
            <button 
              onClick={handlePayment} 
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/30"
            >
              Submit Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
      
      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Event Registration</h2>
          <p className="text-gray-600 text-sm">Fill in your details to register</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+234 800 000 0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Church Name</label>
            <input
              type="text"
              placeholder="Your Church"
              value={formData.church}
              onChange={(e) => setFormData({ ...formData, church: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Zone</label>
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            >
              <option value="Akoka">Akoka</option>
              <option value="Yaba">Yaba</option>
              <option value="Ikeja">Ikeja</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ticket Type</label>
            <select
              value={formData.ticketType}
              onChange={(e) => setFormData({ ...formData, ticketType: e.target.value as 'solo' | 'guest' })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            >
              <option value="solo">Solo Ticket - ₦2,000</option>
              <option value="guest">With Guest - ₦3,000</option>
            </select>
          </div>

          {formData.ticketType === 'guest' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Guest Name</label>
              <input
                type="text"
                placeholder="Guest Full Name"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button 
          onClick={handleSubmit} 
          className="mt-6 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transform hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/30"
        >
          Continue to Payment →
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Your information is secure and encrypted
        </p>
      </div>
    </div>
  );
}