export interface RepairShop {
  id: string
  name: string
  description: string
  specialty: string[]
  imageUrl: string
  location: {
    latitude: number
    longitude: number
    address: string
  }
  contact: {
    phone: string
    email: string
    website?: string
  }
  businessHours: {
    [key: string]: {
      open: string
      close: string
    }
  }
  rating: number
  reviewCount: number
  services: {
    name: string
    description: string
    price: number
    duration: string
  }[]
  certifications: string[]
  createdAt: string
  updatedAt: string
} 