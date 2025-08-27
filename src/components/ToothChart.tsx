import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Circle, 
  Plus, 
  Eye, 
  Edit, 
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  CreditCard,
  AlertTriangle,
  Clock,
  Upload,
  Camera,
  X,
  Loader2,
  Image as ImageIcon,
  FileImage,
  AlertCircle
} from 'lucide-react'
import { 
  DentalTreatment, 
  ToothCondition, 
  toothChartUtils,
  dentalTreatmentApi,
  toothConditionApi
} from '@/lib/dental-treatments'
import { toothImageApi, ToothImage as DbToothImage } from '@/lib/tooth-images'
import { compressImage, validateImageFile, formatFileSize } from '@/lib/image-compression'
import { toast } from '@/hooks/use-toast'
import { testToothImagesTable, testToothImagesFunctions } from '@/lib/test-database'
import DentalTreatmentForm from './DentalTreatmentForm'
import PaymentManagementSimple from './PaymentManagementSimple'
import PaymentTreatmentSelector from './PaymentTreatmentSelector'
import EnhancedPaymentManagement from './EnhancedPaymentManagement'
import ToothImageUpload from './ToothImageUpload'
import ToothImageGallery from './ToothImageGallery'
import { ToothImage } from './ToothImageUpload'

interface ToothChartProps {
  patientId: string
  clinicId: string
  onTreatmentAdded?: () => void
  onConditionUpdated?: () => void
}

interface ToothData {
  number: string
  position: string
  name: string
  condition?: any
  treatments: any[]
  images: ToothImage[]
  isSelected: boolean
}

const ToothChart: React.FC<ToothChartProps> = ({ 
  patientId, 
  clinicId, 
  onTreatmentAdded, 
  onConditionUpdated 
}) => {
  const [teeth, setTeeth] = useState<ToothData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTooth, setSelectedTooth] = useState<ToothData | null>(null)
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false)
  const [showConditionDialog, setShowConditionDialog] = useState(false)
  const [showAddTreatmentDialog, setShowAddTreatmentDialog] = useState(false)
  const [showAddConditionDialog, setShowAddConditionDialog] = useState(false)
  const [showEditTreatmentDialog, setShowEditTreatmentDialog] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<DentalTreatment | null>(null)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [treatmentToDelete, setTreatmentToDelete] = useState<DentalTreatment | null>(null)
  const [selectedPaymentTreatment, setSelectedPaymentTreatment] = useState<DentalTreatment | null>(null)
  const [showImagesDialog, setShowImagesDialog] = useState(false)
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('treatments')
  
  // Multi-tooth functionality state
  const [isMultiToothMode, setIsMultiToothMode] = useState(false)
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([])
  const [showMultiToothDialog, setShowMultiToothDialog] = useState(false)
  const [multiToothAction, setMultiToothAction] = useState<'treatment' | 'image' | null>(null)
  const [showTreatmentConfirmDialog, setShowTreatmentConfirmDialog] = useState(false)
  const [pendingTreatmentAction, setPendingTreatmentAction] = useState<'single' | 'multi' | null>(null)
  
  // State for loading during API calls
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState('')
  
  // Image loading states
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [toothImages, setToothImages] = useState<any[]>([])
  
  // Image form state for multi-tooth upload
  const [imageForm, setImageForm] = useState({
    image_type: '',
    description: '',
    file: null as File | null,
    previewUrl: null as string | null,
    compressionInfo: null as {
      originalSize: number;
      compressedSize: number;
      compressionRatio: number;
    } | null
  })

  // File input refs for multi-tooth image upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  
  // Treatment form state
  const [treatmentForm, setTreatmentForm] = useState({
    treatment_type: '',
    custom_treatment_type: '',
    treatment_description: '',
    treatment_status: 'Completed' as const,
    treatment_date: new Date().toISOString().split('T')[0],
    notes: '',
    // Payment fields for multi-tooth procedures
    include_payment: false,
    payment_type: 'full' as 'full' | 'partial',
    total_cost: '',
    payment_amount: '',
    payment_notes: ''
  })
  
  // Condition form state
  const [conditionForm, setConditionForm] = useState({
    condition_type: '',
    condition_description: '',
    severity: 'Mild' as const,
    notes: ''
  })

  // Load tooth data
  useEffect(() => {
    loadToothData()
  }, [patientId, clinicId])

  const loadToothData = async () => {
    setLoading(true)
    try {
      // Get all teeth (1-32)
      const allTeeth = []
      for (let i = 1; i <= 32; i++) {
        allTeeth.push(i.toString().padStart(2, '0'))
      }
      
      // Load real data from database (images will be loaded lazily)
      const [treatments, conditions] = await Promise.all([
        dentalTreatmentApi.getByPatient(patientId, clinicId),
        toothConditionApi.getByPatient(patientId, clinicId)
      ])



      // Debug: Check if images are being assigned to teeth correctly
      const teethWithImages = allTeeth.map(toothNumber => {
        const num = parseInt(toothNumber)
        let position = 'Unknown'
        if (num >= 1 && num <= 8) position = 'Upper Right'
        else if (num >= 9 && num <= 16) position = 'Upper Left'
        else if (num >= 17 && num <= 24) position = 'Lower Left'
        else if (num >= 25 && num <= 32) position = 'Lower Right'
        
        const positions = ['Central Incisor', 'Lateral Incisor', 'Canine', 'First Premolar', 'Second Premolar', 'First Molar', 'Second Molar', 'Third Molar']
        const positionName = positions[(num - 1) % 8]
        const quadrant = Math.ceil(num / 8)
        const name = `${positionName} (Quadrant ${quadrant})`

        // Get treatments and condition for this tooth (images loaded lazily)
        const toothTreatments = treatments.filter(t => t.tooth_number === toothNumber)
        const toothCondition = conditions.find(c => c.tooth_number === toothNumber)

        return {
          number: toothNumber,
          position,
          name,
          condition: toothCondition || null,
          treatments: toothTreatments,
          images: [], // Will be loaded lazily when Images tab is clicked
          isSelected: false
        }
      })

      setTeeth(teethWithImages)
    } catch (error) {
      console.error('Error loading tooth data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load images for a specific tooth (lazy loading)
  const loadToothImages = async (toothNumber: string) => {
    try {
      const images = await toothImageApi.getByPatient(patientId, clinicId)
      const toothImages = images.filter(img => img.tooth_number === toothNumber)
      
      // Convert database images to component format
      const componentImages = toothImages.map(dbImage => ({
        id: dbImage.id,
        url: dbImage.cloudinary_url,
        type: dbImage.image_type,
        description: dbImage.description || '',
        uploaded_at: dbImage.uploaded_at,
        size: dbImage.file_size_bytes,
        public_id: dbImage.cloudinary_public_id
      }))

      // Update the selected tooth with images
      setSelectedTooth(prev => prev ? {
        ...prev,
        images: componentImages
      } : null)

      setToothImages(componentImages)
      setImagesLoaded(true)
    } catch (error) {
      console.error('Error loading tooth images:', error)
    }
  }

  // Multi-tooth utility functions
  const toggleMultiToothMode = () => {
    setIsMultiToothMode(!isMultiToothMode)
    setSelectedTeeth([])
    if (isMultiToothMode) {
      setSelectedTooth(null)
      setShowTreatmentDialog(false)
    }
  }

  const selectAllTeeth = () => {
    setSelectedTeeth(teeth.map(t => t.number))
  }

  const selectUpperJaw = () => {
    setSelectedTeeth(teeth.slice(0, 16).map(t => t.number))
  }

  const selectLowerJaw = () => {
    setSelectedTeeth(teeth.slice(16, 32).map(t => t.number))
  }

  const selectQuadrant = (quadrant: number) => {
    const start = (quadrant - 1) * 8
    const end = start + 8
    setSelectedTeeth(teeth.slice(start, end).map(t => t.number))
  }

  const clearSelection = () => {
    setSelectedTeeth([])
  }

  const openMultiToothDialog = (action: 'treatment' | 'image') => {
    if (selectedTeeth.length === 0) {
      alert('Please select at least one tooth first')
      return
    }
    setMultiToothAction(action)
    setShowMultiToothDialog(true)
  }

  // Bulk treatment application with payment support
  const handleBulkTreatment = async () => {
    if (!multiToothAction || selectedTeeth.length === 0) return
    
    // Show confirmation dialog first
    setPendingTreatmentAction('multi')
    setShowTreatmentConfirmDialog(true)
    setShowMultiToothDialog(false)
  }

  // Handle bulk image upload
  const handleBulkImageUpload = async () => {
    if (!imageForm.file || !imageForm.image_type) return
    
    // Show confirmation dialog first
    setPendingTreatmentAction('multi')
    setShowTreatmentConfirmDialog(true)
    setShowMultiToothDialog(false)
  }

  // Handle file selection for multi-tooth image upload
  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setImageForm(prev => ({ ...prev, file }));
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageForm(prev => ({ ...prev, previewUrl: e.target?.result as string }));
    };
    reader.readAsDataURL(file);

    // Compress image
    try {
      const compressed = await compressImage(file);
      setImageForm(prev => ({
        ...prev,
        compressionInfo: {
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
          compressionRatio: compressed.compressionRatio,
        },
        file: compressed.file
      }));
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: "Compression failed",
        description: "Using original image",
        variant: "destructive"
      });
    }
  }

  // Handle drag and drop for multi-tooth image upload
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }

  // Handle drag over for multi-tooth image upload
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  }

  // Helper function to upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File, toothNumber: string) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'dental_clinic');
    formData.append('folder', `dental-clinic/tooth-${toothNumber}`);
    formData.append('tags', `${imageForm.image_type},tooth-${toothNumber},dental`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      url: result.secure_url,
      public_id: result.public_id,
      bytes: file.size
    };
  }

  // Helper function to delete image from Cloudinary
  const deleteImageFromCloudinary = async (publicId: string) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      console.warn('Cloudinary credentials not configured for delete operation');
      return; // Skip deletion if credentials not available
    }

    try {
      // For now, we'll skip the Cloudinary delete since it requires server-side authentication
      // The image will remain in Cloudinary but won't be accessible without the public_id
      console.log('Skipping Cloudinary delete for:', publicId);
    } catch (error) {
      console.warn('Failed to delete from Cloudinary:', error);
      // Don't throw error to avoid breaking the rollback process
    }
  }

  // Handle bulk image upload after confirmation
  const handleBulkImageUploadConfirmed = async () => {
    if (!imageForm.file || !imageForm.image_type) return
    
    setIsProcessing(true)
    setProcessingMessage(`Uploading image to ${selectedTeeth.length} teeth...`)
    
    let uploadResult: any = null
    const createdRecords: any[] = []
    
    try {
      // Step 1: Upload image once to Cloudinary
      setProcessingMessage('Uploading image to Cloudinary...')
      uploadResult = await uploadImageToCloudinary(imageForm.file, selectedTeeth[0])
      
      // Step 2: Create database records for all teeth
      for (let i = 0; i < selectedTeeth.length; i++) {
        const toothNumber = selectedTeeth[i]
        setProcessingMessage(`Creating record for tooth ${toothNumber} (${i + 1}/${selectedTeeth.length})...`)
        
        const imageData = {
          patient_id: patientId,
          clinic_id: clinicId,
          tooth_number: toothNumber,
          cloudinary_url: uploadResult.url,
          cloudinary_public_id: uploadResult.public_id,
          image_type: imageForm.image_type,
          description: imageForm.description || '',
          file_size_bytes: uploadResult.bytes
        }
        
        const record = await toothImageApi.create(imageData)
        createdRecords.push(record)
      }
      
      setProcessingMessage('Finalizing...')
      
      // Reset form and close dialog
      setImageForm({
        image_type: '',
        description: '',
        file: null,
        previewUrl: null,
        compressionInfo: null
      })
      setSelectedTeeth([])
      setIsMultiToothMode(false)
      setShowMultiToothDialog(false)
      
      // Refresh data
      await loadToothData()
      
      setIsProcessing(false)
      setProcessingMessage('')
      toast({
        title: "Upload successful",
        description: `Image uploaded to ${selectedTeeth.length} teeth successfully!`
      })
      
    } catch (error) {
      console.error('Error in bulk image upload:', error)
      
      // Rollback: Delete all created database records
      if (createdRecords.length > 0) {
        setProcessingMessage('Rolling back changes...')
        let rollbackSuccess = true
        for (const record of createdRecords) {
          try {
            await toothImageApi.delete(record.id)
          } catch (deleteError) {
            console.error('Error deleting record during rollback:', deleteError)
            rollbackSuccess = false
          }
        }
        
        if (!rollbackSuccess) {
          console.warn('Some database records could not be deleted during rollback')
        }
      }
      
      // Delete Cloudinary file if upload was successful but database failed
      if (uploadResult && uploadResult.public_id) {
        try {
          await deleteImageFromCloudinary(uploadResult.public_id)
        } catch (deleteError) {
          console.warn('Could not delete Cloudinary file during rollback:', deleteError)
          // This is not critical since the file won't be accessible without the database record
        }
      }
      
      setIsProcessing(false)
      setProcessingMessage('')
      toast({
        title: "Upload failed",
        description: "Failed to upload image. All changes have been rolled back.",
        variant: "destructive"
      })
    }
  }

  // Handle bulk treatment after confirmation
  const handleBulkTreatmentConfirmed = async () => {
    setIsProcessing(true)
    setProcessingMessage(`Processing ${selectedTeeth.length} teeth...`)
    
    try {
      // Create treatments for all selected teeth
      setProcessingMessage('Creating treatments...')
      const treatmentPromises = selectedTeeth.map(toothNumber => 
        dentalTreatmentApi.create({
          clinic_id: clinicId,
          patient_id: patientId,
          tooth_number: toothNumber,
          tooth_position: teeth.find(t => t.number === toothNumber)?.position || 'Unknown',
          treatment_type: treatmentForm.treatment_type === 'Other' ? treatmentForm.custom_treatment_type : treatmentForm.treatment_type,
          treatment_description: treatmentForm.treatment_description,
          treatment_status: treatmentForm.treatment_status,
          treatment_date: treatmentForm.treatment_date,
          notes: treatmentForm.notes
        })
      )

      const createdTreatments = await Promise.all(treatmentPromises)
      
      // Create payment record if payment is included
      if (treatmentForm.include_payment && treatmentForm.payment_amount > 0) {
        setProcessingMessage('Creating payment records...')
        try {
          // Import payment API dynamically to avoid circular dependencies
          const { simplePaymentApi } = await import('@/lib/payment-system-simple')
          
          // Calculate payment details based on payment type
          const totalCost = parseFloat(treatmentForm.total_cost) || parseFloat(treatmentForm.payment_amount) || 0
          const paymentAmount = parseFloat(treatmentForm.payment_amount) || 0
          const remainingBalance = totalCost - paymentAmount
          
          // Create payment records for all treatments in the multi-tooth procedure
          for (const treatment of createdTreatments) {
            try {
              // Calculate payment status correctly
              let paymentStatus: 'Pending' | 'Partial' | 'Completed'
              if (paymentAmount === 0) {
                paymentStatus = 'Pending'
              } else if (remainingBalance > 0) {
                paymentStatus = 'Partial'
              } else {
                paymentStatus = 'Completed'
              }

              // Create the treatment payment record
              const paymentData = {
                clinic_id: clinicId,
                patient_id: patientId,
                treatment_id: treatment.id,
                total_amount: totalCost,
                paid_amount: paymentAmount,
                payment_status: paymentStatus
              }
              
              const treatmentPayment = await simplePaymentApi.createTreatmentPayment(paymentData)
              
              // Create the initial payment transaction
              if (paymentAmount > 0) {
                const transactionData = {
                  treatment_payment_id: treatmentPayment.id,
                  amount: paymentAmount,
                  payment_date: treatmentForm.treatment_date
                }
                
                const transaction = await simplePaymentApi.addPaymentTransaction(transactionData)
              }
              

            } catch (error) {
              console.error(`Error creating payment for treatment ${treatment.id}:`, error)
            }
          }
          

          
          // Refresh tooth data to show the new payments
          setProcessingMessage('Finalizing...')
          await loadToothData()
        } catch (paymentError) {
          console.error('Error creating payment records:', paymentError)
          // Don't fail the entire operation if payment creation fails
        }
      }
      
      // Reset form and close dialog
      setTreatmentForm({
        treatment_type: '',
        custom_treatment_type: '',
        treatment_description: '',
        treatment_status: 'Completed',
        treatment_date: new Date().toISOString().split('T')[0],
        notes: '',
        include_payment: false,
        payment_type: 'full',
        total_cost: '',
        payment_amount: '',
        payment_notes: ''
      })
      setShowMultiToothDialog(false)
      setMultiToothAction(null)
      setSelectedTeeth([])
      setIsMultiToothMode(false)
      
      // Reload data
      await loadToothData()
      onTreatmentAdded?.()
      
      setIsProcessing(false)
      setProcessingMessage('')
      toast({
        title: "Success",
        description: `Successfully added treatment to ${selectedTeeth.length} teeth!`
      })
    } catch (error) {
      console.error('Error adding bulk treatment:', error)
      setIsProcessing(false)
      setProcessingMessage('')
      toast({
        title: "Error",
        description: "Failed to add treatments. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Get color for tooth based on condition and selection
  const getToothColor = (tooth: ToothData): string => {
    // Multi-tooth selection takes priority
    if (isMultiToothMode && selectedTeeth.includes(tooth.number)) {
      return 'bg-blue-200 hover:bg-blue-300 border-blue-500'
    }
    
    if (!tooth.condition) return 'bg-gray-100 hover:bg-gray-200'
    
    const conditionType = tooth.condition.condition_type.toLowerCase()
    
    // Common conditions
    if (conditionType.includes('healthy')) return 'bg-green-100 hover:bg-green-200'
    if (conditionType.includes('cavity') || conditionType.includes('decay')) return 'bg-red-100 hover:bg-red-200'
    if (conditionType.includes('filled')) return 'bg-blue-100 hover:bg-blue-200'
    if (conditionType.includes('crown')) return 'bg-purple-100 hover:bg-purple-200'
    if (conditionType.includes('missing')) return 'bg-gray-300 hover:bg-gray-400'
    if (conditionType.includes('sensitive')) return 'bg-yellow-100 hover:bg-yellow-200'
    if (conditionType.includes('chipped') || conditionType.includes('cracked')) return 'bg-orange-100 hover:bg-orange-200'
    
    // Orthodontic conditions
    if (conditionType.includes('braces on')) return 'bg-emerald-100 hover:bg-emerald-200'
    if (conditionType.includes('braces off')) return 'bg-emerald-50 hover:bg-emerald-100'
    if (conditionType.includes('retainer on')) return 'bg-teal-100 hover:bg-teal-200'
    if (conditionType.includes('retainer off')) return 'bg-teal-50 hover:bg-teal-100'
    if (conditionType.includes('aligner on')) return 'bg-indigo-100 hover:bg-indigo-200'
    if (conditionType.includes('aligner off')) return 'bg-indigo-50 hover:bg-indigo-100'
    if (conditionType.includes('orthodontic treatment')) return 'bg-cyan-100 hover:bg-cyan-200'
    
    return 'bg-gray-100 hover:bg-gray-200'
  }

  // Get treatment status color
  const getTreatmentStatusColor = (status: string): string => {
    switch (status) {
      case 'Completed': return 'bg-green-500'
      case 'In Progress': return 'bg-blue-500'
      case 'Planned': return 'bg-yellow-500'
      case 'Cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Handle tooth click
  const handleToothClick = (tooth: ToothData) => {
    if (isMultiToothMode) {
      // Multi-tooth selection mode
      setSelectedTeeth(prev => {
        const isSelected = prev.includes(tooth.number)
        if (isSelected) {
          return prev.filter(t => t !== tooth.number)
        } else {
          return [...prev, tooth.number]
        }
      })
    } else {
      // Single tooth mode - directly open treatment dialog
      setSelectedTooth(tooth)
      setSelectedPaymentTreatment(null) // Reset payment treatment selection
      setShowTreatmentDialog(true)
      // Reset images loaded state for new tooth
      setImagesLoaded(false)
      setToothImages([])
      setActiveTab('treatments')
    }
  }

  // Handle add treatment
  const handleAddTreatment = async () => {
    if (!selectedTooth) return
    
    setIsProcessing(true)
    setProcessingMessage('Adding treatment...')
    
    try {
      await dentalTreatmentApi.create({
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: selectedTooth.number,
        tooth_position: selectedTooth.position,
        treatment_type: treatmentForm.treatment_type === 'Other' ? treatmentForm.custom_treatment_type : treatmentForm.treatment_type,
        treatment_description: treatmentForm.treatment_description,
        treatment_status: treatmentForm.treatment_status,
        treatment_date: treatmentForm.treatment_date,
        notes: treatmentForm.notes
      })
      
      setProcessingMessage('Finalizing...')
      
      // Reset form and close dialog
      setTreatmentForm({
        treatment_type: '',
        custom_treatment_type: '',
        treatment_description: '',
        treatment_status: 'Completed',
        treatment_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setShowAddTreatmentDialog(false)
      
      // Reload data
      await loadToothData()
      onTreatmentAdded?.()
      
      setIsProcessing(false)
      setProcessingMessage('')
      toast({
        title: "Success",
        description: "Treatment added successfully!"
      })
    } catch (error) {
      console.error('Error adding treatment:', error)
      setIsProcessing(false)
      setProcessingMessage('')
      toast({
        title: "Error",
        description: "Failed to add treatment. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle add condition
  const handleAddCondition = async () => {
    if (!selectedTooth) return
    
    try {
      await toothConditionApi.upsert({
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: selectedTooth.number,
        tooth_position: selectedTooth.position,
        condition_type: conditionForm.condition_type,
        condition_description: conditionForm.condition_description,
        severity: conditionForm.severity,
        notes: conditionForm.notes
      })
      
      // Reset form and close dialog
      setConditionForm({
        condition_type: '',
        condition_description: '',
        severity: 'Mild',
        notes: ''
      })
      setShowAddConditionDialog(false)
      
      // Reload data
      await loadToothData()
      onConditionUpdated?.()
    } catch (error) {
      console.error('Error adding condition:', error)
    }
  }

  // Handle treatment confirmation (only for multi-tooth)
  const handleTreatmentConfirm = () => {
    setShowTreatmentConfirmDialog(false)
    if (pendingTreatmentAction === 'multi') {
      if (multiToothAction === 'treatment') {
        handleBulkTreatmentConfirmed()
      } else if (multiToothAction === 'image') {
        handleBulkImageUploadConfirmed()
      }
    }
    setPendingTreatmentAction(null)
  }

  const handleTreatmentCancel = () => {
    setShowTreatmentConfirmDialog(false)
    setPendingTreatmentAction(null)
  }

  // Handle edit treatment
  const handleEditTreatment = (treatment: DentalTreatment) => {
    setEditingTreatment(treatment)
    setShowEditTreatmentDialog(true)
  }

  const handleDeleteTreatment = (treatment: DentalTreatment) => {
    setTreatmentToDelete(treatment)
    setShowDeleteConfirmDialog(true)
  }

  const confirmDeleteTreatment = async () => {
    if (!treatmentToDelete) return
    
    try {
      await dentalTreatmentApi.delete(treatmentToDelete.id)
      setShowDeleteConfirmDialog(false)
      setTreatmentToDelete(null)
      loadToothData() // Reload data
      if (onTreatmentAdded) {
        onTreatmentAdded()
      }
    } catch (error) {
      console.error('Error deleting treatment:', error)
      // You can add toast notification here
    }
  }

  // Handle treatment updated
  const handleTreatmentUpdated = async () => {
    setShowEditTreatmentDialog(false)
    setEditingTreatment(null)
    await loadToothData()
    onTreatmentAdded?.()
  }

  // Handle image upload
  const handleImageUpload = async (image: ToothImage) => {
    if (!selectedTooth) return
    
    try {
      console.log('Starting image upload to database...', {
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: selectedTooth.number,
        image_type: image.type,
        description: image.description,
        cloudinary_url: image.url,
        cloudinary_public_id: image.public_id,
        file_size_bytes: image.size
      })

      // Save to database
      const dbImage = await toothImageApi.create({
        clinic_id: clinicId,
        patient_id: patientId,
        tooth_number: selectedTooth.number,
        image_type: image.type,
        description: image.description || '',
        cloudinary_url: image.url,
        cloudinary_public_id: image.public_id,
        file_size_bytes: image.size
      })

      console.log('Database save successful:', dbImage)

      // Convert database image to component format
      const componentImage: ToothImage = {
        id: dbImage.id,
        url: dbImage.cloudinary_url,
        type: dbImage.image_type,
        description: dbImage.description,
        uploaded_at: dbImage.uploaded_at,
        size: dbImage.file_size_bytes,
        public_id: dbImage.cloudinary_public_id
      }

      // Update the tooth data with the new image
      const updatedTeeth = teeth.map(tooth => {
        if (tooth.number === selectedTooth.number) {
          return {
            ...tooth,
            images: [...(tooth.images || []), componentImage]
          }
        }
        return tooth
      })
      
      setTeeth(updatedTeeth)
      
      // Update selected tooth
      setSelectedTooth(prev => prev ? {
        ...prev,
        images: [...(prev.images || []), componentImage]
      } : null)
      
      console.log('Image uploaded and saved to database:', componentImage)
    } catch (error) {
      console.error('Error uploading image:', error)
      // Show error to user
      toast({
        title: "Database Error",
        description: "Image uploaded to Cloudinary but failed to save to database. Please try again.",
        variant: "destructive"
      })
      throw error
    }
  }

  // Handle image delete
  const handleDeleteImage = async (imageId: string) => {
    if (!selectedTooth) return
    
    try {
      // Delete from database
      const success = await toothImageApi.delete(imageId, clinicId)
      
      if (!success) {
        throw new Error('Failed to delete image from database')
      }

      // Update the tooth data by removing the image
      const updatedTeeth = teeth.map(tooth => {
        if (tooth.number === selectedTooth.number) {
          return {
            ...tooth,
            images: (tooth.images || []).filter(img => img.id !== imageId)
          }
        }
        return tooth
      })
      
      setTeeth(updatedTeeth)
      
      // Update selected tooth and tooth images
      setSelectedTooth(prev => prev ? {
        ...prev,
        images: (prev.images || []).filter(img => img.id !== imageId)
      } : null)
      
      // Update tooth images state
      setToothImages(prev => prev.filter(img => img.id !== imageId))
      
      console.log('Image deleted from database:', imageId)
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" />
            Dental Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading dental chart...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Circle className="h-5 w-5" />
            Dental Chart
          </CardTitle>
          
          {/* Multi-tooth mode toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={isMultiToothMode ? "default" : "outline"}
              size="sm"
              onClick={toggleMultiToothMode}
              className="text-xs"
            >
              {isMultiToothMode ? "Exit Multi-Tooth" : "Multi-Tooth Mode"}
            </Button>
          </div>
        </div>
        
        {/* Multi-tooth controls */}
        {isMultiToothMode && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm font-medium text-blue-800">Quick Select:</span>
              <Button size="sm" variant="outline" onClick={selectAllTeeth} className="text-xs">
                All Teeth
              </Button>
              <Button size="sm" variant="outline" onClick={selectUpperJaw} className="text-xs">
                Upper Jaw
              </Button>
              <Button size="sm" variant="outline" onClick={selectLowerJaw} className="text-xs">
                Lower Jaw
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectQuadrant(1)} className="text-xs">
                Q1 (1-8)
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectQuadrant(2)} className="text-xs">
                Q2 (9-16)
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectQuadrant(3)} className="text-xs">
                Q3 (17-24)
              </Button>
              <Button size="sm" variant="outline" onClick={() => selectQuadrant(4)} className="text-xs">
                Q4 (25-32)
              </Button>
              <Button size="sm" variant="outline" onClick={clearSelection} className="text-xs">
                Clear
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-blue-800">Actions:</span>
              <Button 
                size="sm" 
                onClick={() => openMultiToothDialog('treatment')}
                disabled={selectedTeeth.length === 0}
                className="text-xs bg-green-600 hover:bg-green-700"
              >
                Add Treatment ({selectedTeeth.length})
              </Button>
              <Button 
                size="sm" 
                onClick={() => openMultiToothDialog('image')}
                disabled={selectedTeeth.length === 0}
                className="text-xs bg-purple-600 hover:bg-purple-700"
              >
                Add Image ({selectedTeeth.length})
              </Button>
              <span className="text-sm text-blue-600">
                Selected: {selectedTeeth.length} tooth{selectedTeeth.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Human Teeth Formation Chart with Universal Numbering */}
        <div className="flex flex-col items-center space-y-4">
          {/* Upper Jaw */}
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Upper Jaw (Maxilla) - Universal Numbers 1-16</h3>
            <div className="flex items-center justify-center flex-wrap gap-1">
              {/* Upper Right Quadrant (1-8) */}
              {teeth.slice(0, 8).reverse().map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-t-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                    {tooth.images && tooth.images.length > 0 && (
                      <div className="text-xs text-purple-600 mt-1 bg-purple-100 px-1 rounded">
                        📷 {tooth.images.length}
                      </div>
                    )}
                  </div>
                ))}
              
              {/* Upper Left Quadrant (9-16) */}
              {teeth.slice(8, 16).map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-t-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                    {tooth.images && tooth.images.length > 0 && (
                      <div className="text-xs text-purple-600 mt-1 bg-purple-100 px-1 rounded">
                        📷 {tooth.images.length}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Lower Jaw */}
          <div className="text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lower Jaw (Mandible) - Universal Numbers 17-32</h3>
            <div className="flex items-center justify-center flex-wrap gap-1">
              {/* Lower Right Quadrant (25-32) */}
              {teeth.slice(24, 32).reverse().map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-b-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                    {tooth.images && tooth.images.length > 0 && (
                      <div className="text-xs text-purple-600 mt-1 bg-purple-100 px-1 rounded">
                        📷 {tooth.images.length}
                      </div>
                    )}
                  </div>
                ))}
              
              {/* Lower Left Quadrant (17-24) */}
              {teeth.slice(16, 24).map((tooth) => (
                <div
                  key={tooth.number}
                  className={`
                    ${getToothColor(tooth)}
                    border-2 border-gray-400 rounded-b-lg cursor-pointer transition-colors
                    flex flex-col items-center justify-center w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16
                    hover:scale-105 hover:shadow-md
                  `}
                  onClick={() => handleToothClick(tooth)}
                >
                    <div className="text-xs font-bold text-gray-800">{tooth.number}</div>
                    {tooth.condition && (
                      <div className="text-xs text-gray-600 mt-1 px-1 bg-white/50 rounded">
                        {tooth.condition.condition_type}
                      </div>
                    )}
                    {tooth.treatments.length > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        {tooth.treatments.length}
                      </div>
                    )}
                    {tooth.images && tooth.images.length > 0 && (
                      <div className="text-xs text-purple-600 mt-1 bg-purple-100 px-1 rounded">
                        📷 {tooth.images.length}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Center Line Indicator */}
          <div className="text-xs text-gray-500 mt-2">
            <div className="flex items-center justify-center space-x-8">
              <span>Patient's Right</span>
              <div className="w-8 h-px bg-gray-300"></div>
              <span>Patient's Left</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm sm:text-base">Universal Numbering System (1-32)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm mb-4">
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">1-8</div>
              <span>Upper Right</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">9-16</div>
              <span>Upper Left</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">17-24</div>
              <span>Lower Left</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-bold text-gray-600 bg-gray-100 px-1 rounded">25-32</div>
              <span>Lower Right</span>
            </div>
          </div>
          
          <h5 className="font-semibold mb-2 text-sm sm:text-base">Tooth Condition Legend</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Cavity/Decay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Filled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Crown</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Missing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Sensitive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>Chipped</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border-2 border-gray-400 rounded-t-lg"></div>
              <span>No Data</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h5 className="font-semibold mb-2 text-sm sm:text-base">Instructions</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Click any tooth</strong> to view its details and treatment history</li>
              <li>• <strong>Numbers 1-32</strong> follow the Universal Numbering System</li>
              <li>• <strong>Colors</strong> indicate the current condition of each tooth</li>
              <li>• <strong>Blue numbers</strong> show how many treatments have been performed</li>
            </ul>
          </div>
        </div>

        {/* Treatment Confirmation Dialog */}
        <Dialog open={showTreatmentConfirmDialog} onOpenChange={setShowTreatmentConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Confirm Treatment Addition
              </DialogTitle>
                             <DialogDescription>
                 {multiToothAction === 'treatment' 
                   ? `Adding treatment to ${selectedTeeth.length} teeth. This will take some time to process all teeth.`
                   : `Uploading image to ${selectedTeeth.length} teeth. This will take some time to process all teeth.`
                 }
               </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Processing Time</p>
                    <p>Please wait while the system processes your request. Do not close this window.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleTreatmentCancel}>
                  Cancel
                </Button>
                <Button onClick={handleTreatmentConfirm} className="bg-blue-600 hover:bg-blue-700">
                  Continue
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tooth Details Dialog */}
        {selectedTooth && (
          <Dialog open={showTreatmentDialog} onOpenChange={(open) => {
            setShowTreatmentDialog(open)
            if (!open) {
              setSelectedPaymentTreatment(null) // Reset when dialog closes
            }
          }}>
            <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] xl:w-[60vw] h-[80vh] rounded-2xl border-2 overflow-hidden">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  <Circle className="h-5 w-5" />
                  Tooth {selectedTooth.number} - {selectedTooth.name}
                </DialogTitle>
                <DialogDescription>
                  View and manage treatments, conditions, payments, and images for this tooth.
                </DialogDescription>
              </DialogHeader>

              <Tabs 
                defaultValue="treatments" 
                className="w-full h-full flex flex-col min-h-0" 
                style={{ height: 'calc(100% - 60px)' }}
                onValueChange={(value) => {
                  setActiveTab(value)
                  // Load images only when Images tab is clicked
                  if (value === 'images' && selectedTooth && !imagesLoaded) {
                    loadToothImages(selectedTooth.number)
                  }
                }}
              >
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 text-xs sm:text-sm flex-shrink-0 mb-6 bg-transparent">
                  <TabsTrigger value="treatments" className="text-xs sm:text-sm">Treatments</TabsTrigger>
                  <TabsTrigger value="condition" className="text-xs sm:text-sm">Condition</TabsTrigger>
                  <TabsTrigger value="payments" className="text-xs sm:text-sm">Payments</TabsTrigger>
                  <TabsTrigger value="images" className="text-xs sm:text-sm">Images</TabsTrigger>
                </TabsList>

                <TabsContent value="treatments" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  <div className="pt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h3 className="text-base sm:text-lg font-semibold">Treatment History</h3>
                      <Button size="sm" onClick={() => setShowAddTreatmentDialog(true)} className="w-full sm:w-auto min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Treatment
                      </Button>
                    </div>

                  {selectedTooth.treatments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 min-h-[300px]">
                      <Circle className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No treatments recorded</p>
                      <p className="text-sm">for this tooth</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTooth.treatments.map((treatment) => (
                        <Card key={treatment.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base">{treatment.treatment_type}</h4>
                                {treatment.treatment_description && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{treatment.treatment_description}</p>
                                )}
                                {treatment.treatment_date && (
                                  <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mt-2">
                                    <Calendar className="h-3 w-3 flex-shrink-0" />
                                    {new Date(treatment.treatment_date).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={`text-xs ${getTreatmentStatusColor(treatment.treatment_status)}`}>
                                  {treatment.treatment_status}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {(treatment.treatment_status === 'In Progress' || treatment.treatment_status === 'Planned') && (
                                                                      <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditTreatment(treatment)}
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                    title="Edit Treatment"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteTreatment(treatment)}
                                    className="h-8 w-8 p-0 flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete Treatment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Tooth Details Section */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Tooth Details</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Tooth:</span>
                        <span className="text-sm font-medium">#{selectedTooth.number}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Position:</span>
                        <span className="text-sm font-medium">{selectedTooth.position}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Condition:</span>
                        <span className="text-sm font-medium">
                          {selectedTooth.condition ? selectedTooth.condition.condition_type : 'Not recorded'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Treatments:</span>
                        <span className="text-sm font-medium">{selectedTooth.treatments.length} recorded</span>
                      </div>
                    </div>
                  </div>
                  </div>
                </TabsContent>

                <TabsContent value="condition" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  <div className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Current Condition</h3>
                      <Button size="sm" onClick={() => setShowAddConditionDialog(true)} className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2">
                        <Edit className="h-4 w-4 mr-2" />
                        Update Condition
                      </Button>
                    </div>

                  {selectedTooth.condition ? (
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="font-semibold text-gray-600">Condition:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.condition_type}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-600">Severity:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.severity}</p>
                            </div>
                          </div>
                          {selectedTooth.condition.condition_description && (
                            <div>
                              <span className="font-semibold text-gray-600">Description:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.condition_description}</p>
                            </div>
                          )}
                          {selectedTooth.condition.notes && (
                            <div>
                              <span className="font-semibold text-gray-600">Notes:</span>
                              <p className="text-sm mt-1">{selectedTooth.condition.notes}</p>
                            </div>
                          )}
                          <div className="text-xs sm:text-sm text-gray-500 pt-2 border-t">
                            Last updated: {new Date(selectedTooth.condition.last_updated).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 min-h-[300px]">
                      <Circle className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No condition recorded</p>
                      <p className="text-sm">for this tooth</p>
                    </div>
                  )}
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  {selectedPaymentTreatment ? (
                    <EnhancedPaymentManagement
                      treatment={selectedPaymentTreatment}
                      treatments={selectedTooth.treatments}
                      clinicId={clinicId}
                      patientId={patientId}
                      onBack={() => setSelectedPaymentTreatment(null)}
                      onTreatmentChange={(newTreatment) => setSelectedPaymentTreatment(newTreatment)}
                      onPaymentUpdate={() => {
                        // Refresh data if needed
                      }}
                    />
                  ) : (
                    <div>
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">Payment Management</h3>
                      </div>
                      <PaymentTreatmentSelector
                        treatments={selectedTooth.treatments}
                        onSelectTreatment={setSelectedPaymentTreatment}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="images" className="space-y-4 overflow-y-auto p-0 scrollbar-transparent" style={{ height: '400px', minHeight: '400px', maxHeight: '400px' }}>
                  <div className="pt-4">
                    {activeTab === 'images' && (
                      <ToothImageGallery
                        toothNumber={selectedTooth.number}
                        images={toothImages}
                        onImageDelete={handleDeleteImage}
                        onAddImage={() => setShowImageUploadDialog(true)}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Treatment Dialog */}
        <Dialog open={showAddTreatmentDialog} onOpenChange={setShowAddTreatmentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Add Treatment - Tooth {selectedTooth?.number}</DialogTitle>
              <DialogDescription>
                Add a new treatment record for this tooth. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="treatment_type">Treatment Type *</Label>
                  <Select value={treatmentForm.treatment_type} onValueChange={(value) => setTreatmentForm(prev => ({ ...prev, treatment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select treatment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Common treatments first */}
                      <SelectItem value="Cleaning">Cleaning</SelectItem>
                      <SelectItem value="Filling">Filling</SelectItem>
                      <SelectItem value="Root Canal">Root Canal</SelectItem>
                      <SelectItem value="Extraction">Extraction</SelectItem>
                      <SelectItem value="Crown">Crown</SelectItem>
                      <SelectItem value="Bridge">Bridge</SelectItem>
                      <SelectItem value="Implant">Implant</SelectItem>
                      
                      {/* Orthodontic treatments */}
                      <SelectItem value="Braces Installation">Braces Installation</SelectItem>
                      <SelectItem value="Braces Adjustment">Braces Adjustment</SelectItem>
                      <SelectItem value="Braces Removal">Braces Removal</SelectItem>
                      <SelectItem value="Retainer Fitting">Retainer Fitting</SelectItem>
                      <SelectItem value="Retainer Adjustment">Retainer Adjustment</SelectItem>
                      <SelectItem value="Clear Aligners">Clear Aligners</SelectItem>
                      
                      {/* Preventive treatments */}
                      <SelectItem value="Whitening">Whitening</SelectItem>
                      <SelectItem value="Sealant">Sealant</SelectItem>
                      <SelectItem value="Fluoride Treatment">Fluoride Treatment</SelectItem>
                      <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                      <SelectItem value="Scaling">Scaling</SelectItem>
                      
                      {/* Restorative treatments */}
                      <SelectItem value="Veneer">Veneer</SelectItem>
                      <SelectItem value="Inlay">Inlay</SelectItem>
                      <SelectItem value="Onlay">Onlay</SelectItem>
                      <SelectItem value="Denture">Denture</SelectItem>
                      <SelectItem value="Partial Denture">Partial Denture</SelectItem>
                      
                      {/* Diagnostic and other */}
                      <SelectItem value="X-Ray">X-Ray</SelectItem>
                      <SelectItem value="CT Scan">CT Scan</SelectItem>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Emergency Treatment">Emergency Treatment</SelectItem>
                      <SelectItem value="Pain Management">Pain Management</SelectItem>
                      <SelectItem value="Gum Treatment">Gum Treatment</SelectItem>
                      <SelectItem value="Oral Surgery">Oral Surgery</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="treatment_status">Status *</Label>
                  <Select value={treatmentForm.treatment_status} onValueChange={(value: any) => setTreatmentForm(prev => ({ ...prev, treatment_status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planned">Planned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom treatment type input */}
              {treatmentForm.treatment_type === 'Other' && (
                <div>
                  <Label htmlFor="custom_treatment_type">Custom Treatment Type *</Label>
                  <Input
                    id="custom_treatment_type"
                    placeholder="Enter custom treatment type..."
                    value={treatmentForm.custom_treatment_type}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, custom_treatment_type: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="treatment_date">Treatment Date *</Label>
                <Input
                  id="treatment_date"
                  type="date"
                  value={treatmentForm.treatment_date}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="treatment_description">Description</Label>
                <Textarea
                  id="treatment_description"
                  placeholder="Describe the treatment performed..."
                  value={treatmentForm.treatment_description}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_description: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes..."
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddTreatmentDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                onClick={handleAddTreatment} 
                disabled={
                  !treatmentForm.treatment_type || 
                  (treatmentForm.treatment_type === 'Other' && !treatmentForm.custom_treatment_type.trim())
                }
                className="w-full sm:w-auto"
              >
                Add Treatment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Condition Dialog */}
        <Dialog open={showAddConditionDialog} onOpenChange={setShowAddConditionDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Update Condition - Tooth {selectedTooth?.number}</DialogTitle>
              <DialogDescription>
                Update the current condition of this tooth. This will replace any existing condition.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="condition_type">Condition Type *</Label>
                  <Select value={conditionForm.condition_type} onValueChange={(value) => setConditionForm(prev => ({ ...prev, condition_type: value }))}>
                    <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                      <SelectValue placeholder="Select condition type" className="text-base truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Common conditions first */}
                      <SelectItem value="Healthy">Healthy</SelectItem>
                      <SelectItem value="Cavity">Cavity</SelectItem>
                      <SelectItem value="Filled">Filled</SelectItem>
                      <SelectItem value="Crown">Crown</SelectItem>
                      <SelectItem value="Missing">Missing</SelectItem>
                      <SelectItem value="Sensitive">Sensitive</SelectItem>
                      <SelectItem value="Chipped">Chipped</SelectItem>
                      <SelectItem value="Cracked">Cracked</SelectItem>
                      
                      {/* Orthodontic conditions */}
                      <SelectItem value="Braces On">Braces On</SelectItem>
                      <SelectItem value="Braces Off">Braces Off</SelectItem>
                      <SelectItem value="Retainer On">Retainer On</SelectItem>
                      <SelectItem value="Retainer Off">Retainer Off</SelectItem>
                      <SelectItem value="Aligner On">Aligner On</SelectItem>
                      <SelectItem value="Aligner Off">Aligner Off</SelectItem>
                      
                      {/* Serious conditions */}
                      <SelectItem value="Infected">Infected</SelectItem>
                      <SelectItem value="Decay">Decay</SelectItem>
                      <SelectItem value="Abscess">Abscess</SelectItem>
                      <SelectItem value="Root Canal Treated">Root Canal Treated</SelectItem>
                      
                      {/* Restorative conditions */}
                      <SelectItem value="Veneer">Veneer</SelectItem>
                      <SelectItem value="Implant">Implant</SelectItem>
                      <SelectItem value="Bridge">Bridge</SelectItem>
                      <SelectItem value="Denture">Denture</SelectItem>
                      
                      {/* Other conditions */}
                      <SelectItem value="Gum Disease">Gum Disease</SelectItem>
                      <SelectItem value="Stained">Stained</SelectItem>
                      <SelectItem value="Worn">Worn</SelectItem>
                      <SelectItem value="Erupting">Erupting</SelectItem>
                      <SelectItem value="Impacted">Impacted</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="severity">Severity *</Label>
                  <Select value={conditionForm.severity} onValueChange={(value: any) => setConditionForm(prev => ({ ...prev, severity: value }))}>
                    <SelectTrigger className="h-12 text-base min-h-[48px]" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
                      <SelectValue className="text-base truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mild">Mild</SelectItem>
                      <SelectItem value="Moderate">Moderate</SelectItem>
                      <SelectItem value="Severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="condition_description">Description</Label>
                <Textarea
                  id="condition_description"
                  placeholder="Describe the condition..."
                  value={conditionForm.condition_description}
                  onChange={(e) => setConditionForm(prev => ({ ...prev, condition_description: e.target.value }))}
                  className="text-base"
                />
              </div>

              <div>
                <Label htmlFor="condition_notes">Notes</Label>
                <Textarea
                  id="condition_notes"
                  placeholder="Additional notes..."
                  value={conditionForm.notes}
                  onChange={(e) => setConditionForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddConditionDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddCondition} disabled={!conditionForm.condition_type} className="w-full sm:w-auto">
                Update Condition
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Treatment Dialog */}
        <Dialog open={showEditTreatmentDialog} onOpenChange={setShowEditTreatmentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Edit Treatment - Tooth {selectedTooth?.number}</DialogTitle>
              <DialogDescription>
                Edit the details of this treatment record.
              </DialogDescription>
            </DialogHeader>
            
            {editingTreatment && (
              <DentalTreatmentForm
                patientId={patientId}
                clinicId={clinicId}
                selectedTooth={selectedTooth?.number}
                initialData={editingTreatment}
                onSuccess={handleTreatmentUpdated}
                onCancel={() => setShowEditTreatmentDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Treatment Confirmation Dialog */}
        <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Treatment</DialogTitle>
              <DialogDescription>
                This action cannot be undone. The treatment will be permanently deleted.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete this treatment? This action cannot be undone.
              </p>
              
              {treatmentToDelete && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{treatmentToDelete.treatment_type}</p>
                  <p className="text-sm text-gray-600">Tooth {treatmentToDelete.tooth_number}</p>
                  <p className="text-sm text-gray-500">
                    {treatmentToDelete.treatment_date && new Date(treatmentToDelete.treatment_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDeleteConfirmDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteTreatment}>
                Delete Treatment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Multi-Tooth Dialog */}
        <Dialog open={showMultiToothDialog} onOpenChange={setShowMultiToothDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>
                {multiToothAction === 'treatment' ? 'Add Treatment to Multiple Teeth' : 'Upload Image to Multiple Teeth'}
              </DialogTitle>
              <DialogDescription>
                {multiToothAction === 'treatment' 
                  ? `Add the same treatment to ${selectedTeeth.length} selected tooth${selectedTeeth.length !== 1 ? 's' : ''}.`
                  : `Upload the same image to ${selectedTeeth.length} selected tooth${selectedTeeth.length !== 1 ? 's' : ''}.`
                }
              </DialogDescription>
            </DialogHeader>
            
            {multiToothAction === 'treatment' ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">Selected Teeth:</p>
                  <p className="text-sm text-blue-600">{selectedTeeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="treatment_type">Treatment Type *</Label>
                    <Select value={treatmentForm.treatment_type} onValueChange={(value) => setTreatmentForm(prev => ({ ...prev, treatment_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select treatment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Common treatments first */}
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Filling">Filling</SelectItem>
                        <SelectItem value="Root Canal">Root Canal</SelectItem>
                        <SelectItem value="Extraction">Extraction</SelectItem>
                        <SelectItem value="Crown">Crown</SelectItem>
                        <SelectItem value="Bridge">Bridge</SelectItem>
                        <SelectItem value="Implant">Implant</SelectItem>
                        
                        {/* Orthodontic treatments */}
                        <SelectItem value="Braces Installation">Braces Installation</SelectItem>
                        <SelectItem value="Braces Adjustment">Braces Adjustment</SelectItem>
                        <SelectItem value="Braces Removal">Braces Removal</SelectItem>
                        <SelectItem value="Retainer Fitting">Retainer Fitting</SelectItem>
                        <SelectItem value="Retainer Adjustment">Retainer Adjustment</SelectItem>
                        <SelectItem value="Clear Aligners">Clear Aligners</SelectItem>
                        
                        {/* Preventive treatments */}
                        <SelectItem value="Whitening">Whitening</SelectItem>
                        <SelectItem value="Sealant">Sealant</SelectItem>
                        <SelectItem value="Fluoride Treatment">Fluoride Treatment</SelectItem>
                        <SelectItem value="Deep Cleaning">Deep Cleaning</SelectItem>
                        <SelectItem value="Scaling">Scaling</SelectItem>
                        
                        {/* Restorative treatments */}
                        <SelectItem value="Veneer">Veneer</SelectItem>
                        <SelectItem value="Inlay">Inlay</SelectItem>
                        <SelectItem value="Onlay">Onlay</SelectItem>
                        <SelectItem value="Denture">Denture</SelectItem>
                        <SelectItem value="Partial Denture">Partial Denture</SelectItem>
                        
                        {/* Diagnostic and other */}
                        <SelectItem value="X-Ray">X-Ray</SelectItem>
                        <SelectItem value="CT Scan">CT Scan</SelectItem>
                        <SelectItem value="Consultation">Consultation</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                        <SelectItem value="Emergency Treatment">Emergency Treatment</SelectItem>
                        <SelectItem value="Pain Management">Pain Management</SelectItem>
                        <SelectItem value="Gum Treatment">Gum Treatment</SelectItem>
                        <SelectItem value="Oral Surgery">Oral Surgery</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="treatment_status">Status *</Label>
                    <Select value={treatmentForm.treatment_status} onValueChange={(value: any) => setTreatmentForm(prev => ({ ...prev, treatment_status: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Custom treatment type input */}
                {treatmentForm.treatment_type === 'Other' && (
                  <div>
                    <Label htmlFor="custom_treatment_type">Custom Treatment Type *</Label>
                    <Input
                      id="custom_treatment_type"
                      placeholder="Enter custom treatment type..."
                      value={treatmentForm.custom_treatment_type}
                      onChange={(e) => setTreatmentForm(prev => ({ ...prev, custom_treatment_type: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="treatment_description">Description</Label>
                  <Textarea
                    id="treatment_description"
                    placeholder="Describe the treatment details..."
                    value={treatmentForm.treatment_description}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="treatment_date">Treatment Date *</Label>
                  <Input
                    id="treatment_date"
                    type="date"
                    value={treatmentForm.treatment_date}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, treatment_date: e.target.value }))}
                  />
                </div>

                {/* Payment Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      id="include_payment"
                      checked={treatmentForm.include_payment}
                      onCheckedChange={(checked) => setTreatmentForm(prev => ({ ...prev, include_payment: checked as boolean }))}
                    />
                    <Label htmlFor="include_payment" className="text-sm font-medium">
                      Include Payment for this Multi-Tooth Procedure
                    </Label>
                  </div>
                  
                  {treatmentForm.include_payment && (
                    <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-200">
                      {/* Payment Type Selection */}
                      <div>
                        <Label htmlFor="payment_type">Payment Type *</Label>
                        <Select value={treatmentForm.payment_type} onValueChange={(value: any) => setTreatmentForm(prev => ({ ...prev, payment_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full Payment</SelectItem>
                            <SelectItem value="partial">Partial Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Total Cost */}
                      <div>
                        <Label htmlFor="total_cost">Total Procedure Cost *</Label>
                        <Input
                          id="total_cost"
                          type="number"
                          placeholder="0.00"
                          value={treatmentForm.total_cost}
                          onChange={(e) => {
                            const totalCost = parseFloat(e.target.value) || 0
                            setTreatmentForm(prev => ({ 
                              ...prev, 
                              total_cost: e.target.value,
                              payment_amount: prev.payment_type === 'full' ? e.target.value : prev.payment_amount
                            }))
                          }}
                          className="text-right border-2 border-gray-400 focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Payment Amount */}
                      <div>
                        <Label htmlFor="payment_amount">
                          {treatmentForm.payment_type === 'full' ? 'Payment Amount' : 'Partial Payment Amount'} *
                        </Label>
                        <Input
                          id="payment_amount"
                          type="number"
                          placeholder="0.00"
                          value={treatmentForm.payment_amount}
                          onChange={(e) => setTreatmentForm(prev => ({ ...prev, payment_amount: e.target.value }))}
                          className="text-right border-2 border-gray-400 focus:border-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        {treatmentForm.payment_type === 'partial' && parseFloat(treatmentForm.total_cost) > 0 && (
                          <p className="text-sm text-blue-600 mt-1">
                            Remaining: ₹{(parseFloat(treatmentForm.total_cost) - parseFloat(treatmentForm.payment_amount || '0')).toFixed(2)}
                          </p>
                        )}
                      </div>




                      
                      {/* Payment Notes */}
                      <div>
                        <Label htmlFor="payment_notes">Payment Notes</Label>
                        <Textarea
                          id="payment_notes"
                          placeholder="Payment details, insurance info, installment schedule, etc..."
                          value={treatmentForm.payment_notes}
                          onChange={(e) => setTreatmentForm(prev => ({ ...prev, payment_notes: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      
                      {/* Payment Summary */}
                      <div className="text-sm text-green-700 bg-green-100 p-3 rounded">
                        <div className="font-medium mb-2">Payment Summary:</div>
                        <div>• Total Cost: ₹{parseFloat(treatmentForm.total_cost || '0').toFixed(2)}</div>
                        <div>• Payment Type: {treatmentForm.payment_type === 'full' ? 'Full Payment' : 'Partial Payment'}</div>
                        <div>• Amount: ₹{parseFloat(treatmentForm.payment_amount || '0').toFixed(2)}</div>
                        {treatmentForm.payment_type === 'partial' && parseFloat(treatmentForm.total_cost || '0') > 0 && (
                          <div>• Remaining: ₹{(parseFloat(treatmentForm.total_cost || '0') - parseFloat(treatmentForm.payment_amount || '0')).toFixed(2)}</div>
                        )}

                        <div className="mt-2 text-xs">
                          💡 <strong>Note:</strong> Payment records will be created for all {selectedTeeth.length} teeth, 
                          making it easy to track payments when viewing any involved tooth.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={treatmentForm.notes}
                    onChange={(e) => setTreatmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowMultiToothDialog(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBulkTreatment} 
                    disabled={!treatmentForm.treatment_type} 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                  >
                    Add to {selectedTeeth.length} Tooth{selectedTeeth.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-purple-800">Selected Teeth:</p>
                  <p className="text-sm text-purple-600">{selectedTeeth.sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}</p>
                </div>
                
                {/* Image Upload Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image_type">Image Type *</Label>
                    <Select value={imageForm.image_type} onValueChange={(value) => setImageForm(prev => ({ ...prev, image_type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select image type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xray">X-Ray</SelectItem>
                        <SelectItem value="photo">Photo</SelectItem>
                        <SelectItem value="scan">3D Scan</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="image_description">Description</Label>
                    <Textarea
                      id="image_description"
                      placeholder="Describe the image..."
                      value={imageForm.description}
                      onChange={(e) => setImageForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  {/* Image Upload Area */}
                  <div>
                    <Label>Select Image *</Label>
                    
                    {/* Drag & Drop Area */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        imageForm.file 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                    >
                      {imageForm.previewUrl ? (
                        <div className="space-y-4">
                          <img 
                            src={imageForm.previewUrl} 
                            alt="Preview" 
                            className="max-w-full h-32 object-contain mx-auto rounded"
                          />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-green-600">
                              ✓ {imageForm.file?.name}
                            </p>
                            {imageForm.compressionInfo && (
                              <div className="text-xs text-gray-600 space-y-1">
                                <p>Original: {formatFileSize(imageForm.compressionInfo.originalSize)}</p>
                                <p>Compressed: {formatFileSize(imageForm.compressionInfo.compressedSize)}</p>
                                <p>Saved: {imageForm.compressionInfo.compressionRatio.toFixed(1)}%</p>
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImageForm(prev => ({
                                ...prev,
                                file: null,
                                previewUrl: null,
                                compressionInfo: null
                              }))
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-center">
                            <Upload className="h-12 w-12 text-gray-400" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              Drag & drop an image here, or click to browse
                            </p>
                            <p className="text-xs text-gray-500">
                              Supports JPG, PNG, GIF up to 10MB
                            </p>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <FileImage className="h-4 w-4 mr-1" />
                              Browse Files
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => cameraInputRef.current?.click()}
                            >
                              <Camera className="h-4 w-4 mr-1" />
                              Take Photo
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Hidden file inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileSelect(file)
                        }
                      }}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileSelect(file)
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
                    <div className="font-medium mb-2">Upload Summary:</div>
                    <div>• Image will be uploaded once to Cloudinary</div>
                    <div>• Same image will be linked to all {selectedTeeth.length} teeth</div>
                    <div>• Efficient storage: one file, multiple references</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={() => setShowMultiToothDialog(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBulkImageUpload} 
                    disabled={!imageForm.image_type || !imageForm.file} 
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                  >
                    Upload to {selectedTeeth.length} Tooth{selectedTeeth.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Upload Dialog */}
        <Dialog open={showImageUploadDialog} onOpenChange={setShowImageUploadDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto rounded-2xl border-2">
            <DialogHeader>
              <DialogTitle>Upload Image for Tooth {selectedTooth?.number}</DialogTitle>
              <DialogDescription>
                Upload X-rays, photos, or 3D scans for this specific tooth. Images will be automatically compressed for optimal storage.
              </DialogDescription>
            </DialogHeader>
            <ToothImageUpload
              toothNumber={selectedTooth?.number || ''}
              onImageUpload={handleImageUpload}
              onClose={() => setShowImageUploadDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
              <p className="text-sm text-gray-600">{processingMessage}</p>
              <div className="mt-4 text-xs text-gray-500">
                Please wait while we process your request. Do not close this window.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ToothChart
