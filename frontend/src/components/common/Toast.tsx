import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    error: <ExclamationCircleIcon className="h-6 w-6 text-red-500" />,
    info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50',
    error: 'bg-red-50',
    info: 'bg-blue-50',
  };

  const borderColors = {
    success: 'border-green-200',
    error: 'border-red-200',
    info: 'border-blue-200',
  };

  return (
    <div
      className={`flex items-center p-4 mb-4 rounded-lg border ${bgColors[type]} ${borderColors[type]} animate-slide-in`}
      role="alert"
    >
      <div className="mr-3">{icons[type]}</div>
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button
        onClick={onClose}
        className="ml-3 inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  children: React.ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => (
  <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-4">
    {children}
  </div>
);

let toastContainer: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

const createToastContainer = () => {
  toastContainer = document.createElement('div');
  document.body.appendChild(toastContainer);
  root = createRoot(toastContainer);
  return root;
};

export const showToast = (
  message: string,
  type: ToastType = 'info',
  duration = 5000
) => {
  if (!toastContainer || !root) {
    root = createToastContainer();
  }

  const toastId = Date.now();

  const removeToast = () => {
    root?.render(
      <ToastContainer>
        {Array.from(document.querySelectorAll('[data-toast-id]')).map((el) => {
          const id = el.getAttribute('data-toast-id');
          if (id === toastId.toString()) return null;
          return el;
        })}
      </ToastContainer>
    );
  };

  root.render(
    <ToastContainer>
      {Array.from(document.querySelectorAll('[data-toast-id]')).map((el) => el)}
      <div data-toast-id={toastId}>
        <Toast message={message} type={type} onClose={removeToast} />
      </div>
    </ToastContainer>
  );

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }

  return removeToast;
}; 