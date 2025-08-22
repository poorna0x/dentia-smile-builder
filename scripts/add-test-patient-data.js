/**
 * Add Test Patient Data Script
 * 
 * This script helps you add test patient data to your database.
 * 
 * INSTRUCTIONS:
 * 1. First, find your clinic ID from Supabase
 * 2. Use that clinic ID to add patient data
 * 3. Test the patient data access system
 */

console.log('🏥 ADD TEST PATIENT DATA');
console.log('========================\n');

console.log('📋 STEP 1: FIND YOUR CLINIC ID');
console.log('1. Go to Supabase Dashboard');
console.log('2. Click "Table Editor"');
console.log('3. Click "clinics" table');
console.log('4. Copy the "id" (UUID) of your clinic\n');

console.log('📋 STEP 2: ADD TEST PATIENT');
console.log('1. Go to "patients" table');
console.log('2. Click "Insert Row"');
console.log('3. Fill with this data (replace CLINIC_ID with your actual clinic ID):\n');

console.log('📄 PATIENT DATA:');
console.log('{');
console.log('  "clinic_id": "YOUR_CLINIC_ID_HERE",');
console.log('  "first_name": "John",');
console.log('  "last_name": "Doe",');
console.log('  "email": "john.doe@email.com",');
console.log('  "phone": "6363116263",');
console.log('  "date_of_birth": "1990-01-15",');
console.log('  "gender": "Male",');
console.log('  "address": "123 Main Street, Bangalore, Karnataka",');
console.log('  "emergency_contact_name": "Jane Doe",');
console.log('  "emergency_contact_phone": "9876543210",');
console.log('  "medical_history": {"conditions": ["None"], "surgeries": []},');
console.log('  "allergies": ["None"],');
console.log('  "current_medications": ["None"],');
console.log('  "insurance_provider": "Blue Cross",');
console.log('  "insurance_number": "BC123456789",');
console.log('  "notes": "Test patient for system testing"');
console.log('}\n');

console.log('📋 STEP 3: ADD TREATMENT PLAN');
console.log('1. Go to "treatment_plans" table');
console.log('2. Click "Insert Row"');
console.log('3. Fill with this data (replace CLINIC_ID and PATIENT_ID):\n');

console.log('📄 TREATMENT PLAN DATA:');
console.log('{');
console.log('  "clinic_id": "YOUR_CLINIC_ID_HERE",');
console.log('  "patient_id": "PATIENT_ID_FROM_STEP_2",');
console.log('  "treatment_name": "Dental Cleaning",');
console.log('  "treatment_description": "Regular dental cleaning and checkup",');
console.log('  "treatment_type": "Preventive",');
console.log('  "status": "Active",');
console.log('  "start_date": "2024-01-15",');
console.log('  "end_date": "2024-01-15",');
console.log('  "cost": 150.00,');
console.log('  "notes": "Patient needs regular cleaning every 6 months"');
console.log('}\n');

console.log('📋 STEP 4: ADD MEDICAL RECORD');
console.log('1. Go to "medical_records" table');
console.log('2. Click "Insert Row"');
console.log('3. Fill with this data (replace CLINIC_ID and PATIENT_ID):\n');

console.log('📄 MEDICAL RECORD DATA:');
console.log('{');
console.log('  "clinic_id": "YOUR_CLINIC_ID_HERE",');
console.log('  "patient_id": "PATIENT_ID_FROM_STEP_2",');
console.log('  "record_type": "consultation",');
console.log('  "title": "Initial Consultation",');
console.log('  "description": "Patient came for initial dental consultation",');
console.log('  "record_date": "2024-01-15",');
console.log('  "created_by": "Dr. Sarah Bennett",');
console.log('  "notes": "Patient has good oral hygiene. Recommended regular cleaning."');
console.log('}\n');

console.log('📋 STEP 5: TEST THE SYSTEM');
console.log('1. Start your dev server: npm run dev');
console.log('2. Visit: http://localhost:8083/');
console.log('3. Scroll to "Access Your Medical Information"');
console.log('4. Enter phone: 6363116263');
console.log('5. Click "View My Information"');
console.log('6. Browse through the tabs\n');

console.log('🎯 WHAT YOU SHOULD SEE:');
console.log('✅ Patient information (John Doe)');
console.log('✅ Treatment plans (Dental Cleaning)');
console.log('✅ Medical records (Initial Consultation)');
console.log('✅ Appointments (if any exist)\n');

console.log('🔧 TROUBLESHOOTING:');
console.log('❌ No data found? Check:');
console.log('   - Clinic ID is correct');
console.log('   - Patient ID is correct');
console.log('   - Phone number matches exactly');
console.log('   - Database tables were created successfully\n');

console.log('✅ READY TO ADD DATA!');
console.log('Follow the steps above to add test patient data.\n');
