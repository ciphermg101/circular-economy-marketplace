import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import { UserMenu } from './UserMenu'

export default function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-green-600">EcoMarket</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/products" className="nav-link">
                Products
              </Link>
              <Link href="/repair-shops" className="nav-link">
                Repair Shops
              </Link>
              <Link href="/tutorials" className="nav-link">
                Tutorials
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <UserMenu user={user} />
            ) : (
              <div className="flex space-x-4">
                <Link href="/auth/login" className="btn-secondary">
                  Log in
                </Link>
                <Link href="/auth/register" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 