# 🦷 Payment Mode Setup Guide

## 📋 **Overview**

This guide explains how to implement payment mode tracking in the dental clinic system. The payment mode feature allows tracking of different payment methods (Cash, Card, UPI, etc.) and provides analytics on payment preferences.

## 🚀 **Setup Steps**

### **Step 1: Database Schema Update**

Run the following SQL in your Supabase SQL Editor:

```sql
-- Add payment_mode column to payment_transactions table
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'Cash' 
CHECK (payment_mode IN ('Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Insurance', 'Other'));

-- Create index for payment mode analytics
CREATE INDEX IF NOT EXISTS idx_payment_transactions_mode ON payment_transactions(payment_mode);
```

### **Step 2: Analytics Functions**

Run the analytics functions from `supabase/payment-system-with-modes.sql`:

```sql
-- Get clinic payment analytics
CREATE OR REPLACE FUNCTION get_clinic_payment_analytics(clinic_uuid UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (
  payment_mode TEXT,
  total_amount DECIMAL(10,2),
  transaction_count BIGINT,
  percentage DECIMAL(5,2)
) AS $$
-- Function implementation (see the SQL file for full code)
$$ LANGUAGE plpgsql;

-- Get patient payment analytics
CREATE OR REPLACE FUNCTION get_patient_payment_analytics(patient_uuid UUID, clinic_uuid UUID)
RETURNS TABLE (
  payment_mode TEXT,
  total_amount DECIMAL(10,2),
  transaction_count BIGINT,
  percentage DECIMAL(5,2)
) AS $$
-- Function implementation (see the SQL file for full code)
$$ LANGUAGE plpgsql;

-- Get daily payment analytics
CREATE OR REPLACE FUNCTION get_daily_payment_analytics(clinic_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  payment_date DATE,
  payment_mode TEXT,
  total_amount DECIMAL(10,2),
  transaction_count BIGINT
) AS $$
-- Function implementation (see the SQL file for full code)
$$ LANGUAGE plpgsql;
```

## 🎯 **Features Added**

### **1. Payment Mode Selection**
- **Cash** - Traditional cash payments
- **Card** - Credit/Debit card payments
- **UPI** - UPI transfers
- **Bank Transfer** - Direct bank transfers
- **Cheque** - Cheque payments
- **Insurance** - Insurance-covered payments
- **Other** - Any other payment method

### **2. Enhanced Payment Form**
- Payment mode dropdown in payment dialog
- Default mode: Cash
- Required field for all transactions

### **3. Payment History Display**
- Shows payment mode for each transaction
- Color-coded payment mode badges
- Payment mode summary in payment summary tab

### **4. Analytics Support**
- **Clinic Analytics**: Overall payment mode breakdown
- **Patient Analytics**: Individual patient payment preferences
- **Daily Analytics**: Payment mode trends over time
- **Percentage calculations**: Shows what % each mode represents

## 📊 **Analytics Capabilities**

### **Clinic-Level Analytics**
```typescript
// Get clinic payment analytics
const analytics = await simplePaymentApi.getClinicPaymentAnalytics(
  clinicId, 
  startDate, 
  endDate
)
```

### **Patient-Level Analytics**
```typescript
// Get patient payment analytics
const patientAnalytics = await simplePaymentApi.getPatientPaymentAnalytics(
  patientId, 
  clinicId
)
```

### **Daily Analytics**
```typescript
// Get daily payment analytics (last 30 days)
const dailyAnalytics = await simplePaymentApi.getDailyPaymentAnalytics(
  clinicId, 
  30
)
```

## 🎨 **UI Components**

### **PaymentAnalytics Component**
- Summary cards showing total amount, transactions, and payment modes
- Payment mode breakdown with icons and percentages
- Color-coded payment mode indicators
- Loading and error states

### **Enhanced Payment Management**
- Payment mode selection in payment form
- Payment mode display in transaction history
- Payment mode summary in payment summary tab

## 📈 **Future Analytics Features**

The system is now prepared for advanced analytics:

1. **Payment Mode Trends**: Track changes in payment preferences over time
2. **Revenue by Payment Mode**: Analyze which modes generate more revenue
3. **Patient Payment Patterns**: Understand individual patient preferences
4. **Seasonal Analysis**: Payment mode variations by month/season
5. **Treatment-Payment Correlation**: Which treatments prefer which payment modes

## 🔧 **Usage Examples**

### **Adding a Payment with Mode**
```typescript
await simplePaymentApi.addPaymentTransaction({
  treatment_payment_id: paymentId,
  amount: 1000,
  payment_date: '2024-01-15',
  payment_mode: 'UPI',
  notes: 'UPI payment via PhonePe'
})
```

### **Displaying Payment Analytics**
```typescript
import PaymentAnalytics from '@/components/PaymentAnalytics'

// In your component
<PaymentAnalytics 
  clinicId={clinicId}
  patientId={patientId} // Optional for patient-specific analytics
  startDate="2024-01-01" // Optional date range
  endDate="2024-01-31"
/>
```

## ✅ **Verification**

After setup, verify the following:

1. **Database**: Check that `payment_transactions` table has `payment_mode` column
2. **Payment Form**: Payment mode dropdown appears in payment dialog
3. **Payment History**: Payment modes are displayed in transaction history
4. **Analytics**: PaymentAnalytics component loads without errors

## 🚨 **Important Notes**

- **Backward Compatibility**: Existing payments will default to 'Cash' mode
- **Data Migration**: No data migration needed - new column has default value
- **Multi-Teeth Sync**: Payment modes are synced across related treatments
- **Analytics**: Functions are optimized for performance with proper indexing

## 📞 **Support**

If you encounter any issues:
1. Check the browser console for errors
2. Verify database functions are created correctly
3. Ensure all TypeScript types are properly imported
4. Test with a new payment to verify mode selection works
