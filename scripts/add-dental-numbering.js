const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDentalNumberingSystem() {
  try {
    console.log('🦷 Adding dental numbering system to database...');
    
    // Add the column to scheduling_settings table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE scheduling_settings 
        ADD COLUMN IF NOT EXISTS dental_numbering_system VARCHAR(20) DEFAULT 'universal' CHECK (dental_numbering_system IN ('universal', 'fdi'));
      `
    });
    
    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      return;
    }
    
    // Update existing records to have the default value
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE scheduling_settings 
        SET dental_numbering_system = 'universal' 
        WHERE dental_numbering_system IS NULL;
      `
    });
    
    if (updateError) {
      console.error('❌ Error updating records:', updateError);
      return;
    }
    
    // Insert default setting for existing clinics if they don't have scheduling_settings
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO scheduling_settings (clinic_id, dental_numbering_system, day_schedules, notification_settings)
        SELECT 
          c.id,
          'universal',
          '{}',
          '{"email_notifications": true, "reminder_hours": 24, "auto_confirm": true}'
        FROM clinics c
        WHERE NOT EXISTS (
          SELECT 1 FROM scheduling_settings ss WHERE ss.clinic_id = c.id
        );
      `
    });
    
    if (insertError) {
      console.error('❌ Error inserting default settings:', insertError);
      return;
    }
    
    console.log('✅ Dental numbering system added successfully!');
    
    // Show current settings
    const { data: settings, error: queryError } = await supabase
      .from('scheduling_settings')
      .select(`
        clinic_id,
        dental_numbering_system,
        updated_at,
        clinics!inner(name)
      `);
    
    if (queryError) {
      console.error('❌ Error fetching settings:', queryError);
      return;
    }
    
    console.log('📊 Current dental numbering system settings:');
    settings.forEach(setting => {
      console.log(`🏥 ${setting.clinics.name}: ${setting.dental_numbering_system}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addDentalNumberingSystem();
