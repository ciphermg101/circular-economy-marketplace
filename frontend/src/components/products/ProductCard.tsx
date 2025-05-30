import React from 'react';
import { Product } from '@/lib/stores/use-product-store';
import Image from 'next/image';
import { formatCurrency } from '@/utils/format';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-md">
      <Image
        src={product.images[0] || '/images/placeholder.png'}
        alt={product.title}
        width={300}
        height={200}
        className="object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-bold">{product.title}</h3>
        <p className="text-gray-500">{formatCurrency(product.price)}</p>
      </div>
    </div>
  );
};