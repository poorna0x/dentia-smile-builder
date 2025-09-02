import { supabase } from './supabase'

export const testToothImagesTable = async () => {
  try {
    
    // Try to query the table
    const { data, error } = await supabase
      .from('tooth_images')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ tooth_images table error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Error testing tooth_images table:', error)
    return false
  }
}

export const testToothImagesFunctions = async () => {
  try {
    
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
    
    return true
  } catch (error) {
    console.error('❌ Error testing tooth_images functions:', error)
    return false
  }
}
