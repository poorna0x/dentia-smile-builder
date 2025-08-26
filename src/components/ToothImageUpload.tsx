import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Camera, 
  X, 
  Loader2, 
  Image as ImageIcon,
  FileImage,
  AlertCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { compressImage, validateImageFile, formatFileSize } from '@/lib/image-compression';

export interface ToothImage {
  id: string;
  url: string;
  type: 'xray' | 'photo' | 'scan';
  description: string;
  uploaded_at: string;
  size: number;
  public_id: string;
}

interface ToothImageUploadProps {
  toothNumber: string;
  onImageUpload: (image: ToothImage) => void;
  onClose: () => void;
}

export default function ToothImageUpload({ 
  toothNumber, 
  onImageUpload, 
  onClose 
}: ToothImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'xray' | 'photo' | 'scan'>('xray');
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<{
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Compress image
    try {
      const compressed = await compressImage(file);
      setCompressionInfo({
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio,
      });
      setSelectedFile(compressed.file);
    } catch (error) {
      console.error('Compression failed:', error);
      toast({
        title: "Compression failed",
        description: "Using original image",
        variant: "destructive"
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image to upload",
        variant: "destructive"
      });
      return;
    }

    // Description is now optional
    // if (!description.trim()) {
    //   toast({
    //     title: "Description required",
    //     description: "Please add a description for the image",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    setUploading(true);

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        throw new Error('Cloudinary cloud name not configured');
      }

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('upload_preset', 'dental_clinic');
      formData.append('folder', `dental-clinic/tooth-${toothNumber}`);
      formData.append('tags', `${imageType},tooth-${toothNumber},dental`);

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

      const imageData: ToothImage = {
        id: result.public_id,
        url: result.secure_url,
        type: imageType,
        description: description.trim(),
        uploaded_at: new Date().toISOString(),
        size: selectedFile.size,
        public_id: result.public_id,
      };

      onImageUpload(imageData);
      
      toast({
        title: "Upload successful",
        description: `Image uploaded for tooth ${toothNumber}`,
      });

      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getImageTypeIcon = (type: string) => {
    switch (type) {
      case 'xray':
        return '🦷';
      case 'photo':
        return '📷';
      case 'scan':
        return '🔬';
      default:
        return '🖼️';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Upload Image for Tooth {toothNumber}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Image Type Selection */}
          <div className="space-y-2">
            <Label>Image Type</Label>
            <Select value={imageType} onValueChange={(value: any) => setImageType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xray">
                  <span className="flex items-center gap-2">
                    🦷 X-Ray
                  </span>
                </SelectItem>
                <SelectItem value="photo">
                  <span className="flex items-center gap-2">
                    📷 Photo
                  </span>
                </SelectItem>
                <SelectItem value="scan">
                  <span className="flex items-center gap-2">
                    🔬 3D Scan
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Area */}
          <div className="space-y-2">
            <Label>Select Image</Label>
            <div
              className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors ${
                uploading ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {!selectedFile ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <FileImage className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setCompressionInfo(null);
                    }}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              )}
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
          </div>

          {/* Compression Info */}
          {compressionInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Image Optimized</span>
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p>Original: {formatFileSize(compressionInfo.originalSize)}</p>
                <p>Compressed: {formatFileSize(compressionInfo.compressedSize)}</p>
                <p>Saved: {Math.round(compressionInfo.compressionRatio * 100)}%</p>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Describe the image (e.g., 'Cavity on upper right molar', 'Before treatment photo')"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={uploading}
            />
          </div>

          {/* Upload Button */}
          <div className="flex gap-2 justify-end">
            {/* Debug info - remove this later */}
            <div className="text-xs text-gray-500 mr-2">
              File: {selectedFile ? '✓' : '✗'} | 
              Uploading: {uploading ? '✓' : '✗'}
            </div>
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || uploading}
              className={`flex items-center gap-2 ${
                !selectedFile || uploading 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Image
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
