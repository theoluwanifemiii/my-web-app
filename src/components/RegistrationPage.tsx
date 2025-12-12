import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
          {paymentMethod === 'transfer' ? (
            <p className="text-gray-600">Your ticket will be active once we verify the transfer.</p>
          ) : (
            <p className="text-gray-600">Your payment has been confirmed. See you at the event!</p>
          )}
        </div>
      </div>
    );
  }

  // Payment step
  if (paymentStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Payment Step</h2>
          <p className="mb-2">Ticket Price: ₦{ticketPrice}</p>
          <div className="mb-4">
            <label className="mr-4">
              <input type="radio" name="payment" value="cash" onChange={() => setPaymentMethod('cash')} checked={paymentMethod === 'cash'} /> Cash
            </label>
            <label>
              <input type="radio" name="payment" value="transfer" onChange={() => setPaymentMethod('transfer')} checked={paymentMethod === 'transfer'} /> Transfer
            </label>
          </div>

          {paymentMethod === 'cash' && (
            <input
              type="password"
              placeholder="Staff PIN"
              value={staffPin}
              onChange={(e) => setStaffPin(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />
          )}

          {paymentMethod === 'transfer' && (
            <>
              <input
                type="text"
                placeholder="Transaction Reference"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="border p-2 rounded w-full mb-4"
              />
              <input type="file" onChange={handleImageUpload} className="mb-4" />
              {receiptImage && <img src={receiptImage} alt="Receipt Preview" className="mb-4 w-full max-h-40 object-contain" />}
            </>
          )}

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <button onClick={handlePayment} className="bg-blue-600 text-white px-4 py-2 rounded mr-2">
            Submit Payment
          </button>
          <button onClick={() => setPaymentStep(false)} className="bg-gray-300 px-4 py-2 rounded">
            Back
          </button>
        </div>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Register for Event</h2>

        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="border p-2 rounded w-full mb-4"
        />
        <input
          type="text"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="border p-2 rounded w-full mb-4"
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="border p-2 rounded w-full mb-4"
        />
        <input
          type="text"
          placeholder="Church"
          value={formData.church}
          onChange={(e) => setFormData({ ...formData, church: e.target.value })}
          className="border p-2 rounded w-full mb-4"
        />

        <select
          value={formData.zone}
          onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="Akoka">Akoka</option>
          <option value="Yaba">Yaba</option>
          <option value="Ikeja">Ikeja</option>
        </select>

        <select
          value={formData.ticketType}
          onChange={(e) => setFormData({ ...formData, ticketType: e.target.value as 'solo' | 'guest' })}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="solo">Solo</option>
          <option value="guest">Guest</option>
        </select>

        {formData.ticketType === 'guest' && (
          <input
            type="text"
            placeholder="Guest Name"
            value={formData.guestName}
            onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
            className="border p-2 rounded w-full mb-4"
          />
        )}

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
          Continue to Payment
        </button>
      </div>
    </div>
  );
}
