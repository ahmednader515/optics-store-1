import { HelpCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <div className='flex-1 p-4'>
        <header className='bg-card mb-4 border-b'>
          <div className='max-w-6xl mx-auto flex justify-between items-center'>
            <Link href='/'>
              <Image
                src='/icons/logo.png'
                alt='logo'
                width={257}
                height={133}
                className="h-6 w-auto"
                style={{
                  maxWidth: '100%',
                  height: '100px',
                  aspectRatio: '257/133',
                }}
              />
            </Link>
            <div>
              <h1 className='text-3xl'>إتمام الطلب</h1>
            </div>
          </div>
        </header>
        {children}
      </div>
      <Footer />
    </div>
  )
}
