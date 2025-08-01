"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, X, File, Image, FileType, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface FileWithStatus {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface DocumentUploadDialogProps {
  projectId: string
}

export function DocumentUploadDialog({ projectId }: DocumentUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [filesWithStatus, setFilesWithStatus] = useState<FileWithStatus[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const validateFiles = (files: File[]) => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ]
    
    return files.map(file => {
      let error: string | undefined
      
      if (!validTypes.includes(file.type)) {
        error = 'Unsupported file type'
      } else if (file.size > 10 * 1024 * 1024) {
        error = 'File size must be less than 10MB'
      }
      
      return {
        file,
        status: error ? 'error' as const : 'pending' as const,
        progress: 0,
        error
      }
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validatedFiles = validateFiles(files)
    
    // Show error toasts for invalid files
    validatedFiles.forEach(fileWithStatus => {
      if (fileWithStatus.error) {
        toast.error(`${fileWithStatus.file.name}: ${fileWithStatus.error}`)
      }
    })
    
    setFilesWithStatus(prev => [...prev, ...validatedFiles])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validatedFiles = validateFiles(files)
    
    // Show error toasts for invalid files
    validatedFiles.forEach(fileWithStatus => {
      if (fileWithStatus.error) {
        toast.error(`${fileWithStatus.file.name}: ${fileWithStatus.error}`)
      }
    })
    
    setFilesWithStatus(prev => [...prev, ...validatedFiles])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeFile = (index: number) => {
    setFilesWithStatus(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-green-500" />
    } else if (mimeType.includes('pdf')) {
      return <FileType className="h-4 w-4 text-red-500" />
    } else if (mimeType.includes('document') || mimeType.includes('word')) {
      return <FileText className="h-4 w-4 text-blue-500" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  const handleUpload = async () => {
    const validFiles = filesWithStatus.filter(f => f.status !== 'error')
    
    if (validFiles.length === 0) {
      toast.error("No valid files to upload")
      return
    }

    setIsUploading(true)
    
    try {
      let successCount = 0
      
      for (let i = 0; i < validFiles.length; i++) {
        const fileWithStatus = validFiles[i]
        
        // Update status to uploading
        setFilesWithStatus(prev => 
          prev.map(f => 
            f.file === fileWithStatus.file 
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        )
        
        const formData = new FormData()
        formData.append('file', fileWithStatus.file)
        formData.append('projectId', projectId)
        
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            const error = await response.text()
            throw new Error(error || 'Upload failed')
          }
          
          // Update status to success
          setFilesWithStatus(prev => 
            prev.map(f => 
              f.file === fileWithStatus.file 
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          )
          
          successCount++
        } catch (error) {
          // Update status to error
          setFilesWithStatus(prev => 
            prev.map(f => 
              f.file === fileWithStatus.file 
                ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
                : f
            )
          )
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`)
      }
      
      // Auto-close dialog if all files uploaded successfully
      if (successCount === validFiles.length) {
        setTimeout(() => {
          setOpen(false)
          setFilesWithStatus([])
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
          router.refresh()
        }, 1500)
      }
    } catch (error) {
      toast.error("Upload process failed")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Drag and Drop Zone */}
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
              isDragOver 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drop files here or{" "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG (max 10MB each)
              </p>
            </div>
            <Input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              disabled={isUploading}
              className="hidden"
            />
          </div>
          
          {filesWithStatus.length > 0 && (
            <div className="space-y-2">
              <Label>Files ({filesWithStatus.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filesWithStatus.map((fileWithStatus, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(fileWithStatus.file.type)}
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {fileWithStatus.file.name}
                          </p>
                          {fileWithStatus.status === 'success' && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                          {fileWithStatus.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(fileWithStatus.file.size)}
                          </p>
                          
                          {fileWithStatus.status === 'error' && fileWithStatus.error && (
                            <>
                              <span className="text-xs">•</span>
                              <p className="text-xs text-red-500">{fileWithStatus.error}</p>
                            </>
                          )}
                        </div>
                        
                        {fileWithStatus.status === 'uploading' && (
                          <Progress value={fileWithStatus.progress} className="h-1" />
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading && fileWithStatus.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading || filesWithStatus.filter(f => f.status !== 'error').length === 0}
            >
              {isUploading ? "Uploading..." : `Upload ${filesWithStatus.filter(f => f.status !== 'error').length} File${filesWithStatus.filter(f => f.status !== 'error').length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}