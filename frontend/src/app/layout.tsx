import { Inter } from 'next/font/google'
import { Providers } from '../contexts/Providers'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Circular Economy Marketplace',
  description: 'A sustainable marketplace for buying, selling, and repairing products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
