import Header from '@/components/shared/header'
import Footer from '@/components/shared/footer'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex flex-col min-h-screen font-cairo' dir="rtl">
      <Header />
      <main className='flex-1 flex flex-col pb-24 md:pb-0'>{children}</main>
      <Footer />
    </div>
  )
}
