"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, File, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentUploadProps {
  onUpload: (files: File[]) => void
  acceptedTypes?: string[]
  maxSize?: number // in MB
  multiple?: boolean
  label: string
}

export function DocumentUpload({
  onUpload,
  acceptedTypes = [".pdf", ".jpg", ".jpeg", ".png"],
  maxSize = 5,
  multiple = false,
  label,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `File size must be less than ${maxSize}MB`,
        variant: "destructive",
      })
      return false
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()
    if (!acceptedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid file type",
        description: `Accepted types: ${acceptedTypes.join(", ")}`,
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleFiles = (files: FileList) => {
    const validFiles: File[] = []

    Array.from(files).forEach((file) => {
      if (validateFile(file)) {
        validFiles.push(file)
      }
    })

    if (validFiles.length > 0) {
      const newFiles = multiple ? [...uploadedFiles, ...validFiles] : validFiles
      setUploadedFiles(newFiles)
      onUpload(newFiles)

      toast({
        title: "Success",
        description: `${validFiles.length} file(s) uploaded successfully`,
      })
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onUpload(newFiles)
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">{label}</p>
        <p className="text-xs text-gray-500 mb-4">Drag and drop files here, or click to select</p>
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
          Select Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(",")}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <p className="text-xs text-gray-500 mt-2">
          Max size: {maxSize}MB. Accepted: {acceptedTypes.join(", ")}
        </p>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center space-x-2">
                <File className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{file.name}</span>
                <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
