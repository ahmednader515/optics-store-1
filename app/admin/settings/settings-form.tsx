'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { Plus, Trash2, Save, Image as ImageIcon, Upload, Truck, Calculator, DollarSign, GripVertical } from 'lucide-react'
import data from '@/lib/data'
import { updateSetting } from '@/lib/actions/setting.actions'
import { UploadButton } from '@/lib/uploadthing'
import CategoryManager from '@/components/admin/category-manager'
import VideoManager from '@/components/admin/video-manager'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface CarouselItem {
  title: string
  buttonCaption: string
  image: string
  url: string
}

interface SeasonalDiscount {
  name: string
  startDate: string
  endDate: string
  discountRate: number
  applicableCategories: string[]
}

interface VideoItem {
  id: string
  url: string
  title: string
}

// Sortable Carousel Item Component
function SortableCarouselItem({ 
  item, 
  index, 
  onUpdate, 
  onRemove, 
  isLast 
}: {
  item: CarouselItem
  index: number
  onUpdate: (index: number, field: keyof CarouselItem, value: string) => void
  onRemove: (index: number) => void
  isLast: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.title + index })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4 space-y-4 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <div
            {...attributes}
            {...listeners}
            className='cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-100 rounded'
          >
            <GripVertical className='h-4 w-4 text-gray-500' />
          </div>
          <h4 className='font-semibold'>عنصر الكاروسيل {index + 1}</h4>
        </div>
        <Button
          variant='destructive'
          size='sm'
          onClick={() => onRemove(index)}
        >
          <Trash2 className='h-4 w-4 ml-2' />
          حذف
        </Button>
      </div>
      
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor={`carouselTitle${index}`}>العنوان</Label>
          <Input
            id={`carouselTitle${index}`}
            value={item.title}
            onChange={(e) => onUpdate(index, 'title', e.target.value)}
            placeholder='عنوان الكاروسيل'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor={`carouselButton${index}`}>نص الزر</Label>
          <Input
            id={`carouselButton${index}`}
            value={item.buttonCaption}
            onChange={(e) => onUpdate(index, 'buttonCaption', e.target.value)}
            placeholder='نص الزر'
          />
        </div>
      </div>
      
              <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>صورة الكاروسيل</Label>
            <div className='flex items-center gap-4'>
              <div className='w-20 h-12 bg-gray-100 rounded border flex items-center justify-center overflow-hidden'>
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <ImageIcon className='h-6 w-6 text-gray-400' />
                )}
              </div>
              <div className='flex-1'>
                <Input
                  value={item.image}
                  onChange={(e) => onUpdate(index, 'image', e.target.value)}
                  placeholder='رابط الصورة'
                />
              </div>
              <div>
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res: { url: string }[]) => {
                    const url = res?.[0]?.url
                    if (!url) return
                    onUpdate(index, 'image', url)
                    toast({
                      title: 'تم رفع الصورة',
                      description: 'تم رفع صورة الكاروسيل بنجاح',
                      variant: 'default'
                    })
                  }}
                  onUploadError={(error: Error) => {
                    toast({
                      title: 'خطأ في رفع الصورة',
                      description: 'فشل في رفع الصورة. حاول مرة أخرى.',
                      variant: 'destructive'
                    })
                  }}
                />
              </div>
            </div>
          </div>
        
        <div className='space-y-2'>
          <Label htmlFor={`carouselUrl${index}`}>الرابط</Label>
          <Input
            id={`carouselUrl${index}`}
            value={item.url}
            onChange={(e) => onUpdate(index, 'url', e.target.value)}
            placeholder='رابط الكاروسيل'
          />
        </div>
      </div>
      
      {!isLast && <Separator />}
    </div>
  )
}

export default function SettingsForm({ setting }: { setting: any }) {
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [deliverySettings, setDeliverySettings] = useState({
    deliveryTimeHours: 4,
    deliveryPrice: 4.99,
    freeShippingThreshold: 50,
  })
  const [taxSettings, setTaxSettings] = useState({
    taxRate: 7.5,
    taxIncluded: false,
    taxExemptCategories: ['prescription-eyewear', 'optical-devices'],
    taxExemptThreshold: 0,
  })
  const [productPricing, setProductPricing] = useState({
    defaultMarkup: 30,
    bulkDiscountThreshold: 5,
    bulkDiscountRate: 10,
    seasonalDiscounts: [
      {
        name: 'Winter Sale',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        discountRate: 15,
        applicableCategories: ['sunglasses', 'protective-eyewear', 'computer-glasses'],
      },
      {
        name: 'Summer Vision',
        startDate: '2024-06-01',
        endDate: '2024-08-31',
        discountRate: 20,
        applicableCategories: ['sunglasses', 'contact-lenses', 'eye-care'],
      },
    ] as SeasonalDiscount[],
  })
  const [isLoading, setIsLoading] = useState(false)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    const settings = setting || data.settings[0]
    if (settings) {
      setCarouselItems(settings.carousels || [])
      setVideos(settings.videos || [])
      if (settings.deliverySettings) {
        const delivery = settings.deliverySettings
        if ('deliveryTimeHours' in delivery) {
          setDeliverySettings(delivery)
        } else {
          setDeliverySettings({
            deliveryTimeHours: 4,
            deliveryPrice: delivery.standardDeliveryPrice || 4.99,
            freeShippingThreshold: delivery.freeShippingThreshold || 50,
          })
        }
      }
      if (settings.taxSettings) {
        setTaxSettings(settings.taxSettings)
      }
      if (settings.productPricing) {
        setProductPricing(settings.productPricing)
      }
    }
  }, [setting])

  const handleCarouselChange = (index: number, field: keyof CarouselItem, value: string) => {
    const newCarouselItems = [...carouselItems]
    newCarouselItems[index] = { ...newCarouselItems[index], [field]: value }
    
    // Auto-update URL when title changes
    if (field === 'title') {
      newCarouselItems[index].url = `/search?category=${value}`
    }
    
    setCarouselItems(newCarouselItems)
  }

  const addCarouselItem = () => {
    setCarouselItems([
      ...carouselItems,
      {
        title: 'عنوان جديد',
        buttonCaption: 'زر جديد',
        image: '/images/banner1.jpg',
        url: '/search?category=عنوان جديد'
      }
    ])
  }

  const removeCarouselItem = (index: number) => {
    if (carouselItems.length > 1) {
      const newCarouselItems = carouselItems.filter((_, i) => i !== index)
      setCarouselItems(newCarouselItems)
    } else {
      toast({
        title: 'لا يمكن الحذف',
        description: 'يجب أن يحتوي الكاروسيل على عنصر واحد على الأقل',
        variant: 'destructive'
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = carouselItems.findIndex(item => item.title + carouselItems.indexOf(item) === active.id)
      const newIndex = carouselItems.findIndex(item => item.title + carouselItems.indexOf(item) === over?.id)

      setCarouselItems((items) => {
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }


  const addSeasonalDiscount = () => {
    setProductPricing({
      ...productPricing,
      seasonalDiscounts: [
        ...productPricing.seasonalDiscounts,
        {
          name: 'خصم جديد',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          discountRate: 10,
          applicableCategories: [],
        }
      ]
    })
  }

  const removeSeasonalDiscount = (index: number) => {
    const newSeasonalDiscounts = productPricing.seasonalDiscounts.filter((_, i) => i !== index)
    setProductPricing({
      ...productPricing,
      seasonalDiscounts: newSeasonalDiscounts
    })
  }

  const updateSeasonalDiscount = (index: number, field: keyof SeasonalDiscount, value: any) => {
    const newSeasonalDiscounts = [...productPricing.seasonalDiscounts]
    newSeasonalDiscounts[index] = { ...newSeasonalDiscounts[index], [field]: value }
    setProductPricing({
      ...productPricing,
      seasonalDiscounts: newSeasonalDiscounts
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      const newSetting = {
        ...data.settings[0],
        carousels: carouselItems,
        videos: videos,
        deliverySettings,
        taxSettings,
        productPricing,
      } as any

      const res = await updateSetting(newSetting)
      if (!res.success) {
        toast({
          title: 'خطأ في الحفظ',
          description: res.message,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'تم حفظ الإعدادات',
          description: 'تم تحديث إعدادات الموقع بنجاح',
          variant: 'default'
        })
      }
      
    } catch (error) {
      toast({
        title: 'خطأ في الحفظ',
        description: 'فشل في حفظ الإعدادات. يرجى المحاولة مرة أخرى.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Carousel Settings */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-xl flex items-center gap-2'>
              <ImageIcon className='h-5 w-5' />
              إعدادات الكاروسيل
            </CardTitle>
            <Button onClick={addCarouselItem} size='sm'>
              <Plus className='h-4 w-4 ml-2' />
              إضافة عنصر
            </Button>
          </div>
          <p className='text-sm text-muted-foreground mt-2'>
            اسحب العناصر باستخدام أيقونة السحب (⋮⋮) لإعادة ترتيبها
          </p>
        </CardHeader>
        <CardContent className='space-y-6'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={carouselItems.map((item, index) => item.title + index)}
              strategy={verticalListSortingStrategy}
            >
              {carouselItems.map((item, index) => (
                <SortableCarouselItem
                  key={item.title + index}
                  item={item}
                  index={index}
                  onUpdate={handleCarouselChange}
                  onRemove={removeCarouselItem}
                  isLast={index === carouselItems.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Category Management */}
      <CategoryManager />

      {/* Video Management */}
      <VideoManager videos={videos} onVideosChange={setVideos} />

      {/* Delivery Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Truck className='h-5 w-5' />
            إعدادات التوصيل
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='deliveryTimeHours'>وقت التوصيل (بالساعات)</Label>
              <Input
                id='deliveryTimeHours'
                type='number'
                min='1'
                value={deliverySettings.deliveryTimeHours}
                onChange={(e) => setDeliverySettings({
                  ...deliverySettings,
                  deliveryTimeHours: parseInt(e.target.value) || 1
                })}
                placeholder='مثال: 4'
              />
              <p className='text-xs text-muted-foreground'>الوقت المتوقع للتوصيل</p>
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='deliveryPrice'>سعر التوصيل</Label>
              <Input
                id='deliveryPrice'
                type='number'
                min='0'
                step='0.01'
                value={deliverySettings.deliveryPrice}
                onChange={(e) => setDeliverySettings({
                  ...deliverySettings,
                  deliveryPrice: parseFloat(e.target.value) || 0
                })}
                placeholder='مثال: 4.99'
              />
              <p className='text-xs text-muted-foreground'>سعر التوصيل لكل طلب</p>
            </div>
            
            <div className='space-y-2'>
              <Label htmlFor='freeShippingThreshold'>حد التوصيل المجاني</Label>
              <Input
                id='freeShippingThreshold'
                type='number'
                min='0'
                step='0.01'
                value={deliverySettings.freeShippingThreshold}
                onChange={(e) => setDeliverySettings({
                  ...deliverySettings,
                  freeShippingThreshold: parseFloat(e.target.value) || 0
                })}
                placeholder='مثال: 50'
              />
              <p className='text-xs text-muted-foreground'>الحد الأدنى للطلب للحصول على توصيل مجاني</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Calculator className='h-5 w-5' />
            إعدادات الضرائب
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='taxRate'>معدل الضريبة (%)</Label>
                <Input
                  id='taxRate'
                  type='number'
                  min='0'
                  max='100'
                  step='0.1'
                  value={taxSettings.taxRate}
                  onChange={(e) => setTaxSettings({
                    ...taxSettings,
                    taxRate: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='taxExemptThreshold'>حد الإعفاء الضريبي</Label>
                <Input
                  id='taxExemptThreshold'
                  type='number'
                  min='0'
                  step='0.01'
                  value={taxSettings.taxExemptThreshold}
                  onChange={(e) => setTaxSettings({
                    ...taxSettings,
                    taxExemptThreshold: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              <div className='flex items-center space-x-2 rtl:space-x-reverse'>
                <Switch
                  id='taxIncluded'
                  checked={taxSettings.taxIncluded}
                  onCheckedChange={(checked) => setTaxSettings({
                    ...taxSettings,
                    taxIncluded: checked
                  })}
                />
                <Label htmlFor='taxIncluded'>الضريبة مشمولة في السعر</Label>
              </div>
            </div>
            
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='taxExemptCategories'>فئات الإعفاء الضريبي</Label>
                <Textarea
                  id='taxExemptCategories'
                  placeholder='أدخل الفئات مفصولة بفواصل (مثال: prescription-eyewear, optical-devices)'
                  value={taxSettings.taxExemptCategories.join(', ')}
                  onChange={(e) => setTaxSettings({
                    ...taxSettings,
                    taxExemptCategories: e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat)
                  })}
                  rows={4}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='text-xl flex items-center gap-2'>
            <DollarSign className='h-5 w-5' />
            إعدادات تسعير المنتجات
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='defaultMarkup'>الهامش الافتراضي (%)</Label>
              <Input
                id='defaultMarkup'
                type='number'
                min='0'
                step='0.1'
                value={productPricing.defaultMarkup}
                onChange={(e) => setProductPricing({
                  ...productPricing,
                  defaultMarkup: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='bulkDiscountThreshold'>حد الخصم بالجملة</Label>
              <Input
                id='bulkDiscountThreshold'
                type='number'
                min='1'
                value={productPricing.bulkDiscountThreshold}
                onChange={(e) => setProductPricing({
                  ...productPricing,
                  bulkDiscountThreshold: parseInt(e.target.value) || 1
                })}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='bulkDiscountRate'>نسبة الخصم بالجملة (%)</Label>
              <Input
                id='bulkDiscountRate'
                type='number'
                min='0'
                max='100'
                step='0.1'
                value={productPricing.bulkDiscountRate}
                onChange={(e) => setProductPricing({
                  ...productPricing,
                  bulkDiscountRate: parseFloat(e.target.value) || 0
                })}
              />
            </div>
          </div>

          {/* Seasonal Discounts */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='font-semibold text-lg'>الخصومات الموسمية</h4>
              <Button onClick={addSeasonalDiscount} size='sm'>
                <Plus className='h-4 w-4 ml-2' />
                إضافة خصم موسمي
              </Button>
            </div>
            
            <div className='space-y-4'>
              {productPricing.seasonalDiscounts.map((discount, index) => (
                <div key={index} className='border rounded-lg p-4 space-y-4'>
                  <div className='flex items-center justify-between'>
                    <h5 className='font-medium'>الخصم الموسمي {index + 1}</h5>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => removeSeasonalDiscount(index)}
                    >
                      <Trash2 className='h-4 w-4 ml-2' />
                      حذف
                    </Button>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor={`discountName${index}`}>اسم الخصم</Label>
                      <Input
                        id={`discountName${index}`}
                        value={discount.name}
                        onChange={(e) => updateSeasonalDiscount(index, 'name', e.target.value)}
                        placeholder='اسم الخصم'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor={`discountRate${index}`}>نسبة الخصم (%)</Label>
                      <Input
                        id={`discountRate${index}`}
                        type='number'
                        min='0'
                        max='100'
                        step='0.1'
                        value={discount.discountRate}
                        onChange={(e) => updateSeasonalDiscount(index, 'discountRate', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor={`startDate${index}`}>تاريخ البداية</Label>
                      <Input
                        id={`startDate${index}`}
                        type='date'
                        value={discount.startDate}
                        onChange={(e) => updateSeasonalDiscount(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor={`endDate${index}`}>تاريخ النهاية</Label>
                      <Input
                        id={`endDate${index}`}
                        type='date'
                        value={discount.endDate}
                        onChange={(e) => updateSeasonalDiscount(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className='space-y-2'>
                    <Label htmlFor={`applicableCategories${index}`}>الفئات المطبقة</Label>
                    <Textarea
                      id={`applicableCategories${index}`}
                      placeholder='أدخل الفئات مفصولة بفواصل (مثال: sunglasses, contact-lenses)'
                      value={discount.applicableCategories.join(', ')}
                      onChange={(e) => updateSeasonalDiscount(index, 'applicableCategories', e.target.value.split(',').map(cat => cat.trim()).filter(cat => cat))}
                      rows={2}
                    />
                  </div>
                  
                  {index < productPricing.seasonalDiscounts.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button onClick={handleSubmit} disabled={isLoading} size='lg'>
          <Save className='h-4 w-4 ml-2' />
          {isLoading ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
        </Button>
      </div>
    </div>
  )
}
