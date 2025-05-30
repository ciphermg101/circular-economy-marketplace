import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RepairShop } from '../../types/repair-shop'

export function PopularRepairShops() {
  const [shops, setShops] = useState<RepairShop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopularShops = async () => {
      try {
        const response = await fetch('/api/repair-shops/popular')
        const data = await response.json()
        setShops(data)
      } catch (error) {
        console.error('Error fetching popular repair shops:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularShops()
  }, [])

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-w-16 aspect-h-9 w-full bg-gray-200 rounded-lg" />
            <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
            <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {shops.map((shop) => (
        <Link
          key={shop.id}
          href={`/repair-shops/${shop.id}`}
          className="group"
        >
          <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={shop.imageUrl}
              alt={shop.name}
              className="h-full w-full object-cover object-center group-hover:opacity-75"
              width={400}
              height={225}
            />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{shop.name}</h3>
          <div className="mt-1 flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-5 w-5 ${
                  i < shop.rating ? 'text-yellow-400' : 'text-gray-200'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-500">
              ({shop.reviewCount} reviews)
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{shop.specialty}</p>
          <p className="mt-1 text-sm text-gray-500">{shop.location?.address}</p>
        </Link>
      ))}
    </div>
  )
} 