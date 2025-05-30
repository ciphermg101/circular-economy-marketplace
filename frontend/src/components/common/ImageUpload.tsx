import { useCallback, useState } from 'react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'

interface ImageUploadProps {
  images: string[]
  onChange: (files: File[]) => void
  onRemove: (index: number) => void
  maxFiles?: number
  maxSize?: number // in bytes
}

export function ImageUpload({
  images,
  onChange,
  onRemove,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024 // 5MB
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => {
        if (file.size > maxSize) {
          return 'File is too large. Maximum size is 5MB.'
        }
        return 'Invalid file type. Only images are allowed.'
      })
      setError(errors[0])
      return
    }

    // Check if we would exceed maxFiles
    if (images.length + acceptedFiles.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images.`)
      return
    }

    setError(null)
    onChange(acceptedFiles)
  }, [images.length, maxFiles, maxSize, onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize,
    multiple: true
  })

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-gray-600 dark:text-gray-400">
            {isDragActive ? (
              <p>Drop the files here...</p>
            ) : (
              <>
                <p>Drag and drop images here, or click to select files</p>
                <p className="text-sm">
                  PNG, JPG, JPEG or WebP (max. {maxFiles} files, {(maxSize / (1024 * 1024)).toFixed(0)}MB each)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Image preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <Image
                src={image}
                alt={`Uploaded image ${index + 1}`}
                fill
                className="object-cover rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onRemove(index)
                }}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0
                         group-hover:opacity-100 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 