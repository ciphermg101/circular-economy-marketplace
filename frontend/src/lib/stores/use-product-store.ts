import { create } from 'zustand'

export interface EnvironmentalImpact {
  co2Saved: number
  eWasteDiverted: number
}

export interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  status: 'active' | 'inactive' | string
  userId: string
  createdAt: string 
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  environmentalImpact: EnvironmentalImpact
}

interface Filters {
  searchTerm?: string
  minPrice?: number
  maxPrice?: number
  category?: string
  condition?: string
}

interface ProductState {
  selectedProduct: Product | null
  setSelectedProduct: (product: Product) => void

  loading: boolean
  error: string | null
  filteredProducts: Product[]
  filters: Filters
  setFilters: (filters: Filters) => void
  fetchProducts: () => void
}

export const useProductStore = create<ProductState>((set) => ({
  selectedProduct: null,
  setSelectedProduct: (product: Product) =>
    set(() => ({ selectedProduct: product })),

  loading: false,
  error: null,
  filteredProducts: [],
  filters: {},

  setFilters: (filters: Filters) => set(() => ({ filters })),

  fetchProducts: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch products')
      const data: Product[] = await res.json()
      set({ filteredProducts: data, loading: false })
    } catch (error: any) {
      set({ error: error.message || 'Something went wrong', loading: false })
    }
  }
}))
