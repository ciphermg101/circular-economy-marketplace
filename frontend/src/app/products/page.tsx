import React from 'react';
import { EnhancedCategoryNavigation } from '@/components/products/EnhancedCategoryNavigation';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { showToast } from '@/components/common/Toast';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/lib/websocket';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  user_id: string;
  status: 'active' | 'sold' | 'inactive';
  created_at: string;
  images: string[];
}

const fetchProducts = async (categoryId?: string): Promise<Product[]> => {
  const url = new URL('/api/products', window.location.origin);
  if (categoryId) {
    url.searchParams.append('category', categoryId);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  // Initialize WebSocket for real-time product updates
  useWebSocket(undefined);

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', searchParams.category],
    queryFn: () => fetchProducts(searchParams.category),
    onError: (error) => {
      showToast(error.message, 'error');
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar with enhanced categories */}
        <div className="w-1/4">
          <ErrorBoundary>
            <EnhancedCategoryNavigation />
          </ErrorBoundary>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Products</h1>
            <div className="flex gap-4">
              <select
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="newest"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name</option>
              </select>

              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
                Add Product
              </button>
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner className="mt-8" />
          ) : error ? (
            <div className="text-red-500 mt-8">
              Failed to load products
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-w-4 aspect-h-3">
                    <img
                      src={product.images[0] || '/placeholder.png'}
                      alt={product.name}
                      className="object-cover w-full h-full rounded-t-lg"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">
                        ${product.price.toFixed(2)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'sold'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {products?.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              No products found in this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 