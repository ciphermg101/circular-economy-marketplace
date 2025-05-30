import { useEffect, useState } from 'react';
import { useProductStore } from '@/lib/stores/use-product-store';
import { useDebounce } from '@/hooks/useDebounce';

const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'] as const;
const CATEGORIES = [
  'smartphones',
  'laptops',
  'tablets',
  'gaming_consoles',
  'smart_home',
  'accessories',
  'components',
  'other'
] as const;

export function ProductSearch() {
  const { filters, setFilters } = useProductStore();
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || '',
    max: filters.maxPrice || ''
  });
  
  const debouncedSearch = useDebounce(search, 300);
  const debouncedPriceRange = useDebounce(priceRange, 300);

  useEffect(() => {
    setFilters({
      ...filters,
      searchTerm: debouncedSearch || undefined
    });
  }, [debouncedSearch]);

  useEffect(() => {
    setFilters({
      ...filters,
      minPrice: debouncedPriceRange.min ? Number(debouncedPriceRange.min) : undefined,
      maxPrice: debouncedPriceRange.max ? Number(debouncedPriceRange.max) : undefined
    });
  }, [debouncedPriceRange]);

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Price Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Price
          </label>
          <input
            type="number"
            min="0"
            value={priceRange.min}
            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Price
          </label>
          <input
            type="number"
            min="0"
            value={priceRange.max}
            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Category
        </label>
        <select
          value={filters.category || ''}
          onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(category => (
            <option key={category} value={category}>
              {category.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Condition
        </label>
        <select
          value={filters.condition || ''}
          onChange={(e) => setFilters({ ...filters, condition: e.target.value || undefined })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Any Condition</option>
          {CONDITIONS.map(condition => (
            <option key={condition} value={condition}>
              {condition.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      <button
        onClick={() => {
          setSearch('');
          setPriceRange({ min: '', max: '' });
          setFilters({});
        }}
        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Clear Filters
      </button>
    </div>
  );
}