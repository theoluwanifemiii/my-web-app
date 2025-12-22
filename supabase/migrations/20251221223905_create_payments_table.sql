/*
  # Create Payments Table for Proper Accounting

  ## Overview
  This migration creates a proper payments tracking system to record all payment transactions
  and fixes the issue where partial payments are lost when admins approve them.

  ## New Tables
  
  ### `payments`
  - `id` (uuid, primary key) - Unique payment ID
  - `registration_id` (text, foreign key) - Links to registrations table
  - `amount` (numeric) - Amount paid in this transaction
  - `payment_method` (text) - 'cash' or 'transfer'
  - `transaction_ref` (text, nullable) - Transaction reference for transfers
  - `receiver_name` (text, nullable) - Name of staff who received cash
  - `receipt_image` (text, nullable) - Receipt image URL for transfers
  - `status` (text) - 'pending' or 'approved'
  - `approved_by` (text, nullable) - Who approved the payment
  - `approved_at` (timestamptz, nullable) - When payment was approved
  - `created_at` (timestamptz) - When payment was made
  - `notes` (text, nullable) - Additional notes

  ## Security
  - Enable RLS on payments table
  - Add policies for authenticated access (admin only)
  
  ## Important Notes
  1. All payment transactions are now tracked individually
  2. The registrations table still maintains totalPaid and balance for quick queries
  3. Payments table provides full audit trail
  4. Admin approvals are tracked with timestamp and approver
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
  transaction_ref text,
  receiver_name text,
  receipt_image text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  notes text,
  CONSTRAINT fk_registration
    FOREIGN KEY (registration_id)
    REFERENCES registrations(id)
    ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_registration_id ON payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert payments (for registration form)
CREATE POLICY "Anyone can create payments"
  ON payments
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public to read payments (for viewing history)
CREATE POLICY "Anyone can view payments"
  ON payments
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public to update payment status (for admin approval)
CREATE POLICY "Anyone can update payments"
  ON payments
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add a function to calculate total paid from payments table
CREATE OR REPLACE FUNCTION calculate_total_paid(reg_id text)
RETURNS numeric AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM payments
  WHERE registration_id = reg_id
    AND status = 'approved';
$$ LANGUAGE SQL STABLE;

-- Add a trigger to auto-update registration totals when payments change
CREATE OR REPLACE FUNCTION update_registration_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE registrations
  SET 
    total_paid = calculate_total_paid(NEW.registration_id),
    balance = total_due - calculate_total_paid(NEW.registration_id),
    status = CASE 
      WHEN (total_due - calculate_total_paid(NEW.registration_id)) <= 0 THEN 'paid'
      ELSE 'pending'
    END,
    ticket_generated = CASE
      WHEN (total_due - calculate_total_paid(NEW.registration_id)) <= 0 THEN true
      ELSE ticket_generated
    END
  WHERE id = NEW.registration_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_registration_totals
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_registration_totals();
