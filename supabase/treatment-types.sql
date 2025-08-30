-- Treatment Types Table
-- Allows clinics to manage their own treatment types with costs

CREATE TABLE IF NOT EXISTS treatment_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_cost DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique treatment names per clinic
    UNIQUE(clinic_id, name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_treatment_types_clinic_id ON treatment_types(clinic_id);
CREATE INDEX IF NOT EXISTS idx_treatment_types_active ON treatment_types(is_active);
CREATE INDEX IF NOT EXISTS idx_treatment_types_name ON treatment_types(name);

-- Row Level Security (RLS)
ALTER TABLE treatment_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow read access to authenticated users with clinic access
CREATE POLICY "Users can view treatment types for their clinic" ON treatment_types
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

-- Allow insert/update/delete for clinic admins
CREATE POLICY "Clinic admins can manage treatment types" ON treatment_types
    FOR ALL USING (
        auth.uid() IS NOT NULL
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_treatment_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_treatment_types_updated_at
    BEFORE UPDATE ON treatment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_treatment_types_updated_at();

-- Insert some default treatment types for new clinics
-- These will be copied when a new clinic is created
INSERT INTO treatment_types (clinic_id, name, description, default_cost) VALUES
    ('00000000-0000-0000-0000-000000000000', 'Root Canal', 'Endodontic treatment for infected tooth pulp', 5000.00),
    ('00000000-0000-0000-0000-000000000000', 'Dental Filling', 'Cavity filling with composite or amalgam', 1500.00),
    ('00000000-0000-0000-0000-000000000000', 'Dental Cleaning', 'Professional dental cleaning and scaling', 800.00),
    ('00000000-0000-0000-0000-000000000000', 'Tooth Extraction', 'Surgical or simple tooth extraction', 2000.00),
    ('00000000-0000-0000-0000-000000000000', 'Crown', 'Dental crown placement', 8000.00),
    ('00000000-0000-0000-0000-000000000000', 'Bridge', 'Dental bridge placement', 12000.00),
    ('00000000-0000-0000-0000-000000000000', 'Dental Implant', 'Surgical implant placement', 25000.00),
    ('00000000-0000-0000-0000-000000000000', 'Whitening', 'Professional teeth whitening', 3000.00),
    ('00000000-0000-0000-0000-000000000000', 'Consultation', 'Initial consultation and examination', 500.00),
    ('00000000-0000-0000-0000-000000000000', 'X-Ray', 'Dental X-ray imaging', 300.00),
    ('00000000-0000-0000-0000-000000000000', 'Fluoride Treatment', 'Professional fluoride application', 400.00),
    ('00000000-0000-0000-0000-000000000000', 'Sealant', 'Dental sealant application', 600.00)
ON CONFLICT (clinic_id, name) DO NOTHING;
