import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
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

  // First pass: map all categories by ID
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build tree structure
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

const CategoryItem: React.FC<{ category: Category; level: number }> = ({ category, level }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="space-y-1">
      <div 
        className={`flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer
                   ${level === 0 ? 'font-semibold' : ''}`}
        style={{ paddingLeft: `${level * 1.5 + 1}rem` }}
      >
        {hasChildren && (
          <ChevronRightIcon
            className={`h-4 w-4 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          />
        )}
        <Link href={`/products?category=${category.id}`} className="flex-1">
          {category.name}
        </Link>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="ml-2">
          {category.children?.map(child => (
            <CategoryItem key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const CategoryNavigation: React.FC = () => {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-6 bg-gray-200 rounded w-full" />
        ))}
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

  const categoryTree = buildCategoryTree(categories || []);

  return (
    <nav className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Categories</h2>
      </div>
      <div className="py-2">
        {categoryTree.map(category => (
          <CategoryItem key={category.id} category={category} level={0} />
        ))}
      </div>
    </nav>
  );
}; 