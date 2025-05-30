'use client'

import { useEffect } from 'react'
import { useProductStore } from '@/lib/stores/use-product-store'
import { ProductCard } from '@/components/products/ProductCard'
import { ProductSearch } from '@/components/products/ProductSearch'
import { Loading } from '@/components/common/Loading'
import type { Product } from '@/lib/stores/use-product-store'


export default function ProductsPage() {
  const { loading, error, filteredProducts, fetchProducts } = useProductStore()

  useEffect(() => {
    fetchProducts()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar with filters */}
        <div className="w-full lg:w-1/4">
          <div className="sticky top-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Filters
            </h2>
            <ProductSearch />
          </div>
        </div>

        {/* Product grid */}
        <div className="w-full lg:w-3/4">
          {loading ? (
            <Loading size="large" text="Loading products..." />
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
              {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 