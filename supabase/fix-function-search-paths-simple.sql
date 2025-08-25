-- 🔧 Fix Function Search Paths (Simple & Direct)
-- =====================================================
-- 
-- This script directly fixes the search_path for all functions mentioned in warnings
-- Uses a more direct approach without complex trigger handling
-- =====================================================

-- 1. Fix add_treatment_payment function
CREATE OR REPLACE FUNCTION add_treatment_payment(
  p_patient_id UUID,
  p_treatment_id UUID,
  p_amount DECIMAL(10,2),
  p_payment_method TEXT DEFAULT 'cash',
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  INSERT INTO treatment_payments (
    patient_id,
    treatment_id,
    amount,
    payment_method,
    notes,
    created_at,
    updated_at
  ) VALUES (
    p_patient_id,
    p_treatment_id,
    p_amount,
    p_payment_method,
    p_notes,
    NOW(),
    NOW()
  ) RETURNING id INTO v_payment_id;
  
  RETURN v_payment_id;
END;
$$;

-- 2. Fix create_lab_work_order function
CREATE OR REPLACE FUNCTION create_lab_work_order(
  p_patient_id UUID,
  p_treatment_id UUID,
  p_lab_type TEXT,
  p_instructions TEXT DEFAULT NULL,
  p_expected_completion_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
BEGIN
  -- Generate order number
  SELECT generate_lab_order_number() INTO v_order_number;
  
  INSERT INTO lab_work_orders (
    patient_id,
    treatment_id,
    lab_type,
    instructions,
    expected_completion_date,
    order_number,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_patient_id,
    p_treatment_id,
    p_lab_type,
    p_instructions,
    p_expected_completion_date,
    v_order_number,
    'pending',
    NOW(),
    NOW()
  ) RETURNING id INTO v_order_id;
  
  RETURN v_order_id;
END;
$$;

-- 3. Fix add_lab_work_result function (FIXED PARAMETER NAME)
CREATE OR REPLACE FUNCTION add_lab_work_result(
  p_order_id UUID,
  p_result_data JSONB,
  p_notes TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'completed'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result_id UUID;
BEGIN
  INSERT INTO lab_work_results (
    order_id,
    results,
    notes,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_order_id,
    p_result_data,
    p_notes,
    p_status,
    NOW(),
    NOW()
  ) RETURNING id INTO v_result_id;
  
  -- Update the order status
  UPDATE lab_work_orders 
  SET status = p_status, updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN v_result_id;
END;
$$;

-- 4. Fix generate_lab_order_number function
CREATE OR REPLACE FUNCTION generate_lab_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
  v_count INTEGER;
BEGIN
  -- Get current count for today
  SELECT COUNT(*) INTO v_count
  FROM lab_work_orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate order number: LAB-YYYYMMDD-XXXX
  v_order_number := 'LAB-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_order_number;
END;
$$;

-- 5. Fix is_same_person function
CREATE OR REPLACE FUNCTION is_same_person(name1 TEXT, name2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Simple name comparison (can be enhanced)
  RETURN LOWER(TRIM(name1)) = LOWER(TRIM(name2));
END;
$$;

-- 6. Fix find_or_create_patient_improved function
CREATE OR REPLACE FUNCTION find_or_create_patient_improved(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_clinic_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Try to find existing patient by phone
  SELECT p.id INTO v_patient_id
  FROM patients p
  JOIN patient_phones pp ON p.id = pp.patient_id
  WHERE pp.phone = p_phone AND p.is_active = TRUE
  LIMIT 1;
  
  -- If not found, create new patient
  IF v_patient_id IS NULL THEN
    INSERT INTO patients (
      name,
      email,
      date_of_birth,
      gender,
      clinic_id,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      p_name,
      p_email,
      p_date_of_birth,
      p_gender,
      p_clinic_id,
      TRUE,
      NOW(),
      NOW()
    ) RETURNING id INTO v_patient_id;
    
    -- Add phone number
    INSERT INTO patient_phones (patient_id, phone, is_primary)
    VALUES (v_patient_id, p_phone, TRUE);
  END IF;
  
  RETURN v_patient_id;
END;
$$;

-- 7. Fix create_prescription_with_history function
CREATE OR REPLACE FUNCTION create_prescription_with_history(
  p_patient_id UUID,
  p_medication_name TEXT,
  p_dosage TEXT,
  p_frequency TEXT,
  p_duration TEXT,
  p_instructions TEXT DEFAULT NULL,
  p_prescribed_by TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prescription_id UUID;
BEGIN
  -- Create prescription
  INSERT INTO prescriptions (
    patient_id,
    medication_name,
    dosage,
    frequency,
    duration,
    instructions,
    prescribed_by,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_patient_id,
    p_medication_name,
    p_dosage,
    p_frequency,
    p_duration,
    p_instructions,
    p_prescribed_by,
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO v_prescription_id;
  
  -- Add to history
  INSERT INTO prescription_history (
    prescription_id,
    action,
    action_date,
    notes
  ) VALUES (
    v_prescription_id,
    'created',
    NOW(),
    'Prescription created'
  );
  
  RETURN v_prescription_id;
END;
$$;

-- 8. Fix refill_prescription function
CREATE OR REPLACE FUNCTION refill_prescription(p_prescription_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add refill to history
  INSERT INTO prescription_history (
    prescription_id,
    action,
    action_date,
    notes
  ) VALUES (
    p_prescription_id,
    'refilled',
    NOW(),
    'Prescription refilled'
  );
  
  RETURN TRUE;
END;
$$;

-- 9. Fix update_lab_work_status function
CREATE OR REPLACE FUNCTION update_lab_work_status(
  p_order_id UUID,
  p_status TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lab_work_orders 
  SET status = p_status, updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Add status change to results if notes provided
  IF p_notes IS NOT NULL THEN
    INSERT INTO lab_work_results (
      order_id,
      results,
      notes,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_order_id,
      '{"status_update": "' || p_status || '"}',
      p_notes,
      p_status,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 10. Fix get_lab_work_orders function
CREATE OR REPLACE FUNCTION get_lab_work_orders(p_patient_id UUID)
RETURNS TABLE (
  order_id UUID,
  lab_type TEXT,
  status TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  expected_completion_date DATE,
  order_number TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lwo.id as order_id,
    lwo.lab_type,
    lwo.status,
    lwo.created_at as order_date,
    lwo.expected_completion_date,
    lwo.order_number
  FROM lab_work_orders lwo
  WHERE lwo.patient_id = p_patient_id
  ORDER BY lwo.created_at DESC;
END;
$$;

-- 11. Fix get_active_prescriptions function
CREATE OR REPLACE FUNCTION get_active_prescriptions(p_patient_id UUID)
RETURNS TABLE (
  prescription_id UUID,
  medication_name TEXT,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  prescribed_date TIMESTAMP WITH TIME ZONE,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as prescription_id,
    p.medication_name,
    p.dosage,
    p.frequency,
    p.duration,
    p.created_at as prescribed_date,
    p.status
  FROM prescriptions p
  WHERE p.patient_id = p_patient_id 
    AND p.status = 'active'
  ORDER BY p.created_at DESC;
END;
$$;

-- 12. Fix get_patient_by_phone function
CREATE OR REPLACE FUNCTION get_patient_by_phone(p_phone TEXT)
RETURNS TABLE (
  patient_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as patient_id,
    p.name,
    p.email,
    pp.phone
  FROM patients p
  JOIN patient_phones pp ON p.id = pp.patient_id
  WHERE pp.phone = p_phone AND p.is_active = TRUE;
END;
$$;

-- 13. Fix find_or_create_patient function
CREATE OR REPLACE FUNCTION find_or_create_patient(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  -- Try to find existing patient
  SELECT p.id INTO v_patient_id
  FROM patients p
  JOIN patient_phones pp ON p.id = pp.patient_id
  WHERE pp.phone = p_phone AND p.is_active = TRUE
  LIMIT 1;
  
  -- If not found, create new patient
  IF v_patient_id IS NULL THEN
    INSERT INTO patients (
      name,
      email,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      p_name,
      p_email,
      TRUE,
      NOW(),
      NOW()
    ) RETURNING id INTO v_patient_id;
    
    -- Add phone number
    INSERT INTO patient_phones (patient_id, phone, is_primary)
    VALUES (v_patient_id, p_phone, TRUE);
  END IF;
  
  RETURN v_patient_id;
END;
$$;

-- Display completion message
SELECT 'Function Search Path Fix Complete (Simple Version)!' as status;
