import { supabase } from './supabase'

export const testToothImagesTable = async () => {
  try {
    console.log('Testing tooth_images table...')
    
    // Try to query the table
    const { data, error } = await supabase
      .from('tooth_images')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ tooth_images table error:', error)
      return false
    }
    
    console.log('✅ tooth_images table exists and is accessible')
    console.log('Sample data:', data)
    return true
  } catch (error) {
    console.error('❌ Error testing tooth_images table:', error)
    return false
  }
}

export const testToothImagesFunctions = async () => {
  try {
    console.log('Testing tooth_images functions...')
    
    // Test the get_tooth_images function
    const { data, error } = await supabase
      .rpc('get_tooth_images', {
        p_clinic_id: 'test-clinic-id',
        p_patient_id: 'test-patient-id'
      })
    
    if (error) {
      console.error('❌ get_tooth_images function error:', error)
      return false
    }
    
    console.log('✅ get_tooth_images function exists and is accessible')
    console.log('Function result:', data)
    return true
  } catch (error) {
    console.error('❌ Error testing tooth_images functions:', error)
    return false
  }
}
