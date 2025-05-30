import { create } from 'zustand'
import { Product } from './use-product-store'

export interface CartItem extends Product {
  quantity: number
}

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getEnvironmentalImpact: () => { co2Saved: number; eWasteDiverted: number }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item: CartItem) =>
    set((state) => {
      const existing = state.items.find(i => i.id === item.id)
      if (existing) {
        return {
          items: state.items.map(i =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        }
      }
      return { items: [...state.items, { ...item, quantity: 1 }] }
    }),
  removeItem: (id: string) =>
    set((state) => ({
      items: state.items.filter(i => i.id !== id)
    })),
  clearCart: () => set({ items: [] }),
  getTotal: (): number => {
    return get().items.reduce((total: number, item: CartItem) => total + item.price * item.quantity, 0)
  },
  getItemCount: (): number => {
    return get().items.reduce((count: number, item: CartItem) => count + item.quantity, 0)
  },
  getEnvironmentalImpact: () => {
    const impact = { co2Saved: 0, eWasteDiverted: 0 }
    get().items.forEach((item: CartItem) => {
      impact.co2Saved += item.environmentalImpact.co2Saved * item.quantity
      impact.eWasteDiverted += item.environmentalImpact.eWasteDiverted * item.quantity
    })
    return impact
  },
}))
