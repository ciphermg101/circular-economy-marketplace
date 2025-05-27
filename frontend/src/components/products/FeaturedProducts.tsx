import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product } from '../../types/product'

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch('/api/products/featured')
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [])

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 rounded-lg" />
            <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
            <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/products/${product.id}`}
          className="group"
        >
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg">
            <Image
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover object-center group-hover:opacity-75"
              width={300}
              height={300}
            />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{product.name}</h3>
          <p className="mt-1 text-lg font-medium text-green-600">${product.price}</p>
          <p className="mt-1 text-sm text-gray-500">{product.condition}</p>
        </Link>
      ))}
    </div>
  )
} 