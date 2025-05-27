export interface Product {
  id: string
  name: string
  description: string
  price: number
  condition: 'new' | 'like-new' | 'good' | 'fair'
  category: string
  imageUrl: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  seller: {
    id: string
    name: string
    rating: number
  }
  createdAt: string
  updatedAt: string
} 