interface LoadingProps {
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
  text?: string
}

export function Loading({ size = 'medium', fullScreen = false, text = 'Loading...' }: LoadingProps) {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'
    : 'flex items-center justify-center'

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`${sizeClasses[size]} border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
          role="status"
          aria-label="loading"
        />
        {text && (
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {text}
          </p>
        )}
      </div>
    </div>
  )
} 