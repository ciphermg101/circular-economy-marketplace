import Link from 'next/link'
import { FeaturedProducts } from '../components/products/FeaturedProducts'
import { PopularRepairShops } from '../components/repair-shops/PopularRepairShops'
import { LatestTutorials } from '../components/tutorials/LatestTutorials'

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Sustainable Shopping &
              <span className="text-green-600"> Circular Economy</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Buy, sell, repair, and learn about sustainable products. Join our community in reducing waste and promoting a circular economy.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/products" className="btn-primary">
                  Browse Products
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link href="/repair-shops" className="btn-secondary">
                  Find Repair Shops
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <FeaturedProducts />
        </div>
      </section>

      {/* Popular Repair Shops */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900">Popular Repair Shops</h2>
          <PopularRepairShops />
        </div>
      </section>

      {/* Latest Tutorials */}
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">Latest Tutorials</h2>
          <LatestTutorials />
        </div>
      </section>

      {/* Impact Section */}
      <section className="bg-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Impact</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-4xl font-bold text-green-600">1000+</p>
                <p className="mt-2 text-lg text-gray-500">Products Repaired</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-green-600">500+</p>
                <p className="mt-2 text-lg text-gray-500">Active Repair Shops</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-green-600">2000+</p>
                <p className="mt-2 text-lg text-gray-500">Community Members</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
