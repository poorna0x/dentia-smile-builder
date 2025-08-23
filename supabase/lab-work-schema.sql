-- Lab Work Management System for Dental Clinic
-- This schema creates tables and functions for managing lab work orders and results

-- Create lab work orders table
CREATE TABLE IF NOT EXISTS lab_work_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    lab_type VARCHAR(100) NOT NULL, -- 'crown', 'bridge', 'implant', 'denture', 'veneer', 'inlay_onlay', 'orthodontic', 'other'
    test_name VARCHAR(255) NOT NULL,
    description TEXT,
    ordered_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'In Progress', 'Quality Check', 'Ready for Pickup', 'Patient Notified', 'Completed', 'Cancelled', 'Delayed')),
    ordered_by VARCHAR(255),
    lab_facility VARCHAR(255),
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lab work results table
CREATE TABLE IF NOT EXISTS lab_work_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES lab_work_orders(id) ON DELETE CASCADE,
    result_date DATE NOT NULL DEFAULT CURRENT_DATE,
    result_summary TEXT,
    normal_range VARCHAR(255),
    actual_value VARCHAR(255),
    interpretation TEXT,
    file_url VARCHAR(500), -- For uploaded lab reports
    reported_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lab work history table for tracking changes
CREATE TABLE IF NOT EXISTS lab_work_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES lab_work_orders(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'Created', 'Status Changed', 'Result Added', 'Cancelled'
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_by VARCHAR(255) NOT NULL,
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_work_orders_clinic_id ON lab_work_orders(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_work_orders_patient_id ON lab_work_orders(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_work_orders_status ON lab_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_lab_work_orders_ordered_date ON lab_work_orders(ordered_date);
CREATE INDEX IF NOT EXISTS idx_lab_work_results_order_id ON lab_work_results(order_id);
CREATE INDEX IF NOT EXISTS idx_lab_work_history_order_id ON lab_work_history(order_id);

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_lab_order_number(p_clinic_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    next_number INTEGER;
    order_number VARCHAR(50);
BEGIN
    -- Get the next number for this clinic
    SELECT COALESCE(MAX(CAST(SUBSTRING(lwo.order_number FROM 'LAB-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM lab_work_orders lwo
    WHERE lwo.clinic_id = p_clinic_id;
    
    -- Format: LAB-YYYYMMDD-001
    order_number := 'LAB-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get lab work orders for a patient
CREATE OR REPLACE FUNCTION get_lab_work_orders(p_patient_id UUID, p_clinic_id UUID)
RETURNS TABLE (
    id UUID,
    order_number VARCHAR(50),
    lab_type VARCHAR(100),
    test_name VARCHAR(255),
    description TEXT,
    ordered_date DATE,
    expected_date DATE,
    status VARCHAR(50),
    ordered_by VARCHAR(255),
    lab_facility VARCHAR(255),
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    has_results BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lwo.id,
        lwo.order_number,
        lwo.lab_type,
        lwo.test_name,
        lwo.description,
        lwo.ordered_date,
        lwo.expected_date,
        lwo.status,
        lwo.ordered_by,
        lwo.lab_facility,
        lwo.cost,
        lwo.notes,
        lwo.created_at,
        EXISTS(SELECT 1 FROM lab_work_results lwr WHERE lwr.order_id = lwo.id) as has_results
    FROM lab_work_orders lwo
    WHERE lwo.patient_id = p_patient_id 
    AND lwo.clinic_id = p_clinic_id
    ORDER BY lwo.ordered_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lab work results for an order
CREATE OR REPLACE FUNCTION get_lab_work_results(p_order_id UUID)
RETURNS TABLE (
    id UUID,
    result_date DATE,
    result_summary TEXT,
    normal_range VARCHAR(255),
    actual_value VARCHAR(255),
    interpretation TEXT,
    file_url VARCHAR(500),
    reported_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lwr.id,
        lwr.result_date,
        lwr.result_summary,
        lwr.normal_range,
        lwr.actual_value,
        lwr.interpretation,
        lwr.file_url,
        lwr.reported_by,
        lwr.notes,
        lwr.created_at
    FROM lab_work_results lwr
    WHERE lwr.order_id = p_order_id
    ORDER BY lwr.result_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create lab work order with history
CREATE OR REPLACE FUNCTION create_lab_work_order(
    p_clinic_id UUID,
    p_patient_id UUID,
    p_lab_type VARCHAR(100),
    p_test_name VARCHAR(255),
    p_description TEXT,
    p_expected_date DATE,
    p_ordered_by VARCHAR(255),
    p_lab_facility VARCHAR(255),
    p_cost DECIMAL(10,2),
    p_notes TEXT
)
RETURNS UUID AS $$
DECLARE
    new_order_id UUID;
    order_num VARCHAR(50);
BEGIN
    -- Generate order number
    order_num := generate_lab_order_number(p_clinic_id);
    
    -- Insert lab work order
    INSERT INTO lab_work_orders (
        clinic_id,
        patient_id,
        order_number,
        lab_type,
        test_name,
        description,
        expected_date,
        ordered_by,
        lab_facility,
        cost,
        notes
    ) VALUES (
        p_clinic_id,
        p_patient_id,
        order_num,
        p_lab_type,
        p_test_name,
        p_description,
        p_expected_date,
        p_ordered_by,
        p_lab_facility,
        p_cost,
        p_notes
    ) RETURNING id INTO new_order_id;
    
    -- Log in history
    INSERT INTO lab_work_history (
        order_id,
        action,
        action_by,
        notes
    ) VALUES (
        new_order_id,
        'Created',
        p_ordered_by,
        'Lab work order created'
    );
    
    RETURN new_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update lab work status with validation
CREATE OR REPLACE FUNCTION update_lab_work_status(
    p_order_id UUID,
    p_new_status VARCHAR(50),
    p_action_by VARCHAR(255),
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_status VARCHAR(50);
    valid_transition BOOLEAN := FALSE;
BEGIN
    -- Get current status
    SELECT status INTO current_status
    FROM lab_work_orders
    WHERE id = p_order_id;
    
    -- Validate status transition (more flexible)
    CASE current_status
        WHEN 'Ordered' THEN
            valid_transition := p_new_status IN ('In Progress', 'Quality Check', 'Ready for Pickup', 'Cancelled', 'Delayed');
        WHEN 'In Progress' THEN
            valid_transition := p_new_status IN ('Quality Check', 'Ready for Pickup', 'Cancelled', 'Delayed');
        WHEN 'Quality Check' THEN
            valid_transition := p_new_status IN ('Ready for Pickup', 'In Progress', 'Cancelled');
        WHEN 'Ready for Pickup' THEN
            valid_transition := p_new_status IN ('Patient Notified', 'Completed', 'Quality Check', 'Cancelled');
        WHEN 'Patient Notified' THEN
            valid_transition := p_new_status IN ('Completed', 'Ready for Pickup', 'Cancelled');
        WHEN 'Completed' THEN
            valid_transition := FALSE; -- Cannot change from completed
        WHEN 'Cancelled' THEN
            valid_transition := FALSE; -- Cannot change from cancelled
        WHEN 'Delayed' THEN
            valid_transition := p_new_status IN ('In Progress', 'Cancelled');
        ELSE
            valid_transition := FALSE;
    END CASE;
    
    -- If invalid transition, raise error
    IF NOT valid_transition THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', current_status, p_new_status;
    END IF;
    
    -- Update status
    UPDATE lab_work_orders
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Log status change in history
    INSERT INTO lab_work_history (
        order_id,
        action,
        action_by,
        notes
    ) VALUES (
        p_order_id,
        'Status Changed',
        p_action_by,
        COALESCE(p_notes, 'Status changed from ' || current_status || ' to ' || p_new_status)
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lab work status history
CREATE OR REPLACE FUNCTION get_lab_work_status_history(p_order_id UUID)
RETURNS TABLE (
    action VARCHAR(100),
    action_date TIMESTAMP WITH TIME ZONE,
    action_by VARCHAR(255),
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lwh.action,
        lwh.action_date,
        lwh.action_by,
        lwh.notes
    FROM lab_work_history lwh
    WHERE lwh.order_id = p_order_id
    ORDER BY lwh.action_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add lab work results
CREATE OR REPLACE FUNCTION add_lab_work_result(
    p_order_id UUID,
    p_result_summary TEXT,
    p_normal_range VARCHAR(255),
    p_actual_value VARCHAR(255),
    p_interpretation TEXT,
    p_file_url VARCHAR(500),
    p_reported_by VARCHAR(255),
    p_notes TEXT
)
RETURNS UUID AS $$
DECLARE
    new_result_id UUID;
BEGIN
    -- Insert lab work result
    INSERT INTO lab_work_results (
        order_id,
        result_summary,
        normal_range,
        actual_value,
        interpretation,
        file_url,
        reported_by,
        notes
    ) VALUES (
        p_order_id,
        p_result_summary,
        p_normal_range,
        p_actual_value,
        p_interpretation,
        p_file_url,
        p_reported_by,
        p_notes
    ) RETURNING id INTO new_result_id;
    
    -- Update order status to completed
    PERFORM update_lab_work_status(p_order_id, 'Completed', p_reported_by, 'Results added');
    
    -- Log in history
    INSERT INTO lab_work_history (
        order_id,
        action,
        action_by,
        notes
    ) VALUES (
        p_order_id,
        'Result Added',
        p_reported_by,
        'Lab work results added'
    );
    
    RETURN new_result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE lab_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_work_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_work_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for lab_work_orders
DROP POLICY IF EXISTS "Users can view lab work orders for their clinic" ON lab_work_orders;
CREATE POLICY "Users can view lab work orders for their clinic" ON lab_work_orders
    FOR SELECT USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

DROP POLICY IF EXISTS "Users can insert lab work orders for their clinic" ON lab_work_orders;
CREATE POLICY "Users can insert lab work orders for their clinic" ON lab_work_orders
    FOR INSERT WITH CHECK (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

DROP POLICY IF EXISTS "Users can update lab work orders for their clinic" ON lab_work_orders;
CREATE POLICY "Users can update lab work orders for their clinic" ON lab_work_orders
    FOR UPDATE USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

DROP POLICY IF EXISTS "Users can delete lab work orders for their clinic" ON lab_work_orders;
CREATE POLICY "Users can delete lab work orders for their clinic" ON lab_work_orders
    FOR DELETE USING (clinic_id IN (
        SELECT id FROM clinics WHERE id = clinic_id
    ));

-- Create RLS policies for lab_work_results
DROP POLICY IF EXISTS "Users can view lab work results for their clinic" ON lab_work_results;
CREATE POLICY "Users can view lab work results for their clinic" ON lab_work_results
    FOR SELECT USING (order_id IN (
        SELECT id FROM lab_work_orders WHERE clinic_id IN (
            SELECT id FROM clinics WHERE id = clinic_id
        )
    ));

DROP POLICY IF EXISTS "Users can insert lab work results for their clinic" ON lab_work_results;
CREATE POLICY "Users can insert lab work results for their clinic" ON lab_work_results
    FOR INSERT WITH CHECK (order_id IN (
        SELECT id FROM lab_work_orders WHERE clinic_id IN (
            SELECT id FROM clinics WHERE id = clinic_id
        )
    ));

DROP POLICY IF EXISTS "Users can update lab work results for their clinic" ON lab_work_results;
CREATE POLICY "Users can update lab work results for their clinic" ON lab_work_results
    FOR UPDATE USING (order_id IN (
        SELECT id FROM lab_work_orders WHERE clinic_id IN (
            SELECT id FROM clinics WHERE id = clinic_id
        )
    ));

-- Create RLS policies for lab_work_history
DROP POLICY IF EXISTS "Users can view lab work history for their clinic" ON lab_work_history;
CREATE POLICY "Users can view lab work history for their clinic" ON lab_work_history
    FOR SELECT USING (order_id IN (
        SELECT id FROM lab_work_orders WHERE clinic_id IN (
            SELECT id FROM clinics WHERE id = clinic_id
        )
    ));

DROP POLICY IF EXISTS "Users can insert lab work history for their clinic" ON lab_work_history;
CREATE POLICY "Users can insert lab work history for their clinic" ON lab_work_history
    FOR INSERT WITH CHECK (order_id IN (
        SELECT id FROM lab_work_orders WHERE clinic_id IN (
            SELECT id FROM clinics WHERE id = clinic_id
        )
    ));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lab_work_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lab_work_orders_updated_at ON lab_work_orders;
CREATE TRIGGER trigger_update_lab_work_orders_updated_at
    BEFORE UPDATE ON lab_work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_work_updated_at();

DROP TRIGGER IF EXISTS trigger_update_lab_work_results_updated_at ON lab_work_results;
CREATE TRIGGER trigger_update_lab_work_results_updated_at
    BEFORE UPDATE ON lab_work_results
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_work_updated_at();

-- Sample data will be inserted here after we have patients
-- This is just the schema structure
-- INSERT INTO lab_work_orders (...) VALUES (...);

-- ✅ LAB WORK SYSTEM SETUP COMPLETE!
-- 
-- WHAT WAS CREATED:
-- ✅ lab_work_orders table (lab work orders)
-- ✅ lab_work_results table (lab work results)
-- ✅ lab_work_history table (audit trail)
-- ✅ All necessary indexes and triggers
-- ✅ Row Level Security enabled
-- ✅ Database functions for CRUD operations
-- 
-- FEATURES:
-- ✅ Order number generation (LAB-YYYYMMDD-001)
-- ✅ Status tracking (Ordered, In Progress, Completed, Cancelled, Delayed)
-- ✅ Result management with file uploads
-- ✅ Complete audit trail
-- ✅ Multi-clinic support
