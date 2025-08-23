-- =====================================================
-- 🧪 LAB WORK SCHEMA
-- =====================================================
-- This creates the lab_work table for tracking dental lab orders
-- =====================================================

-- Create lab_work table
CREATE TABLE IF NOT EXISTS lab_work (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  lab_name TEXT NOT NULL,
  work_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Ordered' CHECK (
    status IN ('Ordered', 'In Progress', 'Quality Check', 'Ready for Pickup', 'Patient Notified', 'Completed', 'Cancelled', 'Delayed')
  ),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  cost DECIMAL(10,2),
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lab_work_clinic_id ON lab_work(clinic_id);
CREATE INDEX IF NOT EXISTS idx_lab_work_patient_id ON lab_work(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_work_status ON lab_work(status);
CREATE INDEX IF NOT EXISTS idx_lab_work_order_date ON lab_work(order_date);
CREATE INDEX IF NOT EXISTS idx_lab_work_expected_completion_date ON lab_work(expected_completion_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_lab_work_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lab_work_updated_at
  BEFORE UPDATE ON lab_work
  FOR EACH ROW
  EXECUTE FUNCTION update_lab_work_updated_at();

-- Enable Row Level Security
ALTER TABLE lab_work ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Clinics can view their own lab work" ON lab_work
  FOR SELECT USING (clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));

CREATE POLICY "Clinics can insert their own lab work" ON lab_work
  FOR INSERT WITH CHECK (clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));

CREATE POLICY "Clinics can update their own lab work" ON lab_work
  FOR UPDATE USING (clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));

CREATE POLICY "Clinics can delete their own lab work" ON lab_work
  FOR DELETE USING (clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));

-- Create function to get lab work summary
CREATE OR REPLACE FUNCTION get_lab_work_summary(clinic_uuid UUID)
RETURNS TABLE (
  total_orders INTEGER,
  in_progress INTEGER,
  ready_for_pickup INTEGER,
  overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_orders,
    COUNT(*) FILTER (WHERE status IN ('Ordered', 'In Progress', 'Quality Check'))::INTEGER as in_progress,
    COUNT(*) FILTER (WHERE status = 'Ready for Pickup')::INTEGER as ready_for_pickup,
    COUNT(*) FILTER (WHERE expected_completion_date < CURRENT_DATE AND status IN ('Ordered', 'In Progress', 'Quality Check'))::INTEGER as overdue
  FROM lab_work 
  WHERE clinic_id = clinic_uuid;
END;
$$ LANGUAGE plpgsql;
