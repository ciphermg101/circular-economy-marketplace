import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Product } from '../../types/product'
import { ProductCard } from './ProductCard'
import { Pagination } from '../common/Pagination'
import { SortSelect } from '../common/SortSelect'
import { useToast } from '../../contexts/ToastContext'

const ITEMS_PER_PAGE = 12

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  const page = Number(searchParams.get('page')) || 1
  const sort = searchParams.get('sort') || 'newest'
  const category = searchParams.get('category')
  const condition = searchParams.get('condition')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const search = searchParams.get('search')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          page: page.toString(),
          sort,
          ...(category && { category }),
          ...(condition && { condition }),
          ...(minPrice && { minPrice }),
          ...(maxPrice && { maxPrice }),
          ...(search && { search }),
        })

        const response = await fetch(`/api/products?${queryParams}`)
        if (!response.ok) throw new Error('Failed to fetch products')
        
        const data = await response.json()
        setProducts(data.products)
        setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE))
      } catch (error) {
        showToast('Failed to load products', 'error')
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [page, sort, category, condition, minPrice, maxPrice, search, showToast])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-w-1 aspect-h-1 w-full bg-gray-200 rounded-lg" />
            <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
            <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
        <p className="mt-2 text-sm text-gray-500">
          Try adjusting your search or filter criteria
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <SortSelect
          value={sort}
          options={[
            { value: 'newest', label: 'Newest' },
            { value: 'price-low', label: 'Price: Low to High' },
            { value: 'price-high', label: 'Price: High to Low' },
            { value: 'popular', label: 'Most Popular' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-8">
        <Pagination currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  )
} 