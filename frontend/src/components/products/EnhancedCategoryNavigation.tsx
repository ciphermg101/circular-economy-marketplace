// frontend/src/components/products/EnhancedCategoryNavigation.tsx

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { useToast } from '../../contexts/ToastProvider';
import { useWebSocket } from '@/lib/websocket';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  product_count?: number;
  children?: Category[];
}

const fetchCategories = async (): Promise<Category[]> => {
  const response = await fetch('/api/products/categories');
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

const buildCategoryTree = (categories: Category[]): Category[] => {
  const categoryMap = new Map<string, Category>();
  const roots: Category[] = [];

  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  categories.forEach(category => {
    const node = categoryMap.get(category.id)!;
    if (category.parent_id) {
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children?.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
};

const CategoryItem: React.FC<{
  category: Category;
  level: number;
  selectedId?: string;
  onSelect: (id: string) => void;
}> = ({ category, level, selectedId, onSelect }) => {
  const [isExpanded, setIsExpanded] = React.useState(
    category.children?.some(child => child.id === selectedId)
  );
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = category.id === selectedId;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(category.id);
  };

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer
                   ${isSelected ? 'bg-blue-50 text-blue-600' : ''}
                   ${level === 0 ? 'font-semibold' : ''}`}
        style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
      >
        {hasChildren && (
          <ChevronRightIcon
            className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        )}
        <Link
          href={`/products?category=${category.id}`}
          className="flex-1"
          onClick={handleClick}
        >
          <span className="flex items-center justify-between">
            <span>{category.name}</span>
            {category.product_count !== undefined && (
              <span className="text-xs text-gray-500">({category.product_count})</span>
            )}
          </span>
          {category.description && (
            <p className="text-xs text-gray-500 mt-1">{category.description}</p>
          )}
        </Link>
      </div>

      {isExpanded && hasChildren && (
        <div className="ml-2">
          {category.children?.map(child => (
            <CategoryItem
              key={child.id}
              category={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const EnhancedCategoryNavigation: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const selectedId = router.query.category as string;

  useWebSocket(undefined);
  const { showToast } = useToast();

  const { data: categories, isLoading, error } = useQuery<Category[], Error>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  
  React.useEffect(() => {
    if (error) {
      showToast(error.message, 'error');
    }
  }, [error, showToast]);
  
  const categoriesList = categories ?? [];
  
  const filteredCategories = React.useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return categoriesList.filter((category: Category) =>
      category.name.toLowerCase().includes(searchLower) ||
      category.description?.toLowerCase().includes(searchLower)
    );
  }, [categoriesList, searchTerm]);  

  const handleCategorySelect = (categoryId: string) => {
    router.push({
      pathname: '/products',
      query: { ...router.query, category: categoryId },
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2 p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Failed to load categories
      </div>
    );
  }

  const categoryTree = buildCategoryTree(filteredCategories || []);

  return (
    <ErrorBoundary>
      <nav className="bg-white rounded-lg shadow">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Categories</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          {showFilters && (
            <div className="space-y-2 pt-2 border-t">
              <h3 className="font-medium text-sm">Filters</h3>
              {/* Add your filter options here */}
            </div>
          )}
        </div>

        <div className="py-2 max-h-[500px] overflow-y-auto">
          {categoryTree.length > 0 ? (
            categoryTree.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                level={0}
                selectedId={selectedId}
                onSelect={handleCategorySelect}
              />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              {searchTerm ? 'No categories found' : 'No categories available'}
            </div>
          )}
        </div>
      </nav>
    </ErrorBoundary>
  );
};
