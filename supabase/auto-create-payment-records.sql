-- Auto-create payment records when treatments are created
-- This will prevent 406 errors by ensuring payment records exist

-- 1. Create function to auto-create payment record
CREATE OR REPLACE FUNCTION auto_create_treatment_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if payment record already exists
  IF NOT EXISTS (
    SELECT 1 FROM treatment_payments 
    WHERE treatment_id = NEW.id
  ) THEN
    -- Create payment record
    INSERT INTO treatment_payments (
      treatment_id,
      clinic_id,
      patient_id,
      total_amount,
      paid_amount,
      payment_status
    ) VALUES (
      NEW.id,
      NEW.clinic_id,
      NEW.patient_id,
      0, -- Use 0 as default, let user set the actual cost
      0, -- Default paid amount
      'Pending' -- Use the correct default value
    );
    
    RAISE NOTICE 'Auto-created payment record for treatment %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger on dental_treatments table
DROP TRIGGER IF EXISTS auto_create_payment_trigger ON dental_treatments;
CREATE TRIGGER auto_create_payment_trigger
  AFTER INSERT ON dental_treatments
  FOR EACH ROW EXECUTE FUNCTION auto_create_treatment_payment();

-- 3. Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'treatment_payments_treatment_id_key'
  ) THEN
    ALTER TABLE treatment_payments 
    ADD CONSTRAINT treatment_payments_treatment_id_key 
    UNIQUE (treatment_id);
  END IF;
END $$;

-- 4. Create payment records for existing treatments that don't have them
INSERT INTO treatment_payments (
  treatment_id,
  clinic_id,
  patient_id,
  total_amount,
  paid_amount,
  payment_status
)
SELECT 
  dt.id,
  dt.clinic_id,
  dt.patient_id,
  0,
  0,
  'Pending'
FROM dental_treatments dt
LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id
WHERE tp.id IS NULL
ON CONFLICT (treatment_id) DO NOTHING;

-- 5. Test the trigger
SELECT 
  'Auto-create trigger test' as test_name,
  COUNT(*) as treatments_with_payments
FROM dental_treatments dt
INNER JOIN treatment_payments tp ON dt.id = tp.treatment_id;

-- 6. Show summary
SELECT 
  'Summary' as info,
  (SELECT COUNT(*) FROM dental_treatments) as total_treatments,
  (SELECT COUNT(*) FROM treatment_payments) as total_payments,
  (SELECT COUNT(*) FROM dental_treatments dt LEFT JOIN treatment_payments tp ON dt.id = tp.treatment_id WHERE tp.id IS NULL) as treatments_without_payments;
