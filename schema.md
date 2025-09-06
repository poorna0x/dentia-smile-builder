--
-- PostgreSQL database dump
--


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--




--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: doctor_attribution_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.doctor_attribution_type AS ENUM (
    'Started',
    'Completed',
    'Assisted'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'Pending',
    'Partial',
    'Completed',
    'Overdue'
);


--
-- Name: add_payment_transaction(uuid, numeric, date, character varying, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_payment_transaction(treatment_payment_id uuid, amount numeric, payment_date date, payment_mode character varying, notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
  transaction_id UUID;
BEGIN
  INSERT INTO payment_transactions (
    treatment_payment_id, 
    amount, 
    payment_date, 
    payment_mode, 
    notes
  ) VALUES (
    treatment_payment_id, 
    amount, 
    payment_date, 
    payment_mode, 
    notes
  ) RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$;


--
-- Name: add_payment_transaction(uuid, numeric, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_payment_transaction(p_payment_id uuid, p_amount numeric, p_payment_method text, p_transaction_id text DEFAULT NULL::text, p_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_transaction_id UUID;
BEGIN
  INSERT INTO payment_transactions (
    treatment_payment_id,
    amount,
    payment_method,
    transaction_id,
    notes,
    created_at
  ) VALUES (
    p_payment_id,
    p_amount,
    p_payment_method,
    p_transaction_id,
    p_notes,
    NOW()
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$;


--
-- Name: add_treatment_payment(uuid, uuid, numeric, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_treatment_payment(p_patient_id uuid, p_treatment_id uuid, p_amount numeric, p_payment_method text DEFAULT 'cash'::text, p_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: add_treatment_payment(uuid, uuid, uuid, numeric, numeric, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.add_treatment_payment(p_treatment_id uuid, p_clinic_id uuid, p_patient_id uuid, p_total_amount numeric, p_paid_amount numeric DEFAULT 0, p_payment_status text DEFAULT 'Pending'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    INSERT INTO treatment_payments (
        treatment_id, clinic_id, patient_id, 
        total_amount, paid_amount, remaining_amount, payment_status
    ) VALUES (
        p_treatment_id, p_clinic_id, p_patient_id,
        p_total_amount, p_paid_amount, p_total_amount - p_paid_amount, p_payment_status
    ) RETURNING id INTO v_payment_id;
    
    RETURN v_payment_id;
END;
$$;


--
-- Name: auto_create_payment_record(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_create_payment_record() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
      remaining_amount,
      payment_status
    ) VALUES (
      NEW.id,
      NEW.clinic_id,
      NEW.patient_id,
      COALESCE(NEW.cost, 0),
      0,
      COALESCE(NEW.cost, 0),
      'Pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: auto_create_treatment_payment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_create_treatment_payment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: auto_link_appointment_with_patient(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_link_appointment_with_patient() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    patient_id UUID;
BEGIN
    -- Only process if patient_id is not already set
    IF NEW.patient_id IS NULL THEN
        -- Find or create patient
        patient_id := find_or_create_patient(
            NEW.name,
            NEW.phone,
            NEW.email,
            NEW.clinic_id
        );
        
        -- Set the patient_id
        NEW.patient_id := patient_id;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- Name: auto_link_appointment_with_patient(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_link_appointment_with_patient(p_appointment_id uuid, p_patient_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    UPDATE appointments 
    SET patient_id = p_patient_id
    WHERE id = p_appointment_id;
END;
$$;


--
-- Name: check_password_strength(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_password_strength(password text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $_$
BEGIN
  -- Password must be at least 8 characters
  IF LENGTH(password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters long';
  END IF;
  
  -- Password must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RAISE EXCEPTION 'Password must contain at least one uppercase letter';
  END IF;
  
  -- Password must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RAISE EXCEPTION 'Password must contain at least one lowercase letter';
  END IF;
  
  -- Password must contain at least one number
  IF password !~ '[0-9]' THEN
    RAISE EXCEPTION 'Password must contain at least one number';
  END IF;
  
  -- Password must contain at least one special character
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RAISE EXCEPTION 'Password must contain at least one special character';
  END IF;
  
  RETURN TRUE;
END;
$_$;


--
-- Name: create_lab_work_order(uuid, uuid, text, text, text, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_lab_work_order(p_clinic_id uuid, p_patient_id uuid, p_work_type text, p_description text, p_lab_facility text DEFAULT NULL::text, p_expected_completion_date date DEFAULT NULL::date) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
BEGIN
    -- Generate order number
    SELECT generate_lab_order_number() INTO v_order_number;
    
    INSERT INTO lab_work (
        clinic_id, patient_id, work_type, description, 
        lab_facility, order_date, expected_completion_date, status
    ) VALUES (
        p_clinic_id, p_patient_id, p_work_type, p_description,
        p_lab_facility, CURRENT_DATE, p_expected_completion_date, 'Ordered'
    ) RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$;


--
-- Name: create_prescription_with_history(uuid, text, text, text, text, text, text, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_prescription_with_history(p_patient_id uuid, p_medication_name text, p_dosage text, p_frequency text, p_duration text, p_instructions text DEFAULT NULL::text, p_prescribed_by text DEFAULT 'Dentist'::text, p_prescribed_date date DEFAULT CURRENT_DATE, p_refills_remaining integer DEFAULT 0) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_prescription_id UUID;
BEGIN
    INSERT INTO prescriptions (
        patient_id, medication_name, dosage, frequency, duration,
        instructions, prescribed_by, prescribed_date, refills_remaining, status
    ) VALUES (
        p_patient_id, p_medication_name, p_dosage, p_frequency, p_duration,
        p_instructions, p_prescribed_by, p_prescribed_date, p_refills_remaining, 'Active'
    ) RETURNING id INTO v_prescription_id;
    
    RETURN v_prescription_id;
END;
$$;


--
-- Name: extract_first_name(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.extract_first_name(full_name text) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN SPLIT_PART(TRIM(full_name), ' ', 1);
END;
$$;


--
-- Name: find_or_create_patient(text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_or_create_patient(p_name text, p_phone text, p_email text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: find_or_create_patient(character varying, character varying, character varying, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_or_create_patient(p_full_name character varying, p_phone character varying, p_email character varying, p_clinic_id uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_patient_id UUID;
    v_first_name VARCHAR(255);
    v_last_name VARCHAR(255);
    v_existing_patient_id UUID;
    v_existing_full_name VARCHAR(255);
    v_name_match BOOLEAN;
    v_cleaned_name VARCHAR(255);
    v_name_parts TEXT[];
    v_part_count INTEGER;
BEGIN
    -- Clean and normalize the full name
    v_cleaned_name := trim(regexp_replace(p_full_name, '\s+', ' ', 'g'));
    
    -- Split the cleaned name into parts
    v_name_parts := string_to_array(v_cleaned_name, ' ');
    v_part_count := array_length(v_name_parts, 1);
    
    -- Robust name splitting logic
    IF v_part_count = 0 OR v_cleaned_name = '' THEN
        v_first_name := '';
        v_last_name := NULL;
    ELSIF v_part_count = 1 THEN
        v_first_name := v_name_parts[1];
        v_last_name := NULL;
    ELSIF v_part_count = 2 THEN
        v_first_name := v_name_parts[1];
        v_last_name := v_name_parts[2];
    ELSIF v_part_count = 3 THEN
        IF v_name_parts[1] IN ('Dr.', 'Dr', 'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Prof.', 'Prof') THEN
            v_first_name := v_name_parts[2];
            v_last_name := v_name_parts[3];
        ELSE
            v_first_name := v_name_parts[1];
            v_last_name := v_name_parts[2] || ' ' || v_name_parts[3];
        END IF;
    ELSE
        v_first_name := v_name_parts[1];
        v_last_name := array_to_string(v_name_parts[2:], ' ');
    END IF;
    
    -- Clean up the names
    v_first_name := trim(v_first_name);
    v_last_name := CASE WHEN v_last_name IS NOT NULL THEN trim(v_last_name) ELSE NULL END;
    
    -- Check if patient exists by phone
    SELECT pp.patient_id INTO v_existing_patient_id
    FROM patient_phones pp
    WHERE pp.phone = p_phone
    AND pp.patient_id IN (
        SELECT id FROM patients WHERE clinic_id = p_clinic_id
    )
    LIMIT 1;
    
    IF v_existing_patient_id IS NOT NULL THEN
        -- Patient exists with this phone - check name match
        SELECT 
            CONCAT(first_name, ' ', COALESCE(last_name, '')) INTO v_existing_full_name
        FROM patients 
        WHERE id = v_existing_patient_id;
        
        -- Robust name comparison
        v_name_match := LOWER(TRIM(regexp_replace(v_existing_full_name, '\s+', ' ', 'g'))) = 
                       LOWER(TRIM(regexp_replace(p_full_name, '\s+', ' ', 'g')));
        
        IF v_name_match THEN
            RETURN v_existing_patient_id;
        ELSE
            -- Different person with same phone - create new patient
            INSERT INTO patients (
                clinic_id, 
                first_name, 
                last_name, 
                phone, 
                email,
                is_active
            ) VALUES (
                p_clinic_id,
                v_first_name,
                v_last_name,
                p_phone,
                p_email,
                TRUE
            ) RETURNING id INTO v_patient_id;
            
            -- Add phone to patient_phones table
            INSERT INTO patient_phones (patient_id, phone, phone_type, is_primary, is_verified)
            VALUES (v_patient_id, p_phone, 'primary', TRUE, TRUE);
            
            RETURN v_patient_id;
        END IF;
    ELSE
        -- New patient - create record
        INSERT INTO patients (
            clinic_id, 
            first_name, 
            last_name, 
            phone, 
            email,
            is_active
        ) VALUES (
            p_clinic_id,
            v_first_name,
            v_last_name,
            p_phone,
            p_email,
            TRUE
        ) RETURNING id INTO v_patient_id;
        
        -- Add phone to patient_phones table
        INSERT INTO patient_phones (patient_id, phone, phone_type, is_primary, is_verified)
        VALUES (v_patient_id, p_phone, 'primary', TRUE, TRUE);
        
        RETURN v_patient_id;
    END IF;
END;
$$;


--
-- Name: find_or_create_patient(text, text, text, uuid, text, date, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_or_create_patient(p_first_name text, p_last_name text, p_phone text, p_clinic_id uuid, p_email text DEFAULT NULL::text, p_date_of_birth date DEFAULT NULL::date, p_gender text DEFAULT NULL::text, p_address text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    v_patient_id UUID;
    v_existing_patient_id UUID;
BEGIN
    -- Check if patient exists with this phone number
    SELECT patient_id INTO v_existing_patient_id
    FROM patient_phones
    WHERE phone = p_phone AND patient_id IN (
        SELECT id FROM patients WHERE clinic_id = p_clinic_id
    )
    LIMIT 1;
    
    IF v_existing_patient_id IS NOT NULL THEN
        RETURN v_existing_patient_id;
    END IF;
    
    -- Create new patient
    INSERT INTO patients (
        first_name, last_name, phone, clinic_id, 
        email, date_of_birth, gender, address
    ) VALUES (
        p_first_name, p_last_name, p_phone, p_clinic_id,
        p_email, p_date_of_birth, p_gender, p_address
    ) RETURNING id INTO v_patient_id;
    
    -- Add phone number to patient_phones
    INSERT INTO patient_phones (patient_id, phone)
    VALUES (v_patient_id, p_phone);
    
    RETURN v_patient_id;
END;
$$;


--
-- Name: find_or_create_patient_improved(text, text, text, date, text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.find_or_create_patient_improved(p_name text, p_phone text, p_email text DEFAULT NULL::text, p_date_of_birth date DEFAULT NULL::date, p_gender text DEFAULT NULL::text, p_clinic_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_captcha_statistics(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_captcha_statistics(p_days_back integer DEFAULT 7) RETURNS TABLE(total_attempts bigint, successful_attempts bigint, failed_attempts bigint, captcha_triggered_count bigint, unique_ips bigint, unique_emails bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_attempts,
    COUNT(*) FILTER (WHERE is_successful = TRUE) as successful_attempts,
    COUNT(*) FILTER (WHERE is_successful = FALSE) as failed_attempts,
    COUNT(*) FILTER (WHERE attempt_type = 'captcha_triggered') as captcha_triggered_count,
    COUNT(DISTINCT ip_address) as unique_ips,
    COUNT(DISTINCT email) FILTER (WHERE email IS NOT NULL) as unique_emails
  FROM captcha_attempts
  WHERE created_at >= NOW() - (p_days_back || ' days')::INTERVAL;
END;
$$;


--
-- Name: get_feature_toggles(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_feature_toggles() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_income_breakdown(date, date, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_income_breakdown(p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_clinic_id uuid DEFAULT NULL::uuid) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_result JSON;
BEGIN
  WITH payment_data AS (
    SELECT 
      payment_method,
      SUM(amount) as total_amount,
      COUNT(*) as transaction_count
    FROM payment_transactions pt
    JOIN treatment_payments tp ON pt.payment_id = tp.id
    WHERE (p_start_date IS NULL OR tp.created_at >= p_start_date)
      AND (p_end_date IS NULL OR tp.created_at <= p_end_date)
      AND (p_clinic_id IS NULL OR tp.clinic_id = p_clinic_id)
    GROUP BY payment_method
  )
  SELECT json_build_object(
    'total_income', COALESCE(SUM(total_amount), 0),
    'payment_breakdown', json_agg(
      json_build_object(
        'method', payment_method,
        'amount', total_amount,
        'count', transaction_count
      )
    )
  ) INTO v_result
  FROM payment_data;
  
  RETURN v_result;
END;
$$;


--
-- Name: get_income_breakdown(uuid, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_income_breakdown(clinic_uuid uuid, start_date date, end_date date) RETURNS TABLE(total_income numeric, cash_amount numeric, upi_amount numeric, card_amount numeric, payment_methods json)
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Check if treatment_payments table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'treatment_payments') THEN
    RETURN QUERY
    WITH payment_summary AS (
      SELECT 
        COALESCE(SUM(tp.paid_amount), 0) as total_income,
        -- Use the payment_method column for accurate breakdown
        COALESCE(SUM(
          CASE 
            WHEN pt.payment_method = 'Cash' THEN pt.amount
            ELSE 0 
          END
        ), 0) as cash_amount,
        COALESCE(SUM(
          CASE 
            WHEN pt.payment_method = 'UPI' THEN pt.amount
            ELSE 0 
          END
        ), 0) as upi_amount,
        COALESCE(SUM(
          CASE 
            WHEN pt.payment_method = 'Card' THEN pt.amount
            ELSE 0 
          END
        ), 0) as card_amount
      FROM treatment_payments tp
      LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
      WHERE tp.clinic_id = clinic_uuid
      AND pt.payment_date BETWEEN start_date AND end_date
    )
    SELECT 
      ps.total_income,
      ps.cash_amount,
      ps.upi_amount,
      ps.card_amount,
      json_build_object(
        'cash', CASE WHEN ps.cash_amount > 0 THEN json_build_object('amount', ps.cash_amount, 'percentage', ROUND((ps.cash_amount / NULLIF(ps.total_income, 0)) * 100, 2)) ELSE NULL END,
        'upi', CASE WHEN ps.upi_amount > 0 THEN json_build_object('amount', ps.upi_amount, 'percentage', ROUND((ps.upi_amount / NULLIF(ps.total_income, 0)) * 100, 2)) ELSE NULL END,
        'card', CASE WHEN ps.card_amount > 0 THEN json_build_object('amount', ps.card_amount, 'percentage', ROUND((ps.card_amount / NULLIF(ps.total_income, 0)) * 100, 2)) ELSE NULL END
      ) as payment_methods
    FROM payment_summary ps;
  ELSE
    -- Return empty data if table doesn't exist
    RETURN QUERY SELECT 
      0.00 as total_income,
      0.00 as cash_amount,
      0.00 as upi_amount,
      0.00 as card_amount,
      '{}'::json as payment_methods;
  END IF;
END;
$$;


--
-- Name: get_income_breakdown(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_income_breakdown(clinic_uuid uuid, start_date text, end_date text) RETURNS TABLE(total_income numeric, cash_amount numeric, upi_amount numeric, card_amount numeric, payment_breakdown json)
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Check if payment_transactions table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transactions') THEN
    RETURN QUERY
    WITH payment_stats AS (
      SELECT 
        COALESCE(SUM(amount), 0) as total_income,
        COALESCE(SUM(CASE WHEN payment_method = 'Cash' THEN amount ELSE 0 END), 0) as cash_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'UPI' THEN amount ELSE 0 END), 0) as upi_amount,
        COALESCE(SUM(CASE WHEN payment_method = 'Card' THEN amount ELSE 0 END), 0) as card_amount
      FROM payment_transactions pt
      JOIN treatment_payments tp ON pt.treatment_payment_id = tp.id
      WHERE tp.clinic_id = clinic_uuid
      AND pt.payment_date BETWEEN start_date::DATE AND end_date::DATE
    )
    SELECT 
      ps.total_income,
      ps.cash_amount,
      ps.upi_amount,
      ps.card_amount,
      json_build_object(
        'cash', json_build_object('amount', ps.cash_amount, 'percentage', CASE WHEN ps.total_income > 0 THEN ROUND((ps.cash_amount / ps.total_income) * 100, 2) ELSE 0 END),
        'upi', json_build_object('amount', ps.upi_amount, 'percentage', CASE WHEN ps.total_income > 0 THEN ROUND((ps.upi_amount / ps.total_income) * 100, 2) ELSE 0 END),
        'card', json_build_object('amount', ps.card_amount, 'percentage', CASE WHEN ps.total_income > 0 THEN ROUND((ps.card_amount / ps.total_income) * 100, 2) ELSE 0 END)
      ) as payment_breakdown
    FROM payment_stats ps;
  ELSE
    -- Return empty data if table doesn't exist
    RETURN QUERY SELECT 
      0.00 as total_income,
      0.00 as cash_amount,
      0.00 as upi_amount,
      0.00 as card_amount,
      '{}'::json as payment_breakdown;
  END IF;
END;
$$;


--
-- Name: get_lab_work_results(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lab_work_results(p_order_id uuid) RETURNS TABLE(result_id uuid, result_data jsonb, completed_by text, notes text, completed_date timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_lab_work_status_history(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lab_work_status_history(p_order_id uuid) RETURNS TABLE(status text, changed_at timestamp with time zone, changed_by text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_lab_work_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lab_work_summary(p_patient_id uuid) RETURNS TABLE(order_id uuid, lab_type text, status text, order_date timestamp with time zone, completion_date timestamp with time zone, order_number text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_lab_work_summary(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_lab_work_summary(p_clinic_id uuid, p_patient_id uuid) RETURNS TABLE(total_orders integer, pending_orders integer, completed_orders integer, recent_orders json)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_orders,
        COUNT(*) FILTER (WHERE status IN ('Ordered', 'In Progress', 'Quality Check'))::INTEGER as pending_orders,
        COUNT(*) FILTER (WHERE status = 'Completed')::INTEGER as completed_orders,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', lw.id,
                    'work_type', lw.work_type,
                    'status', lw.status,
                    'order_date', lw.order_date,
                    'expected_completion_date', lw.expected_completion_date
                ) ORDER BY lw.order_date DESC
            ) FILTER (WHERE lw.order_date >= CURRENT_DATE - INTERVAL '30 days'),
            '[]'::json
        ) as recent_orders
    FROM lab_work lw
    WHERE lw.clinic_id = p_clinic_id AND lw.patient_id = p_patient_id;
END;
$$;


--
-- Name: get_notification_settings(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_notification_settings() RETURNS TABLE(whatsapp_enabled boolean, whatsapp_phone_number text, send_confirmation boolean, send_reminders boolean, send_reviews boolean, reminder_hours integer, send_to_dentist boolean, review_requests_enabled boolean, review_message_template text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((settings->>'enabled')::BOOLEAN, false) as whatsapp_enabled,
    COALESCE((settings->>'phone_number')::TEXT, '') as whatsapp_phone_number,
    COALESCE((settings->>'send_confirmation')::BOOLEAN, false) as send_confirmation,
    COALESCE((settings->>'send_reminders')::BOOLEAN, false) as send_reminders,
    COALESCE((settings->>'send_reviews')::BOOLEAN, false) as send_reviews,
    COALESCE((settings->>'reminder_hours')::INTEGER, 24) as reminder_hours,
    COALESCE((settings->>'send_to_dentist')::BOOLEAN, false) as send_to_dentist,
    COALESCE((SELECT (settings->>'enabled')::BOOLEAN FROM system_settings WHERE setting_type = 'review_requests'), false) as review_requests_enabled,
    COALESCE((SELECT (settings->>'message_template')::TEXT FROM system_settings WHERE setting_type = 'review_requests'), 'Thank you for choosing our clinic! Please share your experience: {review_link}') as review_message_template
  FROM system_settings 
  WHERE setting_type = 'whatsapp_notifications';
END;
$$;


--
-- Name: get_patient_by_phone(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_patient_by_phone(p_phone text) RETURNS TABLE(patient_id uuid, name text, email text, date_of_birth date, gender text, address text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_patient_by_phone(text, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_patient_by_phone(p_phone text, p_clinic_id uuid) RETURNS TABLE(patient_id uuid, first_name text, last_name text, full_name text, email text, phone_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as patient_id,
        p.first_name::TEXT,
        p.last_name::TEXT,
        (p.first_name || ' ' || COALESCE(p.last_name, ''))::TEXT as full_name,
        p.email::TEXT,
        COUNT(pp.phone) as phone_count
    FROM patients p
    LEFT JOIN patient_phones pp ON p.id = pp.patient_id
    WHERE p.clinic_id = p_clinic_id
    AND EXISTS (
        SELECT 1 FROM patient_phones pp2 
        WHERE pp2.patient_id = p.id 
        AND pp2.phone = p_phone
    )
    GROUP BY p.id, p.first_name, p.last_name, p.email;
END;
$$;


--
-- Name: get_patient_phones(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_patient_phones(p_patient_id uuid) RETURNS TABLE(phone_id uuid, phone text, is_primary boolean)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_system_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_system_status() RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_tooth_images(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_tooth_images(p_clinic_id uuid, p_patient_id uuid) RETURNS TABLE(id uuid, clinic_id uuid, patient_id uuid, tooth_number character varying, image_type character varying, description text, cloudinary_url text, cloudinary_public_id text, file_size_bytes bigint, uploaded_at timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Return tooth images for the specified patient and clinic
    RETURN QUERY
    SELECT 
        ti.id,
        ti.clinic_id,
        ti.patient_id,
        ti.tooth_number,
        COALESCE(ti.image_type, '') as image_type,
        COALESCE(ti.description, '') as description,
        COALESCE(ti.cloudinary_url, ti.image_url, '') as cloudinary_url,
        COALESCE(ti.cloudinary_public_id, '') as cloudinary_public_id,
        COALESCE(ti.file_size_bytes, 0) as file_size_bytes,
        COALESCE(ti.uploaded_at, ti.created_at) as uploaded_at,
        ti.created_at,
        ti.updated_at
    FROM tooth_images ti
    WHERE ti.clinic_id = p_clinic_id
      AND ti.patient_id = p_patient_id
    ORDER BY ti.tooth_number, COALESCE(ti.uploaded_at, ti.created_at) DESC;
END;
$$;


--
-- Name: get_treatment_payment_summary(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_treatment_payment_summary(treatment_uuid uuid) RETURNS TABLE(total_amount numeric, paid_amount numeric, remaining_amount numeric, payment_status public.payment_status, transaction_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tp.total_amount,
    tp.paid_amount,
    tp.remaining_amount,
    tp.payment_status,
    COUNT(pt.id)::BIGINT as transaction_count
  FROM treatment_payments tp
  LEFT JOIN payment_transactions pt ON tp.id = pt.treatment_payment_id
  WHERE tp.treatment_id = treatment_uuid
  GROUP BY tp.id, tp.total_amount, tp.paid_amount, tp.remaining_amount, tp.payment_status;
END;
$$;


--
-- Name: get_treatment_payments(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_treatment_payments(p_patient_id uuid) RETURNS TABLE(payment_id uuid, treatment_name text, amount numeric, payment_method text, payment_date timestamp with time zone, notes text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: get_treatments_with_dentist(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_treatments_with_dentist(p_patient_id uuid DEFAULT NULL::uuid, p_clinic_id uuid DEFAULT NULL::uuid) RETURNS TABLE(treatment_id uuid, treatment_name text, dentist_name text, treatment_date timestamp with time zone, status text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.id as treatment_id,
    dt.treatment_name,
    d.name as dentist_name,
    dt.treatment_date,
    dt.treatment_status as status
  FROM dental_treatments dt
  LEFT JOIN doctor_attributions da ON dt.id = da.treatment_id
  LEFT JOIN dentists d ON da.doctor_id = d.id
  WHERE (p_patient_id IS NULL OR dt.patient_id = p_patient_id)
    AND (p_clinic_id IS NULL OR dt.clinic_id = p_clinic_id)
  ORDER BY dt.treatment_date DESC;
END;
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(p_user_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'user');
END;
$$;


--
-- Name: is_feature_enabled(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_feature_enabled(p_feature_name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: is_user_locked_out(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_user_locked_out(user_email text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  failed_attempts INTEGER;
  lockout_duration INTERVAL;
BEGIN
  -- Get lockout duration from settings
  SELECT (settings->>'lockout_duration_minutes')::INTEGER * INTERVAL '1 minute'
  INTO lockout_duration
  FROM system_settings
  WHERE setting_type = 'security_config';
  
  -- Count recent failed attempts
  SELECT COUNT(*)
  INTO failed_attempts
  FROM login_attempts
  WHERE email = user_email
    AND success = FALSE
    AND attempt_time > NOW() - lockout_duration;
  
  -- Check if user is locked out
  RETURN failed_attempts >= 5;
END;
$$;


--
-- Name: log_captcha_attempt(text, text, integer, text, text, text, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_captcha_attempt(p_email text DEFAULT NULL::text, p_attempt_type text DEFAULT 'unknown'::text, p_failed_attempts_count integer DEFAULT 0, p_captcha_question text DEFAULT NULL::text, p_captcha_answer text DEFAULT NULL::text, p_user_answer text DEFAULT NULL::text, p_is_successful boolean DEFAULT false) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO captcha_attempts (
    email,
    ip_address,
    user_agent,
    attempt_type,
    failed_attempts_count,
    captcha_question,
    captcha_answer,
    user_answer,
    is_successful
  ) VALUES (
    p_email,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    p_attempt_type,
    p_failed_attempts_count,
    p_captcha_question,
    p_captcha_answer,
    p_user_answer,
    p_is_successful
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;


--
-- Name: log_login_attempt(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_login_attempt() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Log the login attempt
  INSERT INTO login_attempts (
    email,
    ip_address,
    success,
    user_agent
  ) VALUES (
    NEW.email,
    inet_client_addr(),
    NEW.success,
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: log_security_event(text, text, jsonb); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_security_event(event_type text, user_email text DEFAULT NULL::text, details jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_email,
    ip_address,
    user_agent,
    details
  ) VALUES (
    event_type,
    user_email,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent',
    details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;


--
-- Name: log_system_change(text, text, text, jsonb, jsonb, text, inet, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.log_system_change(p_action text, p_entity_type text, p_entity_id text DEFAULT NULL::text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_user_id text DEFAULT NULL::text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: migrate_appointments_to_patients(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.migrate_appointments_to_patients() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    appointment_record RECORD;
    v_patient_id UUID;
    migrated_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting appointment migration...';
    
    FOR appointment_record IN 
        SELECT a.id, a.clinic_id, a.name, a.phone, a.email
        FROM appointments a
        WHERE a.patient_id IS NULL
    LOOP
        BEGIN
            -- Find or create patient for this appointment
            v_patient_id := find_or_create_patient(
                appointment_record.name,
                appointment_record.phone,
                appointment_record.email,
                appointment_record.clinic_id
            );
            
            -- Update appointment with patient_id
            UPDATE appointments 
            SET patient_id = v_patient_id
            WHERE id = appointment_record.id;
            
            migrated_count := migrated_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            RAISE NOTICE 'Error migrating appointment %: %', appointment_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Migration completed. Migrated: %, Errors: %', migrated_count, error_count;
END;
$$;


--
-- Name: update_feature_toggle(text, boolean, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_feature_toggle(p_feature_name text, p_enabled boolean, p_user_id text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
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


--
-- Name: update_follow_ups_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_follow_ups_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_lab_work_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_lab_work_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_payment_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payment_status() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Calculate payment status based on paid_amount vs total_amount
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status = 'Completed';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.payment_status = 'Partial';
  ELSE
    NEW.payment_status = 'Pending';
  END IF;
  
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$;


--
-- Name: update_payment_status_on_transaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_payment_status_on_transaction() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Update payment status based on transaction
  UPDATE treatment_payments 
  SET payment_status = NEW.status,
      updated_at = NOW()
  WHERE id = NEW.payment_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_system_settings_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_system_settings_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_treatment_payment_on_transaction(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_treatment_payment_on_transaction() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  current_paid_amount DECIMAL(10,2);
  new_paid_amount DECIMAL(10,2);
  treatment_total_amount DECIMAL(10,2);
BEGIN
  -- Get current paid amount and total amount
  SELECT paid_amount, total_amount INTO current_paid_amount, treatment_total_amount
  FROM treatment_payments 
  WHERE id = NEW.treatment_payment_id;
  
  -- Calculate new paid amount
  new_paid_amount := current_paid_amount + NEW.amount;
  
  -- Update treatment payment with new paid amount and recalculate remaining
  UPDATE treatment_payments 
  SET 
    paid_amount = new_paid_amount,
    remaining_amount = GREATEST(0, treatment_total_amount - new_paid_amount), -- Ensure remaining_amount >= 0
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_treatment_payment_remaining(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_treatment_payment_remaining() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- Update the remaining amount in treatment_payments
  UPDATE treatment_payments
  SET 
    paid_amount = (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment_transactions
      WHERE treatment_payment_id = NEW.treatment_payment_id
    ),
    remaining_amount = total_amount - (
      SELECT COALESCE(SUM(amount), 0)
      FROM payment_transactions
      WHERE treatment_payment_id = NEW.treatment_payment_id
    ),
    payment_status = CASE
      WHEN total_amount = 0 THEN 'completed'
      WHEN total_amount <= (
        SELECT COALESCE(SUM(amount), 0)
        FROM payment_transactions
        WHERE treatment_payment_id = NEW.treatment_payment_id
      ) THEN 'completed'
      WHEN (
        SELECT COALESCE(SUM(amount), 0)
        FROM payment_transactions
        WHERE treatment_payment_id = NEW.treatment_payment_id
      ) > 0 THEN 'partial'
      ELSE 'pending'
    END,
    updated_at = NOW()
  WHERE id = NEW.treatment_payment_id;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_treatment_status(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_treatment_status(p_treatment_id uuid, p_status text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  UPDATE dental_treatments 
  SET treatment_status = p_status,
      updated_at = NOW()
  WHERE id = p_treatment_id;
  
  RETURN FOUND;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    cache_key character varying(255) NOT NULL,
    cache_data jsonb NOT NULL,
    cache_date date NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.appointments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(20) NOT NULL,
    email character varying(255) NOT NULL,
    date date NOT NULL,
    "time" character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'Confirmed'::character varying NOT NULL,
    original_date date,
    original_time character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    patient_id uuid,
    reminder_sent boolean DEFAULT false,
    dentist_id uuid,
    CONSTRAINT appointments_status_check CHECK (((status)::text = ANY ((ARRAY['Confirmed'::character varying, 'Cancelled'::character varying, 'Completed'::character varying, 'Rescheduled'::character varying])::text[])))
);


--
-- Name: captcha_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.captcha_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    ip_address inet,
    user_agent text,
    attempt_type text NOT NULL,
    failed_attempts_count integer DEFAULT 0,
    captcha_question text,
    captcha_answer text,
    user_answer text,
    is_successful boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: clinics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clinics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(100) NOT NULL,
    domain character varying(255),
    logo_url character varying(500),
    contact_phone character varying(20),
    contact_email character varying(255),
    address text,
    working_hours jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dentist_phone character varying(20)
);


--
-- Name: dental_charts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dental_charts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_name character varying(255) NOT NULL,
    patient_phone character varying(20) NOT NULL,
    patient_email character varying(255),
    images jsonb DEFAULT '[]'::jsonb,
    notes text,
    treatment_plan text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE dental_charts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.dental_charts IS 'Stores dental charts with images for each patient';


--
-- Name: COLUMN dental_charts.images; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.dental_charts.images IS 'JSONB array of uploaded images with metadata';


--
-- Name: dental_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dental_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    appointment_id uuid,
    note_type character varying(50) DEFAULT 'General'::character varying,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    priority character varying(20) DEFAULT 'Normal'::character varying,
    is_private boolean DEFAULT false,
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT dental_notes_note_type_check CHECK (((note_type)::text = ANY ((ARRAY['General'::character varying, 'Examination'::character varying, 'Treatment'::character varying, 'Follow-up'::character varying, 'Emergency'::character varying])::text[]))),
    CONSTRAINT dental_notes_priority_check CHECK (((priority)::text = ANY ((ARRAY['Low'::character varying, 'Normal'::character varying, 'High'::character varying, 'Urgent'::character varying])::text[])))
);


--
-- Name: dental_treatments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dental_treatments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    appointment_id uuid,
    tooth_number character varying(10) NOT NULL,
    tooth_position character varying(20) NOT NULL,
    treatment_type character varying(100) NOT NULL,
    treatment_description text,
    treatment_status character varying(50) DEFAULT 'Planned'::character varying,
    treatment_date date,
    cost numeric(10,2),
    notes text,
    created_by character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    dentist_id uuid,
    started_by_dentist_id uuid,
    completed_by_dentist_id uuid,
    dentist_change_notes text,
    numbering_system text DEFAULT 'universal'::text,
    CONSTRAINT dental_treatments_numbering_system_check CHECK ((numbering_system = ANY (ARRAY['universal'::text, 'fdi'::text]))),
    CONSTRAINT dental_treatments_treatment_status_check CHECK (((treatment_status)::text = ANY ((ARRAY['Planned'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


--
-- Name: dentists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dentists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    specialization character varying(255),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: disabled_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.disabled_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE disabled_slots; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.disabled_slots IS 'Stores temporarily disabled time slots for clinics (e.g., personal appointments, meetings)';


--
-- Name: COLUMN disabled_slots.date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.disabled_slots.date IS 'The date when the slot is disabled';


--
-- Name: COLUMN disabled_slots.start_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.disabled_slots.start_time IS 'Start time of the disabled slot';


--
-- Name: COLUMN disabled_slots.end_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.disabled_slots.end_time IS 'End time of the disabled slot';


--
-- Name: doctor_attributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.doctor_attributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treatment_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    doctor_id uuid NOT NULL,
    attribution_type public.doctor_attribution_type NOT NULL,
    attribution_percentage numeric(5,2) DEFAULT 100.00,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT doctor_attributions_attribution_percentage_check CHECK (((attribution_percentage >= (0)::numeric) AND (attribution_percentage <= (100)::numeric)))
);


--
-- Name: follow_ups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.follow_ups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    reason character varying(255) DEFAULT 'General follow-up'::character varying NOT NULL,
    notes text,
    status character varying(50) DEFAULT 'Pending'::character varying,
    priority character varying(20) DEFAULT 'Normal'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by character varying(100),
    due_date date,
    completed_at timestamp with time zone,
    completed_by character varying(100),
    CONSTRAINT follow_ups_priority_check CHECK (((priority)::text = ANY ((ARRAY['Low'::character varying, 'Normal'::character varying, 'High'::character varying, 'Urgent'::character varying])::text[]))),
    CONSTRAINT follow_ups_status_check CHECK (((status)::text = ANY ((ARRAY['Pending'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying])::text[])))
);


--
-- Name: lab_work; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_work (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    appointment_id uuid,
    lab_name text NOT NULL,
    work_type text NOT NULL,
    description text,
    status text DEFAULT 'Ordered'::text NOT NULL,
    order_date date DEFAULT CURRENT_DATE NOT NULL,
    expected_completion_date date,
    actual_completion_date date,
    cost numeric(10,2),
    notes text,
    created_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lab_work_status_check CHECK ((status = ANY (ARRAY['Ordered'::text, 'In Progress'::text, 'Quality Check'::text, 'Ready for Pickup'::text, 'Patient Notified'::text, 'Completed'::text, 'Cancelled'::text, 'Delayed'::text])))
);


--
-- Name: lab_work_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_work_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    action character varying(100) NOT NULL,
    action_date timestamp with time zone DEFAULT now(),
    action_by character varying(255) NOT NULL,
    notes text
);


--
-- Name: lab_work_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_work_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    order_number character varying(50) NOT NULL,
    lab_type character varying(100) NOT NULL,
    test_name character varying(255) NOT NULL,
    description text,
    ordered_date date DEFAULT CURRENT_DATE NOT NULL,
    expected_date date,
    status character varying(50) DEFAULT 'Ordered'::character varying NOT NULL,
    ordered_by character varying(255),
    lab_facility character varying(255),
    cost numeric(10,2),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lab_work_orders_status_check CHECK (((status)::text = ANY ((ARRAY['Ordered'::character varying, 'In Progress'::character varying, 'Completed'::character varying, 'Cancelled'::character varying, 'Delayed'::character varying])::text[])))
);


--
-- Name: lab_work_results; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lab_work_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    result_date date DEFAULT CURRENT_DATE NOT NULL,
    result_summary text,
    normal_range character varying(255),
    actual_value character varying(255),
    interpretation text,
    file_url character varying(500),
    reported_by character varying(255),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    ip_address inet NOT NULL,
    success boolean NOT NULL,
    attempt_time timestamp with time zone DEFAULT now(),
    user_agent text
);


--
-- Name: medical_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.medical_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    record_type character varying(100) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    file_url character varying(500),
    record_date date NOT NULL,
    created_by character varying(100),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_auth; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_auth (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    phone character varying(20) NOT NULL,
    otp_code character varying(6),
    otp_expires_at timestamp with time zone,
    last_login timestamp with time zone,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: patient_phones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_phones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    patient_id uuid NOT NULL,
    phone character varying(20) NOT NULL,
    phone_type character varying(20) DEFAULT 'primary'::character varying,
    is_primary boolean DEFAULT false,
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT patient_phones_phone_type_check CHECK (((phone_type)::text = ANY ((ARRAY['primary'::character varying, 'secondary'::character varying, 'emergency'::character varying, 'family'::character varying])::text[])))
);


--
-- Name: patient_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patient_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_name character varying(255) NOT NULL,
    patient_phone character varying(20) NOT NULL,
    patient_email character varying(255),
    images jsonb DEFAULT '[]'::jsonb,
    notes text,
    record_type character varying(50) DEFAULT 'general'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: TABLE patient_records; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.patient_records IS 'Stores patient records with images and notes';


--
-- Name: COLUMN patient_records.images; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.patient_records.images IS 'JSONB array of images attached to patient records';


--
-- Name: patients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100),
    email character varying(255),
    phone character varying(20) NOT NULL,
    date_of_birth date,
    gender character varying(10),
    address text,
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(20),
    medical_history jsonb DEFAULT '{}'::jsonb,
    allergies text[] DEFAULT '{}'::text[],
    current_medications text[] DEFAULT '{}'::text[],
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: payment_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treatment_payment_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    payment_method character varying(50) DEFAULT 'Cash'::character varying NOT NULL,
    payment_date date DEFAULT CURRENT_DATE NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT payment_transactions_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT payment_transactions_payment_method_check CHECK (((payment_method)::text = ANY ((ARRAY['Cash'::character varying, 'UPI'::character varying, 'Card'::character varying, 'Bank Transfer'::character varying, 'Cheque'::character varying, 'Other'::character varying])::text[])))
);


--
-- Name: prescription_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescription_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prescription_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    action_date timestamp with time zone DEFAULT now(),
    action_by character varying(255) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT prescription_history_action_check CHECK (((action)::text = ANY ((ARRAY['Created'::character varying, 'Updated'::character varying, 'Refilled'::character varying, 'Discontinued'::character varying, 'Completed'::character varying])::text[])))
);


--
-- Name: prescriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    medication_name character varying(255) NOT NULL,
    dosage character varying(100) NOT NULL,
    frequency character varying(100) NOT NULL,
    duration character varying(100) NOT NULL,
    instructions text,
    prescribed_date date DEFAULT CURRENT_DATE NOT NULL,
    prescribed_by character varying(255),
    status character varying(20) DEFAULT 'Active'::character varying,
    refills_remaining integer DEFAULT 0,
    refill_quantity integer DEFAULT 0,
    pharmacy_notes text,
    patient_notes text,
    side_effects text,
    interactions text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT prescriptions_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Completed'::character varying, 'Discontinued'::character varying])::text[])))
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    subscription jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: scheduling_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scheduling_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    day_schedules jsonb DEFAULT '{}'::jsonb NOT NULL,
    weekly_holidays integer[] DEFAULT '{}'::integer[],
    custom_holidays date[] DEFAULT '{}'::date[],
    disabled_appointments boolean DEFAULT false,
    disable_until_date date,
    disable_until_time time without time zone,
    disabled_slots text[] DEFAULT '{}'::text[],
    show_stats_cards boolean DEFAULT true,
    notification_settings jsonb DEFAULT '{"auto_confirm": true, "reminder_hours": 24, "email_notifications": true}'::jsonb NOT NULL,
    minimum_advance_notice integer DEFAULT 24,
    dental_numbering_system character varying(20) DEFAULT 'universal'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: security_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type text NOT NULL,
    user_id uuid,
    user_email text,
    ip_address inet,
    user_agent text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: staff_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    can_access_settings boolean DEFAULT false,
    can_access_patient_portal boolean DEFAULT false,
    can_access_payment_analytics boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: storage_usage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.storage_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    total_size_bytes bigint DEFAULT 0,
    total_images integer DEFAULT 0,
    last_updated timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: TABLE storage_usage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.storage_usage IS 'Tracks Cloudinary storage usage for the clinic';


--
-- Name: system_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    old_values jsonb,
    new_values jsonb,
    user_id text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_type character varying(50) NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: tooth_conditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tooth_conditions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    tooth_number character varying(10) NOT NULL,
    tooth_position character varying(20) NOT NULL,
    condition_type character varying(100) NOT NULL,
    condition_description text,
    severity character varying(20) DEFAULT 'Mild'::character varying,
    last_updated date DEFAULT CURRENT_DATE,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    numbering_system text DEFAULT 'universal'::text,
    CONSTRAINT tooth_conditions_numbering_system_check CHECK ((numbering_system = ANY (ARRAY['universal'::text, 'fdi'::text]))),
    CONSTRAINT tooth_conditions_severity_check CHECK (((severity)::text = ANY ((ARRAY['Mild'::character varying, 'Moderate'::character varying, 'Severe'::character varying])::text[])))
);


--
-- Name: tooth_images; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tooth_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    tooth_number character varying(2) NOT NULL,
    image_type character varying(20) NOT NULL,
    description text,
    cloudinary_url text NOT NULL,
    cloudinary_public_id text NOT NULL,
    file_size_bytes bigint NOT NULL,
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    numbering_system text DEFAULT 'universal'::text,
    image_url text,
    CONSTRAINT tooth_images_image_type_check CHECK (((image_type)::text = ANY ((ARRAY['xray'::character varying, 'photo'::character varying, 'scan'::character varying])::text[]))),
    CONSTRAINT tooth_images_numbering_system_check CHECK ((numbering_system = ANY (ARRAY['universal'::text, 'fdi'::text])))
);


--
-- Name: TABLE tooth_images; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.tooth_images IS 'Stores metadata for dental images (X-rays, photos, scans) associated with specific teeth';


--
-- Name: COLUMN tooth_images.tooth_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tooth_images.tooth_number IS 'Universal tooth numbering system (01-32)';


--
-- Name: COLUMN tooth_images.image_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tooth_images.image_type IS 'Type of dental image: xray, photo, or scan';


--
-- Name: COLUMN tooth_images.cloudinary_url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tooth_images.cloudinary_url IS 'CDN URL for the image from Cloudinary';


--
-- Name: COLUMN tooth_images.cloudinary_public_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tooth_images.cloudinary_public_id IS 'Cloudinary public ID for image management';


--
-- Name: COLUMN tooth_images.file_size_bytes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tooth_images.file_size_bytes IS 'Original file size in bytes for storage tracking';


--
-- Name: treatment_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    treatment_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0.00,
    remaining_amount numeric(10,2) DEFAULT 0.00,
    payment_status public.payment_status DEFAULT 'Pending'::public.payment_status,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT treatment_payments_paid_amount_check CHECK ((paid_amount >= (0)::numeric)),
    CONSTRAINT treatment_payments_remaining_amount_check CHECK ((remaining_amount >= (0)::numeric)),
    CONSTRAINT treatment_payments_total_amount_check CHECK ((total_amount > (0)::numeric))
);


--
-- Name: treatment_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    treatment_name character varying(255) NOT NULL,
    treatment_description text,
    treatment_type character varying(100),
    status character varying(50) DEFAULT 'Active'::character varying,
    start_date date,
    end_date date,
    cost numeric(10,2),
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    total_cost numeric(10,2) DEFAULT 0.00,
    amount_paid numeric(10,2) DEFAULT 0.00,
    payment_status character varying(50) DEFAULT 'Unpaid'::character varying,
    payment_method character varying(100),
    payment_notes text,
    CONSTRAINT treatment_plans_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['Unpaid'::character varying, 'Partial'::character varying, 'Paid'::character varying, 'Overpaid'::character varying])::text[]))),
    CONSTRAINT treatment_plans_status_check CHECK (((status)::text = ANY ((ARRAY['Active'::character varying, 'Completed'::character varying, 'Cancelled'::character varying, 'On Hold'::character varying])::text[])))
);


--
-- Name: treatment_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.treatment_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    clinic_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    default_cost numeric(10,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: treatments_with_dentist; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.treatments_with_dentist WITH (security_invoker='true') AS
 SELECT dt.id,
    dt.treatment_type,
    dt.tooth_number,
    dt.treatment_description AS description,
    dt.cost,
    dt.treatment_status AS status,
    dt.treatment_date,
    d.name AS dentist_name,
    concat(p.first_name, ' ', COALESCE(p.last_name, ''::character varying)) AS patient_name,
    dt.created_at,
    dt.clinic_id
   FROM ((public.dental_treatments dt
     LEFT JOIN public.dentists d ON ((dt.dentist_id = d.id)))
     LEFT JOIN public.patients p ON ((dt.patient_id = p.id)));


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_roles_role_check CHECK (((role)::text = ANY ((ARRAY['dentist'::character varying, 'staff'::character varying])::text[])))
);


--
-- Name: TABLE user_roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_roles IS 'Stores user roles (dentist/staff) for each clinic';


--
-- Name: analytics_cache analytics_cache_clinic_id_cache_key_cache_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_cache
    ADD CONSTRAINT analytics_cache_clinic_id_cache_key_cache_date_key UNIQUE (clinic_id, cache_key, cache_date);


--
-- Name: analytics_cache analytics_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_cache
    ADD CONSTRAINT analytics_cache_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: captcha_attempts captcha_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.captcha_attempts
    ADD CONSTRAINT captcha_attempts_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_pkey PRIMARY KEY (id);


--
-- Name: clinics clinics_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clinics
    ADD CONSTRAINT clinics_slug_key UNIQUE (slug);


--
-- Name: dental_charts dental_charts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_charts
    ADD CONSTRAINT dental_charts_pkey PRIMARY KEY (id);


--
-- Name: dental_notes dental_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_notes
    ADD CONSTRAINT dental_notes_pkey PRIMARY KEY (id);


--
-- Name: dental_treatments dental_treatments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_treatments
    ADD CONSTRAINT dental_treatments_pkey PRIMARY KEY (id);


--
-- Name: dentists dentists_clinic_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dentists
    ADD CONSTRAINT dentists_clinic_id_name_key UNIQUE (clinic_id, name);


--
-- Name: dentists dentists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dentists
    ADD CONSTRAINT dentists_pkey PRIMARY KEY (id);


--
-- Name: disabled_slots disabled_slots_clinic_id_date_start_time_end_time_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disabled_slots
    ADD CONSTRAINT disabled_slots_clinic_id_date_start_time_end_time_key UNIQUE (clinic_id, date, start_time, end_time);


--
-- Name: disabled_slots disabled_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disabled_slots
    ADD CONSTRAINT disabled_slots_pkey PRIMARY KEY (id);


--
-- Name: doctor_attributions doctor_attributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_attributions
    ADD CONSTRAINT doctor_attributions_pkey PRIMARY KEY (id);


--
-- Name: follow_ups follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_pkey PRIMARY KEY (id);


--
-- Name: lab_work_history lab_work_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_history
    ADD CONSTRAINT lab_work_history_pkey PRIMARY KEY (id);


--
-- Name: lab_work_orders lab_work_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_orders
    ADD CONSTRAINT lab_work_orders_order_number_key UNIQUE (order_number);


--
-- Name: lab_work_orders lab_work_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_orders
    ADD CONSTRAINT lab_work_orders_pkey PRIMARY KEY (id);


--
-- Name: lab_work lab_work_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work
    ADD CONSTRAINT lab_work_pkey PRIMARY KEY (id);


--
-- Name: lab_work_results lab_work_results_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_results
    ADD CONSTRAINT lab_work_results_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: medical_records medical_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_pkey PRIMARY KEY (id);


--
-- Name: patient_auth patient_auth_clinic_id_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_auth
    ADD CONSTRAINT patient_auth_clinic_id_phone_key UNIQUE (clinic_id, phone);


--
-- Name: patient_auth patient_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_auth
    ADD CONSTRAINT patient_auth_pkey PRIMARY KEY (id);


--
-- Name: patient_phones patient_phones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_phones
    ADD CONSTRAINT patient_phones_pkey PRIMARY KEY (id);


--
-- Name: patient_records patient_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_records
    ADD CONSTRAINT patient_records_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: payment_transactions payment_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_pkey PRIMARY KEY (id);


--
-- Name: prescription_history prescription_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_history
    ADD CONSTRAINT prescription_history_pkey PRIMARY KEY (id);


--
-- Name: prescriptions prescriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: scheduling_settings scheduling_settings_clinic_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_settings
    ADD CONSTRAINT scheduling_settings_clinic_id_key UNIQUE (clinic_id);


--
-- Name: scheduling_settings scheduling_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_settings
    ADD CONSTRAINT scheduling_settings_pkey PRIMARY KEY (id);


--
-- Name: security_audit_log security_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_audit_log
    ADD CONSTRAINT security_audit_log_pkey PRIMARY KEY (id);


--
-- Name: staff_permissions staff_permissions_clinic_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_permissions
    ADD CONSTRAINT staff_permissions_clinic_id_key UNIQUE (clinic_id);


--
-- Name: staff_permissions staff_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_permissions
    ADD CONSTRAINT staff_permissions_pkey PRIMARY KEY (id);


--
-- Name: storage_usage storage_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.storage_usage
    ADD CONSTRAINT storage_usage_pkey PRIMARY KEY (id);


--
-- Name: system_audit_log system_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_audit_log
    ADD CONSTRAINT system_audit_log_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tooth_conditions tooth_conditions_clinic_id_patient_id_tooth_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tooth_conditions
    ADD CONSTRAINT tooth_conditions_clinic_id_patient_id_tooth_number_key UNIQUE (clinic_id, patient_id, tooth_number);


--
-- Name: tooth_conditions tooth_conditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tooth_conditions
    ADD CONSTRAINT tooth_conditions_pkey PRIMARY KEY (id);


--
-- Name: tooth_images tooth_images_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tooth_images
    ADD CONSTRAINT tooth_images_pkey PRIMARY KEY (id);


--
-- Name: treatment_payments treatment_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_payments
    ADD CONSTRAINT treatment_payments_pkey PRIMARY KEY (id);


--
-- Name: treatment_plans treatment_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_pkey PRIMARY KEY (id);


--
-- Name: treatment_types treatment_types_clinic_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_types
    ADD CONSTRAINT treatment_types_clinic_id_name_key UNIQUE (clinic_id, name);


--
-- Name: treatment_types treatment_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_types
    ADD CONSTRAINT treatment_types_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_clinic_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_clinic_id_key UNIQUE (user_id, clinic_id);


--
-- Name: idx_appointments_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_clinic_id ON public.appointments USING btree (clinic_id);


--
-- Name: idx_appointments_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_created_at ON public.appointments USING btree (created_at);


--
-- Name: idx_appointments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_date ON public.appointments USING btree (date);


--
-- Name: idx_appointments_dentist_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_dentist_id ON public.appointments USING btree (dentist_id);


--
-- Name: idx_appointments_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_patient_id ON public.appointments USING btree (patient_id);


--
-- Name: idx_appointments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);


--
-- Name: idx_captcha_attempts_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_captcha_attempts_created_at ON public.captcha_attempts USING btree (created_at);


--
-- Name: idx_dental_charts_clinic_id_fk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_charts_clinic_id_fk ON public.dental_charts USING btree (clinic_id);


--
-- Name: idx_dental_notes_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_notes_appointment ON public.dental_notes USING btree (appointment_id);


--
-- Name: idx_dental_notes_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_notes_clinic_id ON public.dental_notes USING btree (clinic_id);


--
-- Name: idx_dental_notes_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_notes_patient ON public.dental_notes USING btree (patient_id);


--
-- Name: idx_dental_treatments_appointment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_appointment ON public.dental_treatments USING btree (appointment_id);


--
-- Name: idx_dental_treatments_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_clinic_id ON public.dental_treatments USING btree (clinic_id);


--
-- Name: idx_dental_treatments_completed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_completed_by ON public.dental_treatments USING btree (completed_by_dentist_id);


--
-- Name: idx_dental_treatments_dentist_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_dentist_id ON public.dental_treatments USING btree (dentist_id);


--
-- Name: idx_dental_treatments_numbering_system; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_numbering_system ON public.dental_treatments USING btree (numbering_system);


--
-- Name: idx_dental_treatments_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_patient_id ON public.dental_treatments USING btree (patient_id);


--
-- Name: idx_dental_treatments_started_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_started_by ON public.dental_treatments USING btree (started_by_dentist_id);


--
-- Name: idx_dental_treatments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dental_treatments_status ON public.dental_treatments USING btree (treatment_status);


--
-- Name: idx_dentists_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_dentists_clinic_id ON public.dentists USING btree (clinic_id);


--
-- Name: idx_disabled_slots_clinic_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_disabled_slots_clinic_date ON public.disabled_slots USING btree (clinic_id, date);


--
-- Name: idx_doctor_attributions_clinic_id_fk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_attributions_clinic_id_fk ON public.doctor_attributions USING btree (clinic_id);


--
-- Name: idx_doctor_attributions_doctor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_attributions_doctor_id ON public.doctor_attributions USING btree (doctor_id);


--
-- Name: idx_doctor_attributions_treatment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_attributions_treatment_id ON public.doctor_attributions USING btree (treatment_id);


--
-- Name: idx_doctor_attributions_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doctor_attributions_type ON public.doctor_attributions USING btree (attribution_type);


--
-- Name: idx_follow_ups_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follow_ups_clinic_id ON public.follow_ups USING btree (clinic_id);


--
-- Name: idx_follow_ups_patient_id_fk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_follow_ups_patient_id_fk ON public.follow_ups USING btree (patient_id);


--
-- Name: idx_lab_work_appointment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_appointment_id ON public.lab_work USING btree (appointment_id);


--
-- Name: idx_lab_work_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_clinic_id ON public.lab_work USING btree (clinic_id);


--
-- Name: idx_lab_work_history_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_history_order_id ON public.lab_work_history USING btree (order_id);


--
-- Name: idx_lab_work_orders_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_orders_clinic_id ON public.lab_work_orders USING btree (clinic_id);


--
-- Name: idx_lab_work_orders_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_orders_patient_id ON public.lab_work_orders USING btree (patient_id);


--
-- Name: idx_lab_work_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_patient_id ON public.lab_work USING btree (patient_id);


--
-- Name: idx_lab_work_results_order_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lab_work_results_order_id ON public.lab_work_results USING btree (order_id);


--
-- Name: idx_medical_records_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_records_clinic_id ON public.medical_records USING btree (clinic_id);


--
-- Name: idx_medical_records_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_medical_records_patient ON public.medical_records USING btree (patient_id);


--
-- Name: idx_patient_auth_clinic_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_auth_clinic_phone ON public.patient_auth USING btree (clinic_id, phone);


--
-- Name: idx_patient_auth_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_auth_patient_id ON public.patient_auth USING btree (patient_id);


--
-- Name: idx_patient_phones_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_phones_patient_id ON public.patient_phones USING btree (patient_id);


--
-- Name: idx_patient_phones_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_phones_phone ON public.patient_phones USING btree (phone);


--
-- Name: idx_patient_records_clinic_id_fk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patient_records_clinic_id_fk ON public.patient_records USING btree (clinic_id);


--
-- Name: idx_patients_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_clinic_id ON public.patients USING btree (clinic_id);


--
-- Name: idx_patients_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_name ON public.patients USING btree (first_name, last_name);


--
-- Name: idx_patients_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patients_phone ON public.patients USING btree (phone);


--
-- Name: idx_payment_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_date ON public.payment_transactions USING btree (payment_date);


--
-- Name: idx_payment_transactions_payment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_payment_id ON public.payment_transactions USING btree (treatment_payment_id);


--
-- Name: idx_payment_transactions_payment_method; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payment_transactions_payment_method ON public.payment_transactions USING btree (payment_method);


--
-- Name: idx_prescription_history_prescription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescription_history_prescription_id ON public.prescription_history USING btree (prescription_id);


--
-- Name: idx_prescriptions_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_clinic_id ON public.prescriptions USING btree (clinic_id);


--
-- Name: idx_prescriptions_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions USING btree (patient_id);


--
-- Name: idx_prescriptions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prescriptions_status ON public.prescriptions USING btree (status);


--
-- Name: idx_push_subscriptions_clinic_id_fk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_push_subscriptions_clinic_id_fk ON public.push_subscriptions USING btree (clinic_id);


--
-- Name: idx_scheduling_settings_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scheduling_settings_clinic_id ON public.scheduling_settings USING btree (clinic_id);


--
-- Name: idx_staff_permissions_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_staff_permissions_clinic_id ON public.staff_permissions USING btree (clinic_id);


--
-- Name: idx_system_audit_log_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_audit_log_entity ON public.system_audit_log USING btree (entity_type, entity_id);


--
-- Name: idx_system_settings_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_settings_key ON public.system_settings USING btree (setting_key);


--
-- Name: idx_system_settings_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_system_settings_type ON public.system_settings USING btree (setting_type);


--
-- Name: idx_tooth_conditions_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tooth_conditions_patient ON public.tooth_conditions USING btree (patient_id);


--
-- Name: idx_tooth_images_clinic_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tooth_images_clinic_patient ON public.tooth_images USING btree (clinic_id, patient_id);


--
-- Name: idx_tooth_images_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tooth_images_patient_id ON public.tooth_images USING btree (patient_id);


--
-- Name: idx_tooth_images_tooth_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tooth_images_tooth_number ON public.tooth_images USING btree (tooth_number);


--
-- Name: idx_tooth_images_uploaded_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tooth_images_uploaded_at ON public.tooth_images USING btree (uploaded_at);


--
-- Name: idx_treatment_payments_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_payments_clinic_id ON public.treatment_payments USING btree (clinic_id);


--
-- Name: idx_treatment_payments_patient_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_payments_patient_id ON public.treatment_payments USING btree (patient_id);


--
-- Name: idx_treatment_payments_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_payments_status ON public.treatment_payments USING btree (payment_status);


--
-- Name: idx_treatment_payments_treatment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_payments_treatment_id ON public.treatment_payments USING btree (treatment_id);


--
-- Name: idx_treatment_plans_clinic_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_plans_clinic_id ON public.treatment_plans USING btree (clinic_id);


--
-- Name: idx_treatment_plans_patient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treatment_plans_patient ON public.treatment_plans USING btree (patient_id);


--
-- Name: idx_user_roles_clinic_id_fk; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_clinic_id_fk ON public.user_roles USING btree (clinic_id);


--
-- Name: dental_treatments auto_create_payment_record_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_create_payment_record_trigger AFTER INSERT ON public.dental_treatments FOR EACH ROW EXECUTE FUNCTION public.auto_create_payment_record();


--
-- Name: dental_treatments auto_create_payment_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_create_payment_trigger AFTER INSERT ON public.dental_treatments FOR EACH ROW EXECUTE FUNCTION public.auto_create_treatment_payment();


--
-- Name: appointments auto_link_appointment_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER auto_link_appointment_trigger BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.auto_link_appointment_with_patient();


--
-- Name: lab_work_orders trigger_update_lab_work_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_lab_work_orders_updated_at BEFORE UPDATE ON public.lab_work_orders FOR EACH ROW EXECUTE FUNCTION public.update_lab_work_updated_at();


--
-- Name: lab_work_results trigger_update_lab_work_results_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_lab_work_results_updated_at BEFORE UPDATE ON public.lab_work_results FOR EACH ROW EXECUTE FUNCTION public.update_lab_work_updated_at();


--
-- Name: lab_work trigger_update_lab_work_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_lab_work_updated_at BEFORE UPDATE ON public.lab_work FOR EACH ROW EXECUTE FUNCTION public.update_lab_work_updated_at();


--
-- Name: patient_phones update_patient_phones_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patient_phones_updated_at BEFORE UPDATE ON public.patient_phones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patients update_patients_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduling_settings update_scheduling_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scheduling_settings_updated_at BEFORE UPDATE ON public.scheduling_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: staff_permissions update_staff_permissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_staff_permissions_updated_at BEFORE UPDATE ON public.staff_permissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_settings update_system_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tooth_images update_tooth_images_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tooth_images_updated_at BEFORE UPDATE ON public.tooth_images FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: payment_transactions update_treatment_payment_on_transaction_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_treatment_payment_on_transaction_trigger AFTER INSERT ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION public.update_treatment_payment_on_transaction();


--
-- Name: treatment_payments update_treatment_payment_status; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_treatment_payment_status BEFORE UPDATE ON public.treatment_payments FOR EACH ROW EXECUTE FUNCTION public.update_payment_status();


--
-- Name: analytics_cache analytics_cache_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_cache
    ADD CONSTRAINT analytics_cache_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_dentist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_dentist_id_fkey FOREIGN KEY (dentist_id) REFERENCES public.dentists(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE SET NULL;


--
-- Name: dental_charts dental_charts_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_charts
    ADD CONSTRAINT dental_charts_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: dental_notes dental_notes_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_notes
    ADD CONSTRAINT dental_notes_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: dental_notes dental_notes_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_notes
    ADD CONSTRAINT dental_notes_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: dental_notes dental_notes_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_notes
    ADD CONSTRAINT dental_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: dental_treatments dental_treatments_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_treatments
    ADD CONSTRAINT dental_treatments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: dental_treatments dental_treatments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_treatments
    ADD CONSTRAINT dental_treatments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: dental_treatments dental_treatments_completed_by_dentist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_treatments
    ADD CONSTRAINT dental_treatments_completed_by_dentist_id_fkey FOREIGN KEY (completed_by_dentist_id) REFERENCES public.dentists(id) ON DELETE SET NULL;


--
-- Name: dental_treatments dental_treatments_dentist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_treatments
    ADD CONSTRAINT dental_treatments_dentist_id_fkey FOREIGN KEY (dentist_id) REFERENCES public.dentists(id) ON DELETE SET NULL;


--
-- Name: dental_treatments dental_treatments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_treatments
    ADD CONSTRAINT dental_treatments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: dental_treatments dental_treatments_started_by_dentist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dental_treatments
    ADD CONSTRAINT dental_treatments_started_by_dentist_id_fkey FOREIGN KEY (started_by_dentist_id) REFERENCES public.dentists(id) ON DELETE SET NULL;


--
-- Name: dentists dentists_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dentists
    ADD CONSTRAINT dentists_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: disabled_slots disabled_slots_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.disabled_slots
    ADD CONSTRAINT disabled_slots_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: doctor_attributions doctor_attributions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_attributions
    ADD CONSTRAINT doctor_attributions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: doctor_attributions doctor_attributions_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_attributions
    ADD CONSTRAINT doctor_attributions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.dentists(id) ON DELETE CASCADE;


--
-- Name: doctor_attributions doctor_attributions_treatment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.doctor_attributions
    ADD CONSTRAINT doctor_attributions_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.dental_treatments(id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: follow_ups follow_ups_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.follow_ups
    ADD CONSTRAINT follow_ups_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: lab_work lab_work_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work
    ADD CONSTRAINT lab_work_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: lab_work lab_work_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work
    ADD CONSTRAINT lab_work_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: lab_work_history lab_work_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_history
    ADD CONSTRAINT lab_work_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.lab_work_orders(id) ON DELETE CASCADE;


--
-- Name: lab_work_orders lab_work_orders_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_orders
    ADD CONSTRAINT lab_work_orders_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: lab_work_orders lab_work_orders_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_orders
    ADD CONSTRAINT lab_work_orders_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: lab_work lab_work_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work
    ADD CONSTRAINT lab_work_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: lab_work_results lab_work_results_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lab_work_results
    ADD CONSTRAINT lab_work_results_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.lab_work_orders(id) ON DELETE CASCADE;


--
-- Name: medical_records medical_records_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: medical_records medical_records_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.medical_records
    ADD CONSTRAINT medical_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_auth patient_auth_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_auth
    ADD CONSTRAINT patient_auth_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: patient_auth patient_auth_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_auth
    ADD CONSTRAINT patient_auth_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_phones patient_phones_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_phones
    ADD CONSTRAINT patient_phones_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: patient_records patient_records_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patient_records
    ADD CONSTRAINT patient_records_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: patients patients_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: payment_transactions payment_transactions_treatment_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_transactions
    ADD CONSTRAINT payment_transactions_treatment_payment_id_fkey FOREIGN KEY (treatment_payment_id) REFERENCES public.treatment_payments(id) ON DELETE CASCADE;


--
-- Name: prescription_history prescription_history_prescription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescription_history
    ADD CONSTRAINT prescription_history_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: prescriptions prescriptions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescriptions
    ADD CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: scheduling_settings scheduling_settings_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scheduling_settings
    ADD CONSTRAINT scheduling_settings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: staff_permissions staff_permissions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_permissions
    ADD CONSTRAINT staff_permissions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: tooth_conditions tooth_conditions_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tooth_conditions
    ADD CONSTRAINT tooth_conditions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: tooth_conditions tooth_conditions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tooth_conditions
    ADD CONSTRAINT tooth_conditions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: tooth_images tooth_images_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tooth_images
    ADD CONSTRAINT tooth_images_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: tooth_images tooth_images_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tooth_images
    ADD CONSTRAINT tooth_images_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: treatment_payments treatment_payments_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_payments
    ADD CONSTRAINT treatment_payments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: treatment_payments treatment_payments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_payments
    ADD CONSTRAINT treatment_payments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: treatment_payments treatment_payments_treatment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_payments
    ADD CONSTRAINT treatment_payments_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.dental_treatments(id) ON DELETE CASCADE;


--
-- Name: treatment_plans treatment_plans_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: treatment_plans treatment_plans_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_plans
    ADD CONSTRAINT treatment_plans_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- Name: treatment_types treatment_types_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.treatment_types
    ADD CONSTRAINT treatment_types_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_clinic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE;


--
-- Name: appointments Allow all operations on appointments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on appointments" ON public.appointments USING (true);


--
-- Name: clinics Allow all operations on clinics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on clinics" ON public.clinics USING (true);


--
-- Name: dental_charts Allow all operations on dental_charts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on dental_charts" ON public.dental_charts USING (true);


--
-- Name: dental_notes Allow all operations on dental_notes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on dental_notes" ON public.dental_notes USING (true);


--
-- Name: dentists Allow all operations on dentists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on dentists" ON public.dentists USING (true);


--
-- Name: disabled_slots Allow all operations on disabled_slots; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on disabled_slots" ON public.disabled_slots USING (true);


--
-- Name: medical_records Allow all operations on medical_records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on medical_records" ON public.medical_records USING (true);


--
-- Name: patient_auth Allow all operations on patient_auth; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on patient_auth" ON public.patient_auth USING (true);


--
-- Name: patient_phones Allow all operations on patient_phones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on patient_phones" ON public.patient_phones USING (true);


--
-- Name: patient_records Allow all operations on patient_records; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on patient_records" ON public.patient_records USING (true);


--
-- Name: patients Allow all operations on patients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on patients" ON public.patients USING (true);


--
-- Name: prescription_history Allow all operations on prescription_history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on prescription_history" ON public.prescription_history USING (true);


--
-- Name: prescriptions Allow all operations on prescriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on prescriptions" ON public.prescriptions USING (true);


--
-- Name: push_subscriptions Allow all operations on push_subscriptions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on push_subscriptions" ON public.push_subscriptions USING (true);


--
-- Name: scheduling_settings Allow all operations on scheduling_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on scheduling_settings" ON public.scheduling_settings USING (true);


--
-- Name: staff_permissions Allow all operations on staff_permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on staff_permissions" ON public.staff_permissions USING (true);


--
-- Name: storage_usage Allow all operations on storage_usage; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on storage_usage" ON public.storage_usage USING (true);


--
-- Name: system_settings Allow all operations on system_settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on system_settings" ON public.system_settings USING (true);


--
-- Name: tooth_images Allow all operations on tooth images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on tooth images" ON public.tooth_images USING (true);


--
-- Name: tooth_images Allow all operations on tooth_images; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on tooth_images" ON public.tooth_images USING (true);


--
-- Name: treatment_plans Allow all operations on treatment_plans; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on treatment_plans" ON public.treatment_plans USING (true);


--
-- Name: treatment_types Allow all operations on treatment_types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on treatment_types" ON public.treatment_types USING (true);


--
-- Name: user_roles Allow all operations on user_roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations on user_roles" ON public.user_roles USING (true);


--
-- Name: tooth_conditions Allow patient portal access to tooth_conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow patient portal access to tooth_conditions" ON public.tooth_conditions FOR SELECT USING (true);


--
-- Name: tooth_conditions Allow patient portal delete to tooth_conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow patient portal delete to tooth_conditions" ON public.tooth_conditions FOR DELETE USING (true);


--
-- Name: tooth_conditions Allow patient portal insert to tooth_conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow patient portal insert to tooth_conditions" ON public.tooth_conditions FOR INSERT WITH CHECK (true);


--
-- Name: tooth_conditions Allow patient portal update to tooth_conditions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow patient portal update to tooth_conditions" ON public.tooth_conditions FOR UPDATE USING (true);


--
-- Name: follow_ups Authenticated users can delete follow-ups for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete follow-ups for their clinic" ON public.follow_ups FOR DELETE USING ((clinic_id IN ( SELECT user_roles.clinic_id
   FROM public.user_roles
  WHERE (user_roles.user_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: follow_ups Authenticated users can insert follow-ups for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert follow-ups for their clinic" ON public.follow_ups FOR INSERT WITH CHECK ((clinic_id IN ( SELECT user_roles.clinic_id
   FROM public.user_roles
  WHERE (user_roles.user_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: follow_ups Authenticated users can update follow-ups for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update follow-ups for their clinic" ON public.follow_ups FOR UPDATE USING ((clinic_id IN ( SELECT user_roles.clinic_id
   FROM public.user_roles
  WHERE (user_roles.user_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: follow_ups Authenticated users can view their clinic's follow-ups; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view their clinic's follow-ups" ON public.follow_ups FOR SELECT USING ((clinic_id IN ( SELECT user_roles.clinic_id
   FROM public.user_roles
  WHERE (user_roles.user_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: lab_work Clinics can delete their own lab work; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinics can delete their own lab work" ON public.lab_work FOR DELETE USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work.clinic_id))));


--
-- Name: lab_work Clinics can insert their own lab work; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinics can insert their own lab work" ON public.lab_work FOR INSERT WITH CHECK ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work.clinic_id))));


--
-- Name: lab_work Clinics can update their own lab work; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinics can update their own lab work" ON public.lab_work FOR UPDATE USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work.clinic_id))));


--
-- Name: lab_work Clinics can view their own lab work; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Clinics can view their own lab work" ON public.lab_work FOR SELECT USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work.clinic_id))));


--
-- Name: analytics_cache Enable all access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for authenticated users" ON public.analytics_cache USING ((clinic_id IN ( SELECT user_roles.clinic_id
   FROM public.user_roles
  WHERE (user_roles.user_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: doctor_attributions Enable all access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for authenticated users" ON public.doctor_attributions USING ((clinic_id IN ( SELECT user_roles.clinic_id
   FROM public.user_roles
  WHERE (user_roles.user_id = ( SELECT auth.uid() AS uid)))));


--
-- Name: payment_transactions Enable all access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for authenticated users" ON public.payment_transactions USING ((auth.role() = 'authenticated'::text));


--
-- Name: treatment_payments Enable all access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable all access for authenticated users" ON public.treatment_payments USING ((auth.role() = 'authenticated'::text));


--
-- Name: system_audit_log Super admin can read audit logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can read audit logs" ON public.system_audit_log FOR SELECT USING (true);


--
-- Name: captcha_attempts Super admin can read captcha attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can read captcha attempts" ON public.captcha_attempts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.role)::text = 'super_admin'::text)))));


--
-- Name: login_attempts Super admin can read login attempts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can read login attempts" ON public.login_attempts FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.role)::text = 'super_admin'::text)))));


--
-- Name: security_audit_log Super admin can read security audit log; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admin can read security audit log" ON public.security_audit_log FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND ((ur.role)::text = 'super_admin'::text)))));


--
-- Name: dental_treatments Ultra permissive dental_treatments policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ultra permissive dental_treatments policy" ON public.dental_treatments USING (true) WITH CHECK (true);


--
-- Name: lab_work_orders Users can delete lab work orders for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete lab work orders for their clinic" ON public.lab_work_orders FOR DELETE USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work_orders.clinic_id))));


--
-- Name: lab_work_history Users can insert lab work history for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert lab work history for their clinic" ON public.lab_work_history FOR INSERT WITH CHECK ((order_id IN ( SELECT lab_work_orders.id
   FROM public.lab_work_orders
  WHERE (lab_work_orders.clinic_id IN ( SELECT clinics.id
           FROM public.clinics
          WHERE (clinics.id = lab_work_orders.clinic_id))))));


--
-- Name: lab_work_orders Users can insert lab work orders for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert lab work orders for their clinic" ON public.lab_work_orders FOR INSERT WITH CHECK ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work_orders.clinic_id))));


--
-- Name: lab_work_results Users can insert lab work results for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert lab work results for their clinic" ON public.lab_work_results FOR INSERT WITH CHECK ((order_id IN ( SELECT lab_work_orders.id
   FROM public.lab_work_orders
  WHERE (lab_work_orders.clinic_id IN ( SELECT clinics.id
           FROM public.clinics
          WHERE (clinics.id = lab_work_orders.clinic_id))))));


--
-- Name: lab_work_orders Users can update lab work orders for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update lab work orders for their clinic" ON public.lab_work_orders FOR UPDATE USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work_orders.clinic_id))));


--
-- Name: lab_work_results Users can update lab work results for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update lab work results for their clinic" ON public.lab_work_results FOR UPDATE USING ((order_id IN ( SELECT lab_work_orders.id
   FROM public.lab_work_orders
  WHERE (lab_work_orders.clinic_id IN ( SELECT clinics.id
           FROM public.clinics
          WHERE (clinics.id = lab_work_orders.clinic_id))))));


--
-- Name: lab_work_history Users can view lab work history for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view lab work history for their clinic" ON public.lab_work_history FOR SELECT USING ((order_id IN ( SELECT lab_work_orders.id
   FROM public.lab_work_orders
  WHERE (lab_work_orders.clinic_id IN ( SELECT clinics.id
           FROM public.clinics
          WHERE (clinics.id = lab_work_orders.clinic_id))))));


--
-- Name: lab_work_orders Users can view lab work orders for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view lab work orders for their clinic" ON public.lab_work_orders FOR SELECT USING ((clinic_id IN ( SELECT clinics.id
   FROM public.clinics
  WHERE (clinics.id = lab_work_orders.clinic_id))));


--
-- Name: lab_work_results Users can view lab work results for their clinic; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view lab work results for their clinic" ON public.lab_work_results FOR SELECT USING ((order_id IN ( SELECT lab_work_orders.id
   FROM public.lab_work_orders
  WHERE (lab_work_orders.clinic_id IN ( SELECT clinics.id
           FROM public.clinics
          WHERE (clinics.id = lab_work_orders.clinic_id))))));


--
-- Name: analytics_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: appointments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

--
-- Name: captcha_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.captcha_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: clinics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

--
-- Name: dental_charts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dental_charts ENABLE ROW LEVEL SECURITY;

--
-- Name: dental_notes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dental_notes ENABLE ROW LEVEL SECURITY;

--
-- Name: dental_treatments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dental_treatments ENABLE ROW LEVEL SECURITY;

--
-- Name: dentists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dentists ENABLE ROW LEVEL SECURITY;

--
-- Name: disabled_slots; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.disabled_slots ENABLE ROW LEVEL SECURITY;

--
-- Name: doctor_attributions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.doctor_attributions ENABLE ROW LEVEL SECURITY;

--
-- Name: follow_ups; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_work; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_work ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_work_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_work_history ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_work_orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_work_orders ENABLE ROW LEVEL SECURITY;

--
-- Name: lab_work_results; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lab_work_results ENABLE ROW LEVEL SECURITY;

--
-- Name: login_attempts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: medical_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_auth; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_auth ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_phones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_phones ENABLE ROW LEVEL SECURITY;

--
-- Name: patient_records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patient_records ENABLE ROW LEVEL SECURITY;

--
-- Name: patients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: prescription_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prescription_history ENABLE ROW LEVEL SECURITY;

--
-- Name: prescriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: push_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: scheduling_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scheduling_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: security_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: staff_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: storage_usage; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.storage_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: system_audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: tooth_conditions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tooth_conditions ENABLE ROW LEVEL SECURITY;

--
-- Name: tooth_images; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tooth_images ENABLE ROW LEVEL SECURITY;

--
-- Name: treatment_payments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treatment_payments ENABLE ROW LEVEL SECURITY;

--
-- Name: treatment_plans; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

--
-- Name: treatment_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.treatment_types ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--
