import { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { calculatePastDate } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import OverviewReport from './overview-report'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

const DashboardPage = async () => {
  const session = await auth()
  if (session?.user.role !== 'Admin')
    throw new Error('Admin permission required')

  // Prefetch default (last 30 days) overview data on the server
  const initialDate: DateRange = {
    from: calculatePastDate(30),
    to: new Date(),
  }

  // Direct database queries for overview stats
  const [totalOrders, totalRevenue, totalProducts, totalUsers] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: {
          gte: initialDate.from,
          lte: initialDate.to,
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        isPaid: true,
        createdAt: {
          gte: initialDate.from,
          lte: initialDate.to,
        },
      },
      _sum: {
        totalPrice: true,
      },
    }),
    prisma.product.count(),
    prisma.user.count(),
  ])

  // Also fetch initial latest orders with date range - ONLY PAID ORDERS
  const initialLatestOrders = await prisma.order.findMany({
    where: {
      isPaid: true,  // Only show paid orders to match total income
      createdAt: {
        gte: initialDate.from,
        lte: initialDate.to,
      },
    },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const initialHeader = {
    ordersCount: totalOrders,
    totalSales: Number(totalRevenue._sum.totalPrice || 0),
    productsCount: totalProducts,
    usersCount: totalUsers,
  }

  // Debug logging
  console.log('🔍 Server-side calculation debug:')
  console.log('Date range:', initialDate)
  console.log('Total orders (all):', totalOrders)
  console.log('Total revenue (paid only):', Number(totalRevenue._sum.totalPrice || 0))
  console.log('Latest orders count (PAID ONLY):', initialLatestOrders.length)
  console.log('Latest orders total (PAID ONLY):', initialLatestOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0))
  console.log('Latest orders details:', initialLatestOrders.map(o => ({ id: o.id, totalPrice: o.totalPrice, isPaid: o.isPaid, createdAt: o.createdAt })))

  return <OverviewReport 
    initialDate={initialDate} 
    initialHeader={initialHeader}
    initialLatestOrders={JSON.parse(JSON.stringify(initialLatestOrders))}
  />
}

export default DashboardPage
