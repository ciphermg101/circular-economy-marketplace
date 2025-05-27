export interface Tutorial {
  id: string
  title: string
  description: string
  content: string
  thumbnailUrl: string
  videoUrl?: string
  duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  category: string[]
  tools: {
    name: string
    description: string
    required: boolean
  }[]
  author: {
    id: string
    name: string
    expertise: string
    avatarUrl: string
  }
  likes: number
  views: number
  comments: number
  createdAt: string
  updatedAt: string
} 