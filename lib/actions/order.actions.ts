'use server'

import { Cart, OrderItem, ShippingAddress } from '@/types'
import { formatError, round2 } from '../utils'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { OrderInputSchema } from '../validator'
import { revalidatePath } from 'next/cache'
import { sendAskReviewOrderItems, sendPurchaseReceipt } from '@/lib/services/email.service'

import { DateRange } from 'react-day-picker'
import data from '../data'

// Lightweight in-memory cache for admin overview
const overviewCache = new Map<string, { data: any; ts: number }>()
const OVERVIEW_TTL_MS = 60 * 1000

// CREATE
export const createOrder = async (clientSideCart: Cart) => {
  try {
    const session = await auth()
    
    console.log('🔍 Order creation debug:')
    console.log('Session:', session)
    console.log('Session user ID:', session?.user?.id)
    // Using real database connection
    
    if (!session) throw new Error('User not authenticated')
    
    // Mock mode removed: always use database
    
    // Validate that cart exists and has items
    if (!clientSideCart || !clientSideCart.items || !Array.isArray(clientSideCart.items)) {
      return { 
        success: false, 
        message: `Invalid cart data. Please refresh your cart and try again.` 
      }
    }
    
    // Validate that all cart items have valid clientId
    const invalidItems = clientSideCart.items.filter(item => !item.clientId || item.clientId.trim() === '')
    if (invalidItems.length > 0) {
      return { 
        success: false, 
        message: `Some items are missing required information. Please refresh your cart and try again.` 
      }
    }
    
    // Verify user exists in database
    if (session.user.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id }
      })
      console.log('Database user found:', dbUser)
      
      if (!dbUser) {
        throw new Error(`User with ID ${session.user.id} not found in database`)
      }
    }
    
    // recalculate price and delivery date on the server
    const createdOrder = await createOrderFromCart(
      clientSideCart,
      session.user.id!
    )
    return {
      success: true, message: 'تم تأكيد الطلب بنجاح',
      data: { orderId: createdOrder.id },
    }
  } catch (error) {
    console.error('❌ Order creation error:', error)
    return { success: false, message: formatError(error) }
  }
}
export const createOrderFromCart = async (
  clientSideCart: Cart,
  userId: string
) => {
  // Validate that cart exists and has items
  if (!clientSideCart || !clientSideCart.items || !Array.isArray(clientSideCart.items)) {
    throw new Error('Invalid cart data')
  }
  
  // Mock mode removed: always use database
  
  const cart = {
    ...clientSideCart,
    ...calcDeliveryDateAndPrice({
      items: clientSideCart.items,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    }),
  }

  const orderData = OrderInputSchema.parse({
    user: userId,
    items: cart.items,
    shippingAddress: cart.shippingAddress,
    paymentMethod: cart.paymentMethod,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,
    expectedDeliveryDate: cart.expectedDeliveryDate ? new Date(cart.expectedDeliveryDate) : new Date(),
    medicalCertificateImage: cart.medicalCertificateImage,
    prescriptionImage: cart.prescriptionImage,
  })
  
      return await prisma.order.create({
    data: {
      userId: orderData.user as string,
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      paymentMethod: orderData.paymentMethod,
      paymentResult: orderData.paymentResult as any,
      itemsPrice: orderData.itemsPrice,
      shippingPrice: orderData.shippingPrice,
      taxPrice: orderData.taxPrice,
      totalPrice: orderData.totalPrice,
      isPaid: orderData.isPaid,
      paidAt: orderData.paidAt,
      isDelivered: orderData.isDelivered,
      deliveredAt: orderData.deliveredAt,
      medicalCertificateImage: orderData.medicalCertificateImage,
      orderItems: {
        create: orderData.items.map(item => ({
          productId: item.product,
          clientId: item.clientId,
          name: item.name,
          slug: item.slug,
          category: item.category,
          quantity: item.quantity,
          countInStock: item.countInStock,
          image: item.image,
          price: item.price,
          size: item.size,
          color: item.color,
        }))
      },
      shippingAddress: {
        create: {
          street: orderData.shippingAddress.street,
          province: orderData.shippingAddress.province,
          area: orderData.shippingAddress.area,
          apartment: orderData.shippingAddress.apartment,
          building: orderData.shippingAddress.building,
          floor: orderData.shippingAddress.floor,
          landmark: orderData.shippingAddress.landmark,
        }
      }
    },
    include: {
      orderItems: true,
      shippingAddress: true,
      user: true
    }
  })
}

export async function updateOrderToPaid(orderId: string) {
  try {
    // Mock mode removed: always use database
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { phone: true, name: true }
        }
      }
    })
    if (!order) throw new Error('Order not found')
    if (order.isPaid) throw new Error('Order is already paid')
    
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isPaid: true,
        paidAt: new Date()
      }
    })
    
    await updateProductStock(orderId)
    if (order.user.phone) await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'تم دفع الطلب بنجاح' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}
const updateProductStock = async (orderId: string) => {
  try {
    // Mock mode removed: always use database
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    })
    if (!order) throw new Error('Order not found')

    for (const item of order.orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          countInStock: {
            decrement: item.quantity
          }
        }
      })
    }
    return true
  } catch (error) {
    throw error
  }
}
export async function markOrderOutForDelivery(orderId: string) {
  try {
    // Mock mode removed: always use database
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { phone: true, name: true }
        }
      }
    })
    if (!order) throw new Error('Order not found')
    
    // For pre-paid orders, check if paid. For payment on delivery, skip this check
    const isPaymentOnDelivery = order.paymentMethod?.includes('دفع عند الاستلام')
    if (!isPaymentOnDelivery && !order.isPaid) {
      throw new Error('Order is not paid')
    }
    
    if (order.isOutForDelivery) throw new Error('Order is already out for delivery')
    if (order.isDelivered) throw new Error('Order is already delivered')
    
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isOutForDelivery: true,
        outForDeliveryAt: new Date(),
      }
    })
    
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/admin/orders')
    return { success: true, message: 'تم تحديد الطلب للخروج للتوصيل' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

export async function deliverOrder(orderId: string) {
  try {
    // Mock mode removed: always use database
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { phone: true, name: true }
        }
      }
    })
    if (!order) throw new Error('Order not found')
    
    // For payment on delivery orders, mark as paid when delivered
    const isPaymentOnDelivery = order.paymentMethod?.includes('دفع عند الاستلام')
    const shouldMarkAsPaid = isPaymentOnDelivery && !order.isPaid
    
    await prisma.order.update({
      where: { id: orderId },
      data: {
        isDelivered: true,
        deliveredAt: new Date(),
        ...(shouldMarkAsPaid && {
          isPaid: true,
          paidAt: new Date()
        })
      }
    })
    
    if (order.user.phone) await sendAskReviewOrderItems({ order })
    revalidatePath(`/account/orders/${orderId}`)
    revalidatePath('/admin/orders')
    
    const message = shouldMarkAsPaid 
      ? 'تم تسليم الطلب ودفعه بنجاح' 
      : 'تم تسليم الطلب بنجاح'
    
    return { success: true, message }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

// DELETE
export async function deleteOrder(id: string) {
  try {
    
    const res = await prisma.order.delete({
      where: { id }
    })
    if (!res) throw new Error('Order not found')
    revalidatePath('/admin/orders')
    return {
      success: true,
      message: 'تم حذف الطلب بنجاح',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL ORDERS

export async function getAllOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = data.settings[0];
  limit = limit || pageSize
  
  // Mock mode removed: always use database
  
  const skipAmount = (Number(page) - 1) * limit
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: { name: true }
      }
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: skipAmount,
    take: limit,
  })
  const ordersCount = await prisma.order.count()
  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getMyOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = data.settings[0];
  limit = limit || pageSize
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  
  // Mock mode removed: always use database
  
  const skipAmount = (Number(page) - 1) * limit
  const orders = await prisma.order.findMany({
    where: {
      userId: session?.user?.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: skipAmount,
    take: limit,
  })
  const ordersCount = await prisma.order.count({
    where: { userId: session?.user?.id }
  })

  return {
    data: JSON.parse(JSON.stringify(orders)),
    totalPages: Math.ceil(ordersCount / limit),
  }
}
export async function getOrderById(orderId: string) {
  // Mock mode removed: always use database
  
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shippingAddress: true,
      orderItems: {
        include: {
          product: true
        }
      },
      user: {
        select: { name: true, phone: true }
      }
    }
  })
  return JSON.parse(JSON.stringify(order))
}







export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const { availableDeliveryDates } = data.settings[0];
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  const deliveryDate =
    availableDeliveryDates[
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex
    ]
  
  // Calculate expected delivery date (5 days from now)
  const expectedDeliveryDate = new Date()
  expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 5)
  
  const shippingPrice =
    !shippingAddress || !deliveryDate
      ? undefined
      : deliveryDate.freeShippingMinPrice > 0 &&
          itemsPrice >= deliveryDate.freeShippingMinPrice
        ? 0
        : deliveryDate.shippingPrice

  const taxPrice = !shippingAddress ? undefined : round2(itemsPrice * 0.15)
  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0)
  )
  return {
    availableDeliveryDates,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex,
    expectedDeliveryDate,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  }
}

// GET ORDERS BY USER
export async function getOrderSummary(date: DateRange) {
  try {
    // Validate date range
    if (!date || !date.from || !date.to) {
      console.error('Invalid date range provided:', date)
      throw new Error('Invalid date range provided')
    }

    // Simple cache to avoid refetching identical ranges repeatedly
    const cacheKey = `${date.from.toISOString()}_${date.to.toISOString()}`
    const cached = overviewCache.get(cacheKey)
    if (cached && Date.now() - cached.ts < OVERVIEW_TTL_MS) {
      return cached.data
    }
    
    // Database mode - use real Prisma client
    const dateWhere = {
      gte: date.from,
      lte: date.to,
    }

    // Run queries sequentially to avoid exhausting low-connection pools in dev
    const ordersCount = await prisma.order.count({ where: { createdAt: dateWhere } })
    const productsCount = await prisma.product.count({ where: { createdAt: dateWhere } })
    const usersCount = await prisma.user.count({ where: { createdAt: dateWhere } })
    const totalSalesResult = await prisma.order.aggregate({
      where: { 
        isPaid: true,  // Only count paid orders for total sales
        createdAt: dateWhere 
      },
      _sum: { totalPrice: true },
    })
    const monthlySalesData = await prisma.order.findMany({
      where: { 
        isPaid: true,  // Only count paid orders for monthly sales
        createdAt: { gte: new Date(date.from.getFullYear(), date.from.getMonth() - 5, 1) } 
      },
      select: { createdAt: true, totalPrice: true },
    })
    const topSalesProducts = await getTopSalesProductsFast(date)
    const topSalesCategories = await getTopSalesCategoriesFast(date)

    const totalSales = totalSalesResult._sum.totalPrice || 0

    // Process monthly sales data
    const monthlySalesMap = new Map<string, number>()
    monthlySalesData.forEach((order: any) => {
      const monthKey = order.createdAt.toISOString().slice(0, 7) // YYYY-MM
      monthlySalesMap.set(monthKey, (monthlySalesMap.get(monthKey) || 0) + Number(order.totalPrice))
    })
    const monthlySales = Array.from(monthlySalesMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const {
      common: { pageSize },
    } = data.settings[0]
    const limit = pageSize

    const latestOrders = await prisma.order.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const result = {
      ordersCount,
      productsCount,
      usersCount,
      totalSales: Number(totalSales),
      monthlySales: JSON.parse(JSON.stringify(monthlySales)),
      salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
      topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
      topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
      latestOrders: JSON.parse(JSON.stringify(latestOrders)),
    }

    overviewCache.set(cacheKey, { data: result, ts: Date.now() })
    return result
  } catch (error) {
    console.error('Error in getOrderSummary:', error)
    throw error
  }
}

// Smaller, chunked server actions for progressive loading
export async function getOverviewHeaderStats(date: DateRange) {
  try {
    if (!date?.from || !date?.to) throw new Error('Invalid date range')
    const dateWhere = { gte: date.from, lte: date.to }
    const ordersCount = await prisma.order.count({ where: { createdAt: dateWhere } })
    const productsCount = await prisma.product.count({ where: { createdAt: dateWhere } })
    const usersCount = await prisma.user.count({ where: { createdAt: dateWhere } })
    const totalSalesResult = await prisma.order.aggregate({
      where: { 
        isPaid: true,  // Only count paid orders for total sales
        createdAt: dateWhere 
      },
      _sum: { totalPrice: true },
    })
    
    // Debug logging
    console.log('🔍 Client-side getOverviewHeaderStats debug:')
    console.log('Date range:', date)
    console.log('Orders count:', ordersCount)
    console.log('Total sales (paid only):', Number(totalSalesResult._sum.totalPrice || 0))
    
    return {
      ordersCount,
      productsCount,
      usersCount,
      totalSales: Number(totalSalesResult._sum.totalPrice || 0),
    }
  } catch (error) {
    console.error('Error in getOverviewHeaderStats:', error)
    throw error
  }
}

export async function getOverviewChartsData(date: DateRange) {
  try {
    if (!date?.from || !date?.to) throw new Error('Invalid date range')
    const monthlySalesData = await prisma.order.findMany({
      where: { 
        isPaid: true,  // Only count paid orders for monthly sales
        createdAt: { gte: new Date(date.from.getFullYear(), date.from.getMonth() - 5, 1) } 
      },
      select: { createdAt: true, totalPrice: true },
    })
    const monthlySalesMap = new Map<string, number>()
    monthlySalesData.forEach((order: any) => {
      const monthKey = order.createdAt.toISOString().slice(0, 7)
      monthlySalesMap.set(monthKey, (monthlySalesMap.get(monthKey) || 0) + Number(order.totalPrice))
    })
    const monthlySales = Array.from(monthlySalesMap.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label))

    const salesChartData = await getSalesChartData(date)
    const topSalesProducts = await getTopSalesProductsFast(date)
    const topSalesCategories = await getTopSalesCategoriesFast(date)
    return {
      monthlySales: JSON.parse(JSON.stringify(monthlySales)),
      salesChartData: JSON.parse(JSON.stringify(salesChartData)),
      topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
      topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    }
  } catch (error) {
    console.error('Error in getOverviewChartsData:', error)
    throw error
  }
}

export async function getLatestOrdersForOverview(limit?: number, dateRange?: DateRange) {
  try {
    const {
      common: { pageSize },
    } = data.settings[0]
    const take = limit || pageSize
    
    // Build where clause based on date range - ONLY PAID ORDERS
    const whereClause: any = {
      isPaid: true,  // Only show paid orders to match total income
    }
    if (dateRange?.from && dateRange?.to) {
      whereClause.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      }
    }
    
    const latestOrders = await prisma.order.findMany({
      where: whereClause,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    })
    
    // Debug logging
    console.log('🔍 getLatestOrdersForOverview debug:')
    console.log('Date range:', dateRange)
    console.log('Where clause:', whereClause)
    console.log('Orders found (PAID ONLY):', latestOrders.length)
    console.log('Orders total (PAID ONLY):', latestOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0))
    console.log('Orders details:', latestOrders.map(o => ({ id: o.id, totalPrice: o.totalPrice, isPaid: o.isPaid, createdAt: o.createdAt })))
    
    return JSON.parse(JSON.stringify(latestOrders))
  } catch (error) {
    console.error('Error in getLatestOrdersForOverview:', error)
    throw error
  }
}

async function getSalesChartData(date: DateRange) {
  // Mock mode removed: always use database

  const orders = await prisma.order.findMany({
    where: {
      isPaid: true,  // Only count paid orders for sales chart
      createdAt: {
        gte: date.from,
        lte: date.to,
      },
    },
    select: {
      createdAt: true,
      totalPrice: true,
    },
  })

  // Group by date and calculate total sales
  const salesByDate = new Map<string, number>()
  orders.forEach((order: any) => {
    const dateKey = order.createdAt.toISOString().split('T')[0] // YYYY-MM-DD format
    salesByDate.set(dateKey, (salesByDate.get(dateKey) || 0) + Number(order.totalPrice))
  })

  return Array.from(salesByDate.entries())
    .map(([date, totalSales]) => ({ date, totalSales }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function getTopSalesProductsFast(date: DateRange) {
  // Get order items from PAID orders only
  const rows = await prisma.orderItem.findMany({
    where: { 
      order: { 
        isPaid: true,  // Only count paid orders
        createdAt: { gte: date.from, lte: date.to } 
      } 
    },
    select: { productId: true, name: true, price: true, quantity: true },
  })
  
  // Get current product data from Product table
  const productIds = [...new Set(rows.map(r => r.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, images: true, slug: true },
  })
  
  const productMap = new Map(products.map(p => [p.id, p]))
  const productSales = new Map<string, { name: string; image: string; totalSales: number; slug: string }>()
  
  for (const r of rows) {
    const product = productMap.get(r.productId)
    if (!product) continue
    
    const prev = productSales.get(r.productId) || { 
      name: product.name, 
      image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg',
      totalSales: 0,
      slug: product.slug
    }
    prev.totalSales += Number(r.price) * Number(r.quantity)
    productSales.set(r.productId, prev)
  }
  
  return Array.from(productSales.entries())
    .map(([id, data]) => ({ id, label: data.name, image: data.image, value: data.totalSales, slug: data.slug }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}

async function getTopSalesCategoriesFast(date: DateRange, limit = 5) {
  const rows = await prisma.orderItem.findMany({
    where: { 
      order: { 
        isPaid: true,  // Only count paid orders
        createdAt: { gte: date.from, lte: date.to } 
      } 
    },
    select: { category: true, quantity: true },
  })
  const categorySales = new Map<string, number>()
  for (const r of rows) {
    categorySales.set(r.category, (categorySales.get(r.category) || 0) + Number(r.quantity))
  }
  return Array.from(categorySales.entries())
    .map(([category, totalSales]) => ({ _id: category, totalSales }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, limit)
}
