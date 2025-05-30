import { ReactNode, useState } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Transition } from '@headlessui/react'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  className?: string
  onClose?: () => void
}

const variantStyles: Record<
  AlertVariant,
  { bg: string; text: string; icon: typeof CheckCircleIcon }
> = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-200',
    icon: CheckCircleIcon,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-200',
    icon: XCircleIcon,
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: ExclamationCircleIcon,
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-200',
    icon: InformationCircleIcon,
  },
}

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  onClose,
}: AlertProps) {
  const { bg, text, icon: Icon } = variantStyles[variant]
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  return (
    <Transition
      show={isOpen}
      enter="transition ease-out duration-300 transform"
      enterFrom="opacity-0 translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-200 transform"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-2"
    >
      <div
        role="alert"
        aria-live="assertive"
        className={`relative flex items-start gap-3 p-4 rounded-lg shadow-md ${bg} ${text} ${className}`}
      >
        <div className="flex-shrink-0 pt-0.5">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-sm font-semibold leading-6">{title}</h3>
          )}
          <div className="text-sm mt-1 leading-5">{children}</div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={handleClose}
            className={`ml-auto rounded-md p-1 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 ${text}`}
            aria-label="Close alert"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </Transition>
  )
}
