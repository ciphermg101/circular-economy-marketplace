import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from 'react'

import { Transition } from '@headlessui/react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

const iconClasses = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
}

const bgColors = {
  success: 'bg-green-50',
  error: 'bg-red-50',
  info: 'bg-blue-50',
}

const borderColors = {
  success: 'border-green-200',
  error: 'border-red-200',
  info: 'border-blue-200',
}

const ToastComponent: React.FC<{
  toast: Toast
  onRemove: (id: number) => void
}> = ({ toast, onRemove }) => {
  const [isShowing, setIsShowing] = useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowing(false)
      setTimeout(() => onRemove(toast.id), 200) // wait for animation
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const Icon =
    toast.type === 'success'
      ? CheckCircleIcon
      : toast.type === 'error'
      ? ExclamationCircleIcon
      : InformationCircleIcon

  return (
    <Transition
      show={isShowing}
      enter="transform transition duration-300 ease-out"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="transform transition duration-200 ease-in"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
      className={`max-w-sm w-full rounded-lg border px-4 py-3 shadow-lg flex items-center gap-3 ${bgColors[toast.type]} ${borderColors[toast.type]}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`h-6 w-6 flex-shrink-0 ${iconClasses[toast.type]}`} />
      <div className="flex-1 text-sm font-medium text-gray-900">
        {toast.message}
      </div>
      <button
        aria-label="Close notification"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => {
          setIsShowing(false)
          setTimeout(() => onRemove(toast.id), 200)
        }}
      >
        <XMarkIcon className="h-5 w-5 text-gray-700" />
      </button>
    </Transition>
  )
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 5000) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    []
  )

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
