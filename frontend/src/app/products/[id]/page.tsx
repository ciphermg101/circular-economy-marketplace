'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { Product } from '@/lib/stores/use-product-store'
import { useCartStore } from '@/lib/stores/use-cart-store'
import { useProfileStore } from '@/lib/stores/use-profile-store'
import { Loading } from '@/components/common/Loading'
import { formatCurrency, formatDate } from '@/utils/format'
import { errorHandler, AppError, NotFoundError, AuthenticationError } from '@/lib/error-handler'

export default function ProductDetailPage() {
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<AppError | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const addItem = useCartStore(state => state.addItem)
  const { profile } = useProfileStore()

  useEffect(() => {
    const fetchProduct = async () => {
      const context = { route: 'ProductDetailPage', productId: params.id }
      return errorHandler.withErrorHandling(async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          throw new AuthenticationError()
        }

        const response = await fetch(`/api/products/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.status === 404) {
          throw new NotFoundError('Product not found')
        }

        if (!response.ok) {
          throw new AppError('Failed to fetch product', 'FETCH_PRODUCT_ERROR', response.status)
        }

        const data = await response.json()
        setProduct(data)
      }, context)
    }

    if (params.id) {
      setLoading(true)
      setError(null)
      fetchProduct()
        .catch(err => setError(err instanceof AppError ? err : new AppError('Unexpected error', 'UNKNOWN')))
        .finally(() => setLoading(false))
    }
  }, [params.id])

  if (loading) {
    return <Loading size="large" text="Loading product details..." />
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded">
          {error?.message || 'Product not found'}
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    addItem({
      ...product,
      quantity: 1,
      image: product.images[0] || '/images/placeholder.png'
    })
  }  

  const isOwner = profile?.id === product.userId

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <Image
              src={product.images[selectedImage] || '/images/placeholder.png'}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2
                    ${selectedImage === index
                      ? 'border-primary-600'
                      : 'border-transparent'}`}
                >
                  <Image
                    src={image}
                    alt={`${product.title} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {product.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Posted on {formatDate(product.createdAt)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(product.price)}
            </span>
            <span className={`
              px-3 py-1 text-sm font-semibold rounded-full
              ${product.condition === 'new' ? 'bg-green-100 text-green-800' :
                product.condition === 'like_new' ? 'bg-blue-100 text-blue-800' :
                product.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                product.condition === 'fair' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'}
            `}>
              {product.condition.replace('_', ' ')}
            </span>
          </div>

          <div className="prose dark:prose-invert max-w-none">
            <p>{product.description}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-3">
              Environmental Impact
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">CO2 Saved</p>
                <p className="text-lg font-medium text-green-800 dark:text-green-200">
                  {product.environmentalImpact.co2Saved.toFixed(1)}kg
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700 dark:text-green-300">E-waste Diverted</p>
                <p className="text-lg font-medium text-green-800 dark:text-green-200">
                  {product.environmentalImpact.eWasteDiverted.toFixed(1)}kg
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {!isOwner && product.status === 'active' && (
              <button
                onClick={handleAddToCart}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-md
                         hover:bg-primary-700 transition-colors"
              >
                Add to Cart
              </button>
            )}
            {!isOwner && (
              <button
                onClick={() => {/* TODO: Implement contact seller */}}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                         py-3 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600
                         transition-colors"
              >
                Contact Seller
              </button>
            )}
            {isOwner && (
              <div className="flex gap-4">
                <button
                  onClick={() => {/* TODO: Implement edit product */}}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                           py-3 px-4 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600
                           transition-colors"
                >
                  Edit Product
                </button>
                <button
                  onClick={() => {/* TODO: Implement delete product */}}
                  className="flex-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300
                           py-3 px-4 rounded-md hover:bg-red-200 dark:hover:bg-red-900/40
                           transition-colors"
                >
                  Delete Product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
