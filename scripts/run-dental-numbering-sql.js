const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDentalNumberingSQL() {
  try {
    console.log('🦷 Adding dental numbering system to database...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../supabase/add-dental-numbering-system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error running SQL:', error);
      return;
    }
    
    console.log('✅ Dental numbering system added successfully!');
    console.log('📊 Current settings:');
    
    // Query to show current settings
    const { data: settings, error: settingsError } = await supabase
      .from('scheduling_settings')
      .select(`
        clinic_id,
        dental_numbering_system,
        updated_at,
        clinics!inner(name)
      `);
    
    if (settingsError) {
      console.error('❌ Error fetching settings:', settingsError);
      return;
    }
    
    settings.forEach(setting => {
      console.log(`🏥 ${setting.clinics.name}: ${setting.dental_numbering_system} (updated: ${new Date(setting.updated_at).toLocaleString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

runDentalNumberingSQL();
