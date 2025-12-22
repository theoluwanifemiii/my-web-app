import { supabase } from '../lib/supabase';

export interface Payment {
  id: string;
  registration_id: string;
  amount: number;
  payment_method: 'cash' | 'transfer';
  transaction_ref?: string;
  receiver_name?: string;
  receipt_image?: string;
  status: 'pending' | 'approved';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  notes?: string;
}

export async function getPaymentHistory(registrationId: string): Promise<Payment[]> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('registration_id', registrationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading payment history:', error);
    return [];
  }
}

export async function approvePayment(
  paymentId: string,
  registrationId: string,
  approverName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: registration } = await supabase
      .from('registrations')
      .select('balance')
      .eq('id', registrationId)
      .single();

    if (!registration) {
      return { success: false, error: 'Registration not found' };
    }

    if (registration.balance <= 0) {
      return { success: false, error: 'Payment already complete' };
    }

    const { error } = await supabase
      .from('payments')
      .update({
        status: 'approved',
        approved_by: approverName,
        approved_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error approving payment:', error);
    return { success: false, error: error.message };
  }
}

export async function addPayment(payment: {
  registrationId: string;
  amount: number;
  paymentMethod: 'cash' | 'transfer';
  transactionRef?: string;
  receiverName?: string;
  receiptImage?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: registration } = await supabase
      .from('registrations')
      .select('balance')
      .eq('id', payment.registrationId)
      .single();

    if (!registration) {
      return { success: false, error: 'Registration not found' };
    }

    if (registration.balance <= 0) {
      return { success: false, error: 'Payment already complete' };
    }

    if (payment.amount > registration.balance) {
      return {
        success: false,
        error: `Amount exceeds balance of ₦${registration.balance.toLocaleString()}`
      };
    }

    const paymentStatus = payment.paymentMethod === 'cash' ? 'approved' : 'pending';

    const { error } = await supabase
      .from('payments')
      .insert({
        registration_id: payment.registrationId,
        amount: payment.amount,
        payment_method: payment.paymentMethod,
        transaction_ref: payment.transactionRef,
        receiver_name: payment.receiverName,
        receipt_image: payment.receiptImage,
        status: paymentStatus,
        approved_by: payment.paymentMethod === 'cash' ? payment.receiverName : null,
        approved_at: payment.paymentMethod === 'cash' ? new Date().toISOString() : null,
        notes: payment.notes,
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error adding payment:', error);
    return { success: false, error: error.message };
  }
}
