import { ReactNode } from 'react'
import { AuthProvider } from './AuthContext'
import { CartProvider } from './CartContext'
import { ThemeProvider } from './ThemeContext'
import { ToastProvider } from './ToastProvider'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
} 