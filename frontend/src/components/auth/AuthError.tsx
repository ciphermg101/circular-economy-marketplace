'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { errorHandler, AppError } from '@/lib/error-handler'
import { Alert } from '@/components/ui/Alert'

interface AuthErrorProps {
  error?: unknown
  redirectTo?: string
}

export function AuthError({ error, redirectTo }: AuthErrorProps) {
  const router = useRouter()

  useEffect(() => {
    if (redirectTo) {
      const timer = setTimeout(() => {
        router.push(redirectTo)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [redirectTo, router])

  const normalizedError = useMemo<AppError | null>(() => {
    if (!error) return null
    return errorHandler.handle(error, { location: 'AuthError component' })
  }, [error])

  if (!normalizedError) return null

  return (
    <Alert variant="error" className="mb-4">
      {redirectTo && (
        <p className="mt-2 text-sm">
          You will be redirected in 5 seconds. Click{' '}
          <button
            onClick={() => router.push(redirectTo)}
            className="text-primary-600 hover:underline"
          >
            here
          </button>{' '}
          to go immediately.
        </p>
      )}
    </Alert>
  )
}
