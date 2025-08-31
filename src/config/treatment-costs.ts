/**
 * TREATMENT COST CONFIGURATION
 * 
 * This file defines the default costs for different dental treatments.
 * These costs are used to pre-fill the payment form when creating new treatments.
 * 
 * You can customize these costs based on your clinic's pricing.
 */

export interface TreatmentCost {
  name: string
  defaultCost: number
  description?: string
}

export const TREATMENT_COSTS: Record<string, TreatmentCost> = {
  'Root Canal': {
    name: 'Root Canal',
    defaultCost: 8000,
    description: 'Complete root canal treatment'
  },
  'Dental Cleaning': {
    name: 'Dental Cleaning',
    defaultCost: 1500,
    description: 'Professional dental cleaning and scaling'
  },
  'Cavity Filling': {
    name: 'Cavity Filling',
    defaultCost: 2000,
    description: 'Tooth cavity filling treatment'
  },
  'Tooth Extraction': {
    name: 'Tooth Extraction',
    defaultCost: 3000,
    description: 'Simple tooth extraction'
  },
  'Wisdom Tooth Extraction': {
    name: 'Wisdom Tooth Extraction',
    defaultCost: 5000,
    description: 'Wisdom tooth removal surgery'
  },
  'Dental Crown': {
    name: 'Dental Crown',
    defaultCost: 12000,
    description: 'Porcelain or metal crown placement'
  },
  'Dental Bridge': {
    name: 'Dental Bridge',
    defaultCost: 25000,
    description: 'Fixed dental bridge for missing teeth'
  },
  'Dental Implant': {
    name: 'Dental Implant',
    defaultCost: 45000,
    description: 'Complete dental implant treatment'
  },
  'Teeth Whitening': {
    name: 'Teeth Whitening',
    defaultCost: 5000,
    description: 'Professional teeth whitening treatment'
  },
  'Dental Veneers': {
    name: 'Dental Veneers',
    defaultCost: 15000,
    description: 'Porcelain veneers for smile enhancement'
  },
  'Braces/Orthodontics': {
    name: 'Braces/Orthodontics',
    defaultCost: 35000,
    description: 'Orthodontic treatment with braces'
  },
  'Dentures': {
    name: 'Dentures',
    defaultCost: 20000,
    description: 'Complete or partial dentures'
  },
  'Gum Treatment': {
    name: 'Gum Treatment',
    description: 'Periodontal treatment for gum disease'
  },
  'Consultation': {
    name: 'Consultation',
    defaultCost: 500,
    description: 'Initial consultation and examination'
  },
  'X-Ray': {
    name: 'X-Ray',
    defaultCost: 800,
    description: 'Dental X-ray examination'
  },
  'Emergency Treatment': {
    name: 'Emergency Treatment',
    defaultCost: 3000,
    description: 'Emergency dental treatment'
  }
}

/**
 * Get the default cost for a treatment type
 * @param treatmentType - The type of treatment
 * @returns The default cost or 0 if not found
 */
export const getTreatmentCost = (treatmentType: string): number => {
  const treatment = TREATMENT_COSTS[treatmentType]
  return treatment?.defaultCost || 0
}

/**
 * Get all available treatment types
 * @returns Array of treatment type names
 */
export const getTreatmentTypes = (): string[] => {
  return Object.keys(TREATMENT_COSTS)
}

/**
 * Get treatment details by type
 * @param treatmentType - The type of treatment
 * @returns Treatment details or null if not found
 */
export const getTreatmentDetails = (treatmentType: string): TreatmentCost | null => {
  return TREATMENT_COSTS[treatmentType] || null
}
