import Link from 'next/link'
import { EllipsisVertical, LayoutDashboard } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import CartButton from './cart-button'
import UserButton from './user-button'
import { auth } from '@/auth'

const Menu = async ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const session = await auth()

  return (
    <div className='flex justify-end'>
      <nav className='md:flex gap-3 hidden w-full items-center'>
        <div className='flex items-center gap-2'>
          {session?.user?.role === 'Admin' && (
            <Link
              href='/admin/overview'
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground whitespace-nowrap shrink-0 font-cairo'
              )}
            >
              <LayoutDashboard className='h-4 w-4 shrink-0' aria-hidden />
              لوحة التحكم
            </Link>
          )}
          <UserButton 
            session={session} 
            translations={{
              hello: 'مرحباً',
              signIn: 'تسجيل الدخول',
              accountOrders: 'الحساب والطلبات',
              yourAccount: 'حسابك',
              yourOrders: 'طلباتك',
              admin: 'المدير',
              signOut: 'تسجيل الخروج',
              newCustomer: 'عميل جديد',
              signUp: 'إنشاء حساب'
            }} 
          />
        </div>
        {forAdmin ? null : <CartButton />}
      </nav>
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle header-button'>
            <EllipsisVertical className='h-6 w-6' />
          </SheetTrigger>
          <SheetContent className='bg-black text-white  flex flex-col items-start  '>
            <SheetHeader className='w-full'>
              <div className='flex items-center justify-between '>
                <SheetTitle className='  '>قائمة الموقع</SheetTitle>
                <SheetDescription></SheetDescription>
              </div>
            </SheetHeader>
            <UserButton 
              session={session} 
              translations={{
                hello: 'مرحباً',
                signIn: 'تسجيل الدخول',
                accountOrders: 'الحساب والطلبات',
                yourAccount: 'حسابك',
                yourOrders: 'طلباتك',
                admin: 'المدير',
                signOut: 'تسجيل الخروج',
                newCustomer: 'عميل جديد',
                signUp: 'إنشاء حساب'
              }} 
            />
            <CartButton />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}

export default Menu
