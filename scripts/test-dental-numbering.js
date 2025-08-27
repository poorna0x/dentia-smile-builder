const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDentalNumbering() {
  try {
    console.log('🦷 Testing dental numbering system...');
    
    // First, let's check if the column exists
    const { data: columns, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'scheduling_settings' 
        AND column_name = 'dental_numbering_system';
      `
    });
    
    if (columnError) {
      console.error('❌ Error checking columns:', columnError);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Dental numbering system column exists!');
      console.log('📊 Column info:', columns[0]);
    } else {
      console.log('❌ Dental numbering system column does not exist');
      console.log('🔧 Adding the column...');
      
      // Add the column
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE scheduling_settings 
          ADD COLUMN dental_numbering_system VARCHAR(20) DEFAULT 'universal' CHECK (dental_numbering_system IN ('universal', 'fdi'));
        `
      });
      
      if (alterError) {
        console.error('❌ Error adding column:', alterError);
        return;
      }
      
      console.log('✅ Column added successfully!');
    }
    
    // Now let's test updating a setting
    const { data: clinics } = await supabase
      .from('clinics')
      .select('id, name')
      .limit(1);
    
    if (clinics && clinics.length > 0) {
      const clinic = clinics[0];
      console.log(`🏥 Testing with clinic: ${clinic.name}`);
      
      // Try to update the setting
      const { data, error } = await supabase
        .from('scheduling_settings')
        .upsert({
          clinic_id: clinic.id,
          dental_numbering_system: 'fdi',
          day_schedules: {},
          notification_settings: {}
        }, {
          onConflict: 'clinic_id'
        })
        .select();
      
      if (error) {
        console.error('❌ Error updating setting:', error);
        return;
      }
      
      console.log('✅ Successfully updated dental numbering system!');
      console.log('📊 Updated data:', data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDentalNumbering();
