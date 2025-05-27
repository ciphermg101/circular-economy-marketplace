import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Tutorial } from '../../types/tutorial'

export function LatestTutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLatestTutorials = async () => {
      try {
        const response = await fetch('/api/tutorials/latest')
        const data = await response.json()
        setTutorials(data)
      } catch (error) {
        console.error('Error fetching latest tutorials:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestTutorials()
  }, [])

  if (loading) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-w-16 aspect-h-9 w-full bg-gray-200 rounded-lg" />
            <div className="mt-4 h-4 bg-gray-200 rounded w-3/4" />
            <div className="mt-2 h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {tutorials.map((tutorial) => (
        <Link
          key={tutorial.id}
          href={`/tutorials/${tutorial.id}`}
          className="group"
        >
          <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={tutorial.thumbnailUrl}
              alt={tutorial.title}
              className="h-full w-full object-cover object-center group-hover:opacity-75"
              width={400}
              height={225}
            />
            {tutorial.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white/80 p-3">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{tutorial.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{tutorial.description}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <svg
              className="mr-1.5 h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {tutorial.duration} min
          </div>
        </Link>
      ))}
    </div>
  )
} 