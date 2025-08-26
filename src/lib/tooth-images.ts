import { supabase } from './supabase'

export interface ToothImage {
  id: string
  tooth_number: string
  image_type: 'xray' | 'photo' | 'scan'
  description: string
  cloudinary_url: string
  cloudinary_public_id: string
  file_size_bytes: number
  uploaded_at: string
}

export interface CreateToothImageData {
  clinic_id: string
  patient_id: string
  tooth_number: string
  image_type: 'xray' | 'photo' | 'scan'
  description?: string
  cloudinary_url: string
  cloudinary_public_id: string
  file_size_bytes: number
}

class ToothImageApi {
  // Get all tooth images for a patient
  async getByPatient(patientId: string, clinicId: string): Promise<ToothImage[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_tooth_images', {
          p_clinic_id: clinicId,
          p_patient_id: patientId
        })

      if (error) {
        console.error('Error fetching tooth images:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getByPatient:', error)
      throw error
    }
  }

  // Get images for a specific tooth
  async getByTooth(patientId: string, clinicId: string, toothNumber: string): Promise<ToothImage[]> {
    try {
      const { data, error } = await supabase
        .from('tooth_images')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error fetching tooth images:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getByTooth:', error)
      throw error
    }
  }

  // Create a new tooth image
  async create(imageData: CreateToothImageData): Promise<ToothImage> {
    try {
      const { data, error } = await supabase
        .from('tooth_images')
        .insert([imageData])
        .select()
        .single()

      if (error) {
        console.error('Error creating tooth image:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in create:', error)
      throw error
    }
  }

  // Delete a tooth image
  async delete(imageId: string, clinicId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('delete_tooth_image', {
          p_image_id: imageId,
          p_clinic_id: clinicId
        })

      if (error) {
        console.error('Error deleting tooth image:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in delete:', error)
      throw error
    }
  }

  // Get image statistics for a patient
  async getStats(patientId: string, clinicId: string): Promise<{
    totalImages: number
    totalSizeBytes: number
    imagesByType: { [key: string]: number }
  }> {
    try {
      const { data, error } = await supabase
        .from('tooth_images')
        .select('image_type, file_size_bytes')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)

      if (error) {
        console.error('Error fetching tooth image stats:', error)
        throw error
      }

      const totalImages = data?.length || 0
      const totalSizeBytes = data?.reduce((sum, img) => sum + img.file_size_bytes, 0) || 0
      
      const imagesByType = data?.reduce((acc, img) => {
        acc[img.image_type] = (acc[img.image_type] || 0) + 1
        return acc
      }, {} as { [key: string]: number }) || {}

      return {
        totalImages,
        totalSizeBytes,
        imagesByType
      }
    } catch (error) {
      console.error('Error in getStats:', error)
      throw error
    }
  }

  // Get images by type for a patient
  async getByType(patientId: string, clinicId: string, imageType: 'xray' | 'photo' | 'scan'): Promise<ToothImage[]> {
    try {
      const { data, error } = await supabase
        .from('tooth_images')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('patient_id', patientId)
        .eq('image_type', imageType)
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error fetching tooth images by type:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getByType:', error)
      throw error
    }
  }
}

export const toothImageApi = new ToothImageApi()
