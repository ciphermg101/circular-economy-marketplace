import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Transition } from '@headlessui/react'

type ToastType = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  type: ToastType
  duration?: number
  onClose: () => void
}

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

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  duration = 5000,
  onClose,
}) => {
  const [isShowing, setIsShowing] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShowing(false)
      setTimeout(onClose, 200) // wait for animation to finish
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const Icon =
    type === 'success'
      ? CheckCircleIcon
      : type === 'error'
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
      className={`max-w-sm w-full rounded-lg border px-4 py-3 shadow-lg flex items-center gap-3 ${bgColors[type]} ${borderColors[type]}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className={`h-6 w-6 flex-shrink-0 ${iconClasses[type]}`} />
      <div className="flex-1 text-sm font-medium text-gray-900">{message}</div>
      <button
        aria-label="Close notification"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => {
          setIsShowing(false)
          setTimeout(onClose, 200)
        }}
      >
        <XMarkIcon className="h-5 w-5 text-gray-700" />
      </button>
    </Transition>
  )
}

interface ToastInstance {
  id: number
  message: string
  type: ToastType
  duration?: number
}

const ToastContainer: React.FC<{
  toasts: ToastInstance[]
  remove: (id: number) => void
}> = ({ toasts, remove }) => (
  <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm">
    {toasts.map(({ id, message, type, duration }) => (
      <Toast
        key={id}
        message={message}
        type={type}
        duration={duration}
        onClose={() => remove(id)}
      />
    ))}
  </div>
)

let containerRoot: ReturnType<typeof createRoot> | null = null
let containerDiv: HTMLElement | null = null
let toasts: ToastInstance[] = []

const renderToasts = () => {
  if (!containerRoot || !containerDiv) {
    containerDiv = document.createElement('div')
    document.body.appendChild(containerDiv)
    containerRoot = createRoot(containerDiv)
  }

  const remove = (id: number) => {
    toasts = toasts.filter((t) => t.id !== id)
    renderToasts()
  }

  containerRoot.render(<ToastContainer toasts={toasts} remove={remove} />)
}

/**
 * showToast(message, type?, duration?) - Imperatively show a toast.
 * Returns a function to manually remove the toast.
 */
export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration = 5000
) => {
  const id = Date.now()
  toasts.push({ id, message, type, duration })
  renderToasts()
  return () => {
    toasts = toasts.filter((t) => t.id !== id)
    renderToasts()
  }
}
