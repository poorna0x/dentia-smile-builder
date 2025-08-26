import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image as ImageIcon, 
  Download, 
  Eye, 
  Trash2, 
  X,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatFileSize } from '@/lib/image-compression';
import { ToothImage } from './ToothImageUpload';

interface ToothImageGalleryProps {
  toothNumber: string;
  images: ToothImage[];
  onImageDelete: (imageId: string) => void;
  onAddImage: () => void;
}

export default function ToothImageGallery({ 
  toothNumber, 
  images, 
  onImageDelete, 
  onAddImage 
}: ToothImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ToothImage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const getImagesByType = (type: string) => {
    return images.filter(img => img.type === type);
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

  const getImageTypeLabel = (type: string) => {
    switch (type) {
      case 'xray':
        return 'X-Rays';
      case 'photo':
        return 'Photos';
      case 'scan':
        return '3D Scans';
      default:
        return 'Images';
    }
  };

  const handleDelete = async (image: ToothImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    setDeleting(image.id);
    try {
      onImageDelete(image.id);
      toast({
        title: "Image deleted",
        description: "Image has been deleted successfully",
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (image: ToothImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tooth-${toothNumber}-${image.type}-${new Date(image.uploaded_at).toISOString().split('T')[0]}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: "Image download has started",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download image. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">No images for tooth {toothNumber}</p>
            <Button onClick={onAddImage} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Image
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Images for Tooth {toothNumber}</h3>
          <Badge variant="outline">{images.length} total</Badge>
        </div>
        <Button onClick={onAddImage} size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Image
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Images</TabsTrigger>
          <TabsTrigger value="xray">X-Rays</TabsTrigger>
          <TabsTrigger value="photo">Photos</TabsTrigger>
          <TabsTrigger value="scan">Scans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onView={setSelectedImage}
                deleting={deleting === image.id}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="xray" className="mt-4">
          {getImagesByType('xray').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getImagesByType('xray').map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onView={setSelectedImage}
                  deleting={deleting === image.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl">🦷</span>
              <p>No X-rays for tooth {toothNumber}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="photo" className="mt-4">
          {getImagesByType('photo').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getImagesByType('photo').map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onView={setSelectedImage}
                  deleting={deleting === image.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl">📷</span>
              <p>No photos for tooth {toothNumber}</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="scan" className="mt-4">
          {getImagesByType('scan').length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getImagesByType('scan').map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onView={setSelectedImage}
                  deleting={deleting === image.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-2xl">🔬</span>
              <p>No 3D scans for tooth {toothNumber}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100"
            >
              <X className="h-6 w-6" />
            </Button>
            
            <img
              src={selectedImage.url}
              alt={selectedImage.description}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedImage.description}</p>
                  <p className="text-sm opacity-75">
                    {new Date(selectedImage.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(selectedImage)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Image Card Component
interface ImageCardProps {
  image: ToothImage;
  onDelete: (image: ToothImage) => void;
  onDownload: (image: ToothImage) => void;
  onView: (image: ToothImage) => void;
  deleting: boolean;
}

function ImageCard({ image, onDelete, onDownload, onView, deleting }: ImageCardProps) {
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
    <Card className="group relative overflow-hidden">
      <div className="relative h-48 bg-gray-100">
        <img
          src={image.url}
          alt={image.description}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => onView(image)}
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onView(image)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onDownload(image)}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(image)}
              disabled={deleting}
              className="h-8 w-8 p-0"
            >
              {deleting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getImageTypeIcon(image.type)}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {image.type}
            </Badge>
          </div>
          <span className="text-xs text-gray-500">
            {formatFileSize(image.size)}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 truncate" title={image.description}>
          {image.description}
        </p>
        
        <p className="text-xs text-gray-400 mt-1">
          {new Date(image.uploaded_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}
