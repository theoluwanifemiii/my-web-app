import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { sendTicketEmail } from '../services/emailService';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export interface RegistrationData {
  id: string;
  name: string;
  phone: string;
  email: string;
  church: string;
  zone: string;
  ticketType: 'solo' | 'guest' | 'group';
  guestName?: string;
  groupSize?: number;
  additionalAttendees?: Array<{name: string; mealChoice: string}>;
  mealChoice?: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
  paymentMethod: 'cash' | 'transfer' | null;
  status: 'paid' | 'pending';
  transactionRef?: string;
  receiverName?: string;
  receiptImage?: string | null;
  createdAt: string;
  checkedIn?: boolean;
  ticketQR?: string;
  ticketGenerated?: boolean;
}

interface RegistrationPageProps {
  onRegister: (registration: RegistrationData) => void;
}

const MEAL_OPTIONS = [
  { value: 'semo-egusi', label: 'Semo and Egusi Elefo (Yoruba)' },
  { value: 'amala-gbegiri', label: 'Amala, Gbegiri and Ewedu (Yoruba)' },
  { value: 'fufu-edikaikong', label: 'Fufu and Edikaikong (Igbo)' },
  { value: 'eba-edikaikong', label: 'Yellow Eba and Edikaikong (Igbo)' },
];

export default function RegistrationPage({ onRegister }: RegistrationPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    church: '',
    zone: 'Akoka',
    ticketType: 'solo' as 'solo' | 'guest' | 'group',
    guestName: '',
    mealChoice: '',
    groupSize: 2,
    additionalAttendees: [] as Array<{name: string; mealChoice: string}>,
  });
  const [paymentStep, setPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | null>(null);
  const [staffPin, setStaffPin] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const ticketPrice = formData.ticketType === 'solo' 
    ? 2000 
    : formData.ticketType === 'guest' 
    ? 3000 
    : 2000 * formData.groupSize;

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    try {
      // Try to parse and validate the phone number
      // If no country code is provided, assume Nigeria (NG)
      if (phone.trim().startsWith('+')) {
        // Has country code, validate internationally
        return isValidPhoneNumber(phone);
      } else if (phone.trim().startsWith('0')) {
        // Nigerian local format (starts with 0)
        return isValidPhoneNumber(phone, 'NG');
      } else {
        // Try both international and Nigerian format
        return isValidPhoneNumber(phone) || isValidPhoneNumber(phone, 'NG');
      }
    } catch (error) {
      return false;
    }
  };

  const formatPhoneForDisplay = (phone: string): string => {
    try {
      if (phone.startsWith('+')) {
        const phoneNumber = parsePhoneNumber(phone);
        return phoneNumber.formatInternational();
      } else if (phone.startsWith('0')) {
        const phoneNumber = parsePhoneNumber(phone, 'NG');
        return phoneNumber.formatInternational();
      }
      return phone;
    } catch (error) {
      return phone;
    }
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (formData.name.trim().length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid phone number with country code (e.g., +2348012345678, +1234567890, +447911123456)');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address (e.g., name@example.com)');
      return;
    }

    if (!formData.church.trim()) {
      setError('Please enter your church name');
      return;
    }

    if (!formData.mealChoice) {
      setError('Please select your meal choice');
      return;
    }

    if (formData.ticketType === 'guest' && !formData.guestName.trim()) {
      setError('Please enter guest name');
      return;
    }

    if (formData.ticketType === 'group') {
      if (formData.groupSize < 2 || formData.groupSize > 20) {
        setError('Group size must be between 2 and 20 people');
        return;
      }
      // Check if all additional attendees have names and meal choices
      if (formData.additionalAttendees.length !== formData.groupSize - 1) {
        setError('Please add all attendees');
        return;
      }
      for (let i = 0; i < formData.additionalAttendees.length; i++) {
        const attendee = formData.additionalAttendees[i];
        if (!attendee.name.trim()) {
          setError(`Please enter name for attendee ${i + 2}`);
          return;
        }
        if (!attendee.mealChoice) {
          setError(`Please select meal choice for ${attendee.name || `attendee ${i + 2}`}`);
          return;
        }
      }
    }

    setError('');
    setPaymentStep(true);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError('Select a payment method');
      return;
    }

    if (paymentMethod === 'cash') {
      if (staffPin !== '1234') {
        setError('Invalid Staff PIN');
        return;
      }
      if (!receiverName.trim()) {
        setError('Please enter the name of the person who received payment');
        return;
      }
      if (!amountPaid) {
        setError('Please enter amount paid');
        return;
      }
      const amount = parseFloat(amountPaid);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      if (amount > ticketPrice) {
        setError(`Amount cannot exceed ticket price of ₦${ticketPrice.toLocaleString()}`);
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
      if (!amountPaid) {
        setError('Please enter amount paid');
        return;
      }
      const amount = parseFloat(amountPaid);
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid amount');
        return;
      }
    }

    const paidAmount = parseFloat(amountPaid);
    const balance = ticketPrice - paidAmount;

    const registration: RegistrationData = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim().toLowerCase(),
      church: formData.church.trim(),
      zone: formData.zone,
      ticketType: formData.ticketType,
      guestName: formData.ticketType === 'guest' ? formData.guestName.trim() : undefined,
      groupSize: formData.ticketType === 'group' ? formData.groupSize : undefined,
      additionalAttendees: formData.ticketType === 'group' ? formData.additionalAttendees : undefined,
      mealChoice: formData.mealChoice,
      totalDue: ticketPrice,
      totalPaid: paidAmount,
      balance: balance,
      paymentMethod,
      status: balance <= 0 ? 'paid' : 'pending',
      transactionRef: paymentMethod === 'transfer' ? transactionRef.trim() : undefined,
      receiverName: paymentMethod === 'cash' ? receiverName.trim() : undefined,
      receiptImage: paymentMethod === 'transfer' ? receiptImage : undefined,
      createdAt: new Date().toISOString(),
    };

    onRegister(registration);

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
      setReceiverName('');
      setAmountPaid('');
      setTransactionRef('');
      setReceiptImage(null);
      setFormData({ name: '', phone: '', email: '', church: '', zone: 'Akoka', ticketType: 'solo', guestName: '', mealChoice: '', groupSize: 2, additionalAttendees: [] });
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
              <p className="text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
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
            <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Total due: ₦{ticketPrice.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Received By <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Name of person who received payment"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Staff PIN <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  placeholder="Enter 4-digit PIN"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Bank Account Details</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div><span className="font-medium">Bank:</span> Opay</div>
                  <div><span className="font-medium">Account Name:</span> Matthew Victor</div>
                  <div className="flex items-center justify-between">
                    <div><span className="font-medium">Account Number:</span> <span className="text-lg font-bold">9037126739</span></div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  placeholder="Enter amount transferred"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">Total due: ₦{ticketPrice.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Reference <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter transaction reference or sender name"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Receipt <span className="text-red-500">*</span></label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    {receiptImage ? (
                      <div>
                        <img src={receiptImage} alt="Receipt Preview" className="max-h-40 mx-auto rounded-lg mb-2" />
                        <span className="text-sm text-green-600 font-medium">✓ Receipt uploaded - Click to change</span>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <div className="text-4xl mb-2">📎</div>
                        <p className="text-sm">Click to upload payment receipt</p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
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
              onClick={() => { setPaymentStep(false); setPaymentMethod(null); setAmountPaid(''); setReceiverName(''); setError(''); }} 
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

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent"></div>
      
      <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Event Registration</h2>
          <p className="text-gray-600 text-sm">Fill in your details to register</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              placeholder="+2348012345678, +1234567890, +447911123456"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, phone: value });
                
                // Real-time validation
                if (value.trim()) {
                  if (!validatePhone(value)) {
                    setPhoneError('Invalid phone number format');
                  } else {
                    setPhoneError('✓ Valid phone number');
                  }
                } else {
                  setPhoneError('');
                }
              }}
              maxLength={20}
              className={`w-full px-4 py-3 rounded-xl border ${phoneError && phoneError.includes('Invalid') ? 'border-red-500' : phoneError ? 'border-green-500' : 'border-gray-300'} focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white`}
            />
            <p className={`text-xs mt-1 ${phoneError && phoneError.includes('Invalid') ? 'text-red-500' : phoneError ? 'text-green-600' : 'text-gray-500'}`}>
              {phoneError || 'Include country code: +234 (Nigeria), +1 (USA), +44 (UK), etc.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Church Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Your Church"
              value={formData.church}
              onChange={(e) => setFormData({ ...formData, church: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Zone <span className="text-red-500">*</span></label>
            <select
              value={formData.zone}
              onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            >
              <option value="Akoka">Akoka</option>
              <option value="Ilaje">Ilaje</option>
              <option value="Jebako">Jebako</option>
              <option value="Shomolu">Shomolu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Meal Choice <span className="text-red-500">*</span></label>
            <select
              value={formData.mealChoice}
              onChange={(e) => setFormData({ ...formData, mealChoice: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
            >
              <option value="">Select your meal</option>
              {MEAL_OPTIONS.map(meal => (
                <option key={meal.value} value={meal.value}>{meal.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Ticket Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, ticketType: 'solo' })}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  formData.ticketType === 'solo'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👤</span>
                    <div className="text-left">
                      <div className="font-semibold">Solo Ticket</div>
                      <div className="text-sm text-gray-600">Just for you</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-purple-600">₦2,000</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, ticketType: 'guest' })}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  formData.ticketType === 'guest'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👥</span>
                    <div className="text-left">
                      <div className="font-semibold">Me + 1 Guest</div>
                      <div className="text-sm text-gray-600">Bring a friend</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-purple-600">₦3,000</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, ticketType: 'group' })}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  formData.ticketType === 'group'
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">👨‍👩‍👧‍👦</span>
                    <div className="text-left">
                      <div className="font-semibold">Group Registration</div>
                      <div className="text-sm text-gray-600">Register multiple people</div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-purple-600">₦2,000/person</div>
                </div>
              </button>
            </div>
          </div>

          {formData.ticketType === 'guest' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Guest Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Guest Full Name"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
              />
            </div>
          )}

          {formData.ticketType === 'group' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Number of People (including you) <span className="text-red-500">*</span></label>
                <select
                  value={formData.groupSize}
                  onChange={(e) => {
                    const size = parseInt(e.target.value);
                    const newAttendees = Array(size - 1).fill(null).map((_, i) => 
                      formData.additionalAttendees[i] || { name: '', mealChoice: '' }
                    );
                    setFormData({ ...formData, groupSize: size, additionalAttendees: newAttendees });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none bg-white"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(num => (
                    <option key={num} value={num}>{num} people - ₦{(num * 2000).toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Additional Attendees</h3>
                <p className="text-sm text-blue-700 mb-4">You are attendee #1. Please add details for the other {formData.groupSize - 1} {formData.groupSize === 2 ? 'person' : 'people'}.</p>
                
                <div className="space-y-3">
                  {formData.additionalAttendees.map((attendee, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="font-medium text-blue-900 mb-2">Attendee #{index + 2}</div>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={attendee.name}
                          onChange={(e) => {
                            const newAttendees = [...formData.additionalAttendees];
                            newAttendees[index].name = e.target.value;
                            setFormData({ ...formData, additionalAttendees: newAttendees });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm"
                        />
                        <select
                          value={attendee.mealChoice}
                          onChange={(e) => {
                            const newAttendees = [...formData.additionalAttendees];
                            newAttendees[index].mealChoice = e.target.value;
                            setFormData({ ...formData, additionalAttendees: newAttendees });
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-white text-sm"
                        >
                          <option value="">Select meal choice</option>
                          {MEAL_OPTIONS.map(meal => (
                            <option key={meal.value} value={meal.value}>{meal.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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