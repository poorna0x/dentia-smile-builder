-- =====================================================
-- 🦷 PAYMENT SYSTEM - STEP 1: Create ENUM
-- =====================================================

-- Create ENUM for payment status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('Pending', 'Partial', 'Completed', 'Overdue');
    END IF;
END $$;
