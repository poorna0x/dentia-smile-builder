-- 🔧 Fix Function Search Path Mutability Warnings
-- =====================================================
-- 
-- This script fixes all function search path mutability warnings
-- by adding explicit search_path settings to functions
-- =====================================================

-- Set explicit search path for all functions to prevent schema hijacking
-- This ensures functions only access objects in the intended schemas

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

-- 3. Fix add_lab_work_result function
CREATE OR REPLACE FUNCTION add_lab_work_result(
  p_order_id UUID,
  p_result_data JSONB,
  p_completed_by TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
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
    result_data,
    completed_by,
    notes,
    created_at,
    updated_at
  ) VALUES (
    p_order_id,
    p_result_data,
    p_completed_by,
    p_notes,
    NOW(),
    NOW()
  ) RETURNING id INTO v_result_id;
  
  -- Update order status
  UPDATE lab_work_orders 
  SET status = 'completed', updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN v_result_id;
END;
$$;

-- 4. Fix get_lab_work_summary function
CREATE OR REPLACE FUNCTION get_lab_work_summary(p_patient_id UUID)
RETURNS TABLE (
  order_id UUID,
  lab_type TEXT,
  status TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
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
    lwr.created_at as completion_date,
    lwo.order_number
  FROM lab_work_orders lwo
  LEFT JOIN lab_work_results lwr ON lwo.id = lwr.order_id
  WHERE lwo.patient_id = p_patient_id
  ORDER BY lwo.created_at DESC;
END;
$$;

-- 5. Fix log_system_change function
CREATE OR REPLACE FUNCTION log_system_change(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_user_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO system_audit_log (
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_user_id,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 6. Fix generate_lab_order_number function
CREATE OR REPLACE FUNCTION generate_lab_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_sequence INTEGER;
  v_order_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) + 1
  INTO v_sequence
  FROM lab_work_orders
  WHERE order_number LIKE 'LAB-' || v_year || '-%';
  
  v_order_number := 'LAB-' || v_year || '-' || LPAD(v_sequence::TEXT, 4, '0');
  
  RETURN v_order_number;
END;
$$;

-- 7. Fix get_lab_work_status_history function
CREATE OR REPLACE FUNCTION get_lab_work_status_history(p_order_id UUID)
RETURNS TABLE (
  status TEXT,
  changed_at TIMESTAMP WITH TIME ZONE,
  changed_by TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'pending' as status,
    lwo.created_at as changed_at,
    NULL as changed_by
  FROM lab_work_orders lwo
  WHERE lwo.id = p_order_id
  
  UNION ALL
  
  SELECT 
    'completed' as status,
    lwr.created_at as changed_at,
    lwr.completed_by as changed_by
  FROM lab_work_results lwr
  WHERE lwr.order_id = p_order_id
  
  ORDER BY changed_at;
END;
$$;

-- 8. Fix extract_first_name function
CREATE OR REPLACE FUNCTION extract_first_name(full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN SPLIT_PART(TRIM(full_name), ' ', 1);
END;
$$;

-- 9. Fix is_same_person function
CREATE OR REPLACE FUNCTION is_same_person(name1 TEXT, name2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name1 TEXT;
  v_first_name2 TEXT;
BEGIN
  v_first_name1 := LOWER(extract_first_name(name1));
  v_first_name2 := LOWER(extract_first_name(name2));
  
  RETURN v_first_name1 = v_first_name2;
END;
$$;

-- 10. Fix find_or_create_patient_improved function
CREATE OR REPLACE FUNCTION find_or_create_patient_improved(
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_date_of_birth DATE DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
  v_existing_patient_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Extract first and last name
  v_first_name := extract_first_name(p_name);
  v_last_name := TRIM(SUBSTRING(p_name FROM LENGTH(v_first_name) + 1));
  
  -- Try to find existing patient by phone first
  SELECT p.id INTO v_existing_patient_id
  FROM patients p
  JOIN patient_phones pp ON p.id = pp.patient_id
  WHERE pp.phone = p_phone AND p.is_active = TRUE
  LIMIT 1;
  
  -- If not found by phone, try by name similarity
  IF v_existing_patient_id IS NULL THEN
    SELECT p.id INTO v_existing_patient_id
    FROM patients p
    WHERE is_same_person(p.name, p_name) AND p.is_active = TRUE
    LIMIT 1;
  END IF;
  
  -- If found, return existing patient
  IF v_existing_patient_id IS NOT NULL THEN
    RETURN v_existing_patient_id;
  END IF;
  
  -- Create new patient
  INSERT INTO patients (
    name,
    email,
    date_of_birth,
    gender,
    address,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    p_name,
    p_email,
    p_date_of_birth,
    p_gender,
    p_address,
    TRUE,
    NOW(),
    NOW()
  ) RETURNING id INTO v_patient_id;
  
  -- Add phone number
  INSERT INTO patient_phones (patient_id, phone, is_primary)
  VALUES (v_patient_id, p_phone, TRUE);
  
  RETURN v_patient_id;
END;
$$;

-- 11. Fix update_lab_work_updated_at function
CREATE OR REPLACE FUNCTION update_lab_work_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 12. Fix create_prescription_with_history function
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
  
  RETURN v_prescription_id;
END;
$$;

-- 13. Fix refill_prescription function
CREATE OR REPLACE FUNCTION refill_prescription(p_prescription_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE prescriptions 
  SET 
    refill_count = COALESCE(refill_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_prescription_id;
  
  RETURN FOUND;
END;
$$;

-- 14. Fix update_lab_work_status function
CREATE OR REPLACE FUNCTION update_lab_work_status(
  p_order_id UUID,
  p_status TEXT,
  p_updated_by TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lab_work_orders 
  SET 
    status = p_status,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN FOUND;
END;
$$;

-- 15. Fix auto_link_appointment_with_patient function
CREATE OR REPLACE FUNCTION auto_link_appointment_with_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Skip if patient_id is already set
  IF NEW.patient_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Extract first and last name
  v_first_name := extract_first_name(NEW.patient_name);
  v_last_name := TRIM(SUBSTRING(NEW.patient_name FROM LENGTH(v_first_name) + 1));
  
  -- Try to find existing patient by phone first
  SELECT p.id INTO v_patient_id
  FROM patients p
  JOIN patient_phones pp ON p.id = pp.patient_id
  WHERE pp.phone = NEW.patient_phone AND p.is_active = TRUE
  LIMIT 1;
  
  -- If not found by phone, try by name similarity
  IF v_patient_id IS NULL THEN
    SELECT p.id INTO v_patient_id
    FROM patients p
    WHERE is_same_person(p.name, NEW.patient_name) AND p.is_active = TRUE
    LIMIT 1;
  END IF;
  
  -- If found, link to existing patient
  IF v_patient_id IS NOT NULL THEN
    NEW.patient_id := v_patient_id;
  ELSE
    -- Create new patient
    INSERT INTO patients (
      name,
      email,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.patient_name,
      NEW.patient_email,
      TRUE,
      NOW(),
      NOW()
    ) RETURNING id INTO v_patient_id;
    
    -- Add phone number
    INSERT INTO patient_phones (patient_id, phone, is_primary)
    VALUES (v_patient_id, NEW.patient_phone, TRUE);
    
    NEW.patient_id := v_patient_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 16. Fix get_treatment_payments function
CREATE OR REPLACE FUNCTION get_treatment_payments(p_patient_id UUID)
RETURNS TABLE (
  payment_id UUID,
  treatment_name TEXT,
  amount DECIMAL(10,2),
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.id as payment_id,
    dt.name as treatment_name,
    tp.amount,
    tp.payment_method,
    tp.created_at as payment_date,
    tp.notes
  FROM treatment_payments tp
  JOIN dental_treatments dt ON tp.treatment_id = dt.id
  WHERE tp.patient_id = p_patient_id
  ORDER BY tp.created_at DESC;
END;
$$;

-- 17. Fix get_treatment_payment_summary function
CREATE OR REPLACE FUNCTION get_treatment_payment_summary(p_patient_id UUID)
RETURNS TABLE (
  total_payments DECIMAL(10,2),
  payment_count INTEGER,
  last_payment_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(tp.amount), 0) as total_payments,
    COUNT(*) as payment_count,
    MAX(tp.created_at) as last_payment_date
  FROM treatment_payments tp
  WHERE tp.patient_id = p_patient_id;
END;
$$;

-- 18. Fix get_feature_toggles function
CREATE OR REPLACE FUNCTION get_feature_toggles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_toggles JSONB;
BEGIN
  SELECT settings INTO v_toggles
  FROM system_settings
  WHERE setting_type = 'feature_toggle';
  
  RETURN COALESCE(v_toggles, '{}'::JSONB);
END;
$$;

-- 19. Fix get_lab_work_orders function
CREATE OR REPLACE FUNCTION get_lab_work_orders(p_patient_id UUID)
RETURNS TABLE (
  order_id UUID,
  lab_type TEXT,
  status TEXT,
  order_date TIMESTAMP WITH TIME ZONE,
  completion_date TIMESTAMP WITH TIME ZONE,
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
    lwr.created_at as completion_date,
    lwo.order_number
  FROM lab_work_orders lwo
  LEFT JOIN lab_work_results lwr ON lwo.id = lwr.order_id
  WHERE lwo.patient_id = p_patient_id
  ORDER BY lwo.created_at DESC;
END;
$$;

-- 20. Fix get_lab_work_results function
CREATE OR REPLACE FUNCTION get_lab_work_results(p_order_id UUID)
RETURNS TABLE (
  result_id UUID,
  result_data JSONB,
  completed_by TEXT,
  notes TEXT,
  completed_date TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    lwr.id as result_id,
    lwr.result_data,
    lwr.completed_by,
    lwr.notes,
    lwr.created_at as completed_date
  FROM lab_work_results lwr
  WHERE lwr.order_id = p_order_id
  ORDER BY lwr.created_at DESC;
END;
$$;

-- 21. Fix update_system_settings_updated_at function
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 22. Fix migrate_appointments_to_patients function
CREATE OR REPLACE FUNCTION migrate_appointments_to_patients()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  v_appointment RECORD;
  v_patient_id UUID;
BEGIN
  FOR v_appointment IN 
    SELECT * FROM appointments 
    WHERE patient_id IS NULL AND patient_name IS NOT NULL
  LOOP
    -- Try to find or create patient
    SELECT find_or_create_patient_improved(
      v_appointment.patient_name,
      v_appointment.patient_phone,
      v_appointment.patient_email
    ) INTO v_patient_id;
    
    -- Update appointment with patient_id
    UPDATE appointments 
    SET patient_id = v_patient_id
    WHERE id = v_appointment.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$;

-- 23. Fix update_feature_toggle function
CREATE OR REPLACE FUNCTION update_feature_toggle(
  p_feature_name TEXT,
  p_enabled BOOLEAN,
  p_user_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_settings JSONB;
  v_new_settings JSONB;
  v_log_id UUID;
BEGIN
  -- Get current settings
  SELECT settings INTO v_current_settings
  FROM system_settings
  WHERE setting_type = 'feature_toggle';
  
  -- Update settings
  v_new_settings := v_current_settings || jsonb_build_object(p_feature_name, p_enabled);
  
  UPDATE system_settings
  SET 
    settings = v_new_settings,
    updated_at = NOW()
  WHERE setting_type = 'feature_toggle';
  
  -- Log the change
  SELECT log_system_change(
    'UPDATE_FEATURE_TOGGLE',
    'system_settings',
    'feature_toggle',
    v_current_settings,
    v_new_settings,
    p_user_id
  ) INTO v_log_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 24. Fix is_feature_enabled function
CREATE OR REPLACE FUNCTION is_feature_enabled(p_feature_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT (settings->>p_feature_name)::BOOLEAN INTO v_enabled
  FROM system_settings
  WHERE setting_type = 'feature_toggle';
  
  RETURN COALESCE(v_enabled, FALSE);
END;
$$;

-- 25. Fix get_active_prescriptions function
CREATE OR REPLACE FUNCTION get_active_prescriptions(p_patient_id UUID)
RETURNS TABLE (
  prescription_id UUID,
  medication_name TEXT,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  prescribed_date TIMESTAMP WITH TIME ZONE,
  refill_count INTEGER
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
    p.instructions,
    p.created_at as prescribed_date,
    COALESCE(p.refill_count, 0) as refill_count
  FROM prescriptions p
  WHERE p.patient_id = p_patient_id AND p.status = 'active'
  ORDER BY p.created_at DESC;
END;
$$;

-- 26. Fix get_patient_by_phone function
CREATE OR REPLACE FUNCTION get_patient_by_phone(p_phone TEXT)
RETURNS TABLE (
  patient_id UUID,
  name TEXT,
  email TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT
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
    p.date_of_birth,
    p.gender,
    p.address
  FROM patients p
  JOIN patient_phones pp ON p.id = pp.patient_id
  WHERE pp.phone = p_phone AND p.is_active = TRUE;
END;
$$;

-- 27. Fix get_system_status function
CREATE OR REPLACE FUNCTION get_system_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status JSONB;
  v_clinic_count INTEGER;
  v_appointment_count INTEGER;
  v_patient_count INTEGER;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO v_clinic_count FROM clinics;
  SELECT COUNT(*) INTO v_appointment_count FROM appointments;
  SELECT COUNT(*) INTO v_patient_count FROM patients;
  
  -- Build status object
  v_status = jsonb_build_object(
    'timestamp', NOW(),
    'databaseConnected', TRUE,
    'realtimeActive', TRUE,
    'emailServiceActive', TRUE,
    'lastBackup', NOW(),
    'statistics', jsonb_build_object(
      'clinics', v_clinic_count,
      'appointments', v_appointment_count,
      'patients', v_patient_count
    )
  );
  
  RETURN v_status;
END;
$$;

-- 28. Fix get_patient_phones function
CREATE OR REPLACE FUNCTION get_patient_phones(p_patient_id UUID)
RETURNS TABLE (
  phone_id UUID,
  phone TEXT,
  is_primary BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.id as phone_id,
    pp.phone,
    pp.is_primary
  FROM patient_phones pp
  WHERE pp.patient_id = p_patient_id
  ORDER BY pp.is_primary DESC, pp.created_at;
END;
$$;

-- 29. Fix find_or_create_patient function
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
SELECT 'Function Search Path Mutability Fix Complete!' as status;
