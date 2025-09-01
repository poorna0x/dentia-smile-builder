// Database Performance Diagnostic Script
// Run this to check if there are any database performance issues

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnosePerformance() {
  console.log('🔍 Starting database performance diagnosis...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const startTime = Date.now();
    const { data: testData, error: testError } = await supabase
      .from('clinics')
      .select('id, name')
      .limit(1);
    
    const connectionTime = Date.now() - startTime;
    console.log(`   Connection time: ${connectionTime}ms`);
    
    if (testError) {
      console.log(`   ❌ Connection error: ${testError.message}`);
      return;
    }
    console.log('   ✅ Connection successful\n');
    
    // Test 2: Appointments query (the slow one)
    console.log('2. Testing appointments query...');
    const today = new Date().toISOString().split('T')[0];
    
    const appointmentsStart = Date.now();
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, patient_id, name, phone, email, date, time, status')
      .eq('clinic_id', testData[0]?.id || 'test')
      .eq('date', today)
      .eq('status', 'Confirmed')
      .order('time', { ascending: true });
    
    const appointmentsTime = Date.now() - appointmentsStart;
    console.log(`   Appointments query time: ${appointmentsTime}ms`);
    console.log(`   Results: ${appointments?.length || 0} appointments`);
    
    if (appointmentsError) {
      console.log(`   ❌ Appointments error: ${appointmentsError.message}`);
    } else {
      console.log('   ✅ Appointments query successful\n');
    }
    
    // Test 3: Patients query
    console.log('3. Testing patients query...');
    const patientsStart = Date.now();
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', testData[0]?.id || 'test')
      .limit(10);
    
    const patientsTime = Date.now() - patientsStart;
    console.log(`   Patients query time: ${patientsTime}ms`);
    console.log(`   Results: ${patients?.length || 0} patients`);
    
    if (patientsError) {
      console.log(`   ❌ Patients error: ${patientsError.message}`);
    } else {
      console.log('   ✅ Patients query successful\n');
    }
    
    // Test 4: Check table sizes
    console.log('4. Checking table sizes...');
    const { data: appointmentCount, error: appointmentCountError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });
    
    const { data: patientCount, error: patientCountError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Appointments table: ${appointmentCount || 0} records`);
    console.log(`   Patients table: ${patientCount || 0} records`);
    
    // Performance assessment
    console.log('\n📊 Performance Assessment:');
    if (connectionTime > 1000) {
      console.log('   ⚠️  Connection is slow (>1s)');
    } else {
      console.log('   ✅ Connection is fast');
    }
    
    if (appointmentsTime > 2000) {
      console.log('   ⚠️  Appointments query is slow (>2s)');
    } else {
      console.log('   ✅ Appointments query is fast');
    }
    
    if (patientsTime > 1000) {
      console.log('   ⚠️  Patients query is slow (>1s)');
    } else {
      console.log('   ✅ Patients query is fast');
    }
    
    if ((appointmentCount || 0) > 10000) {
      console.log('   ⚠️  Large appointments table - consider archiving old data');
    }
    
    if ((patientCount || 0) > 5000) {
      console.log('   ⚠️  Large patients table - consider pagination');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
  }
}

diagnosePerformance();
