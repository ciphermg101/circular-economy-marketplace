import React from 'react';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  ariaLabel?: string;
  tooltipText?: string;
  onButtonClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-200 dark:hover:bg-gray-700',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon,
      fullWidth = false,
      ariaLabel,
      tooltipText,
      onButtonClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!loading && !disabled && onButtonClick) {
        onButtonClick(event);
      }
    };

    const buttonContent = (
      <>
        {loading && <LoadingSpinner size="sm" className={children ? 'mr-2' : ''} />}
        {icon && !loading && <span className={`inline-flex ${children ? 'mr-2' : ''}`}>{icon}</span>}
        {children}
      </>
    );

    return (
      <button
        ref={ref}
        type="button"
        disabled={loading || disabled}
        onClick={handleClick}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-disabled={loading || disabled}
        aria-busy={loading}
        title={tooltipText}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-md
          focus:outline-none focus:ring-2 focus:ring-offset-2
          transition-colors duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';
