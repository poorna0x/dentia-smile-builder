-- 🦷 SETUP FOLLOW-UPS TABLE
-- Run this script to create the follow-ups table in your Supabase database

-- Follow-ups table for tracking patients that need follow-up actions
CREATE TABLE IF NOT EXISTS follow_ups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL DEFAULT 'General follow-up',
    notes TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),
    due_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by VARCHAR(100)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follow_ups_clinic_id ON follow_ups(clinic_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_patient_id ON follow_ups(patient_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_date ON follow_ups(due_date);

-- Add RLS policies
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their clinic's follow-ups
CREATE POLICY "Authenticated users can view their clinic's follow-ups" ON follow_ups
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to insert follow-ups for their clinic
CREATE POLICY "Authenticated users can insert follow-ups for their clinic" ON follow_ups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for authenticated users to update follow-ups for their clinic
CREATE POLICY "Authenticated users can update follow-ups for their clinic" ON follow_ups
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to delete follow-ups for their clinic
CREATE POLICY "Authenticated users can delete follow-ups for their clinic" ON follow_ups
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_follow_ups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_follow_ups_updated_at
    BEFORE UPDATE ON follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION update_follow_ups_updated_at();

-- Success message
SELECT '✅ Follow-ups table created successfully!' as status;
