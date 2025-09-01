-- Insert default staff permissions for Jeshna Dental Clinic
INSERT INTO staff_permissions (clinic_id, can_access_settings, can_access_patient_portal, can_access_payment_analytics) 
SELECT 
  c.id,
  false,  -- Staff cannot access settings by default
  true,   -- Staff can access patient portal by default
  false   -- Staff cannot access payment analytics by default
FROM clinics c 
WHERE c.slug = 'jeshna-dental'
  AND NOT EXISTS (SELECT 1 FROM staff_permissions WHERE clinic_id = c.id);
