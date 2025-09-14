'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { 
  createSubCategory, 
  updateSubCategory, 
  deleteSubCategory,
  type ISubCategoryInput,
  type ISubCategoryUpdate 
} from '@/lib/actions/subcategory.actions'
import DeleteDialog from '@/components/shared/delete-dialog'

interface SubCategory {
  id: string
  name: string
  description?: string
  slug: string
  image?: string
  isActive: boolean
  sortOrder: number
  categoryId: string
  category: {
    name: string
    slug: string
  }
}

interface SubCategoryManagerProps {
  subcategories: SubCategory[]
  categoryId: string
  categoryName: string
  onSubCategoriesChange: () => void
}

export default function SubCategoryManager({ 
  subcategories, 
  categoryId, 
  categoryName,
  onSubCategoriesChange 
}: SubCategoryManagerProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const [formData, setFormData] = useState<ISubCategoryInput>({
    name: '',
    description: '',
    slug: '',
    image: undefined,
    isActive: true,
    sortOrder: subcategories.length,
    categoryId: categoryId
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      image: undefined,
      isActive: true,
      sortOrder: subcategories.length,
      categoryId: categoryId
    })
    setIsCreating(false)
    setIsEditing(null)
  }

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createSubCategory(formData)
      
      if (result.success) {
        toast({
          title: 'تم إنشاء الفئة الفرعية بنجاح',
          description: result.data.name
        })
        resetForm()
        onSubCategoriesChange()
      } else {
        toast({
          title: 'خطأ في إنشاء الفئة الفرعية',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      const updateData: ISubCategoryUpdate = {
        ...formData,
        id
      }
      
      const result = await updateSubCategory(updateData)
      
      if (result.success) {
        toast({
          title: 'تم تحديث الفئة الفرعية بنجاح',
          description: result.data.name
        })
        resetForm()
        onSubCategoriesChange()
      } else {
        toast({
          title: 'خطأ في تحديث الفئة الفرعية',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }

  const handleDelete = async (id: string) => {
    const result = await deleteSubCategory(id)
    
    if (result.success) {
      toast({
        title: 'تم حذف الفئة الفرعية بنجاح'
      })
      onSubCategoriesChange()
    } else {
      toast({
        title: 'خطأ في حذف الفئة الفرعية',
        description: result.error,
        variant: 'destructive'
      })
    }
  }

  const startEdit = (subcategory: SubCategory) => {
    setFormData({
      name: subcategory.name,
      description: subcategory.description || '',
      slug: subcategory.slug,
      image: subcategory.image || undefined,
      isActive: subcategory.isActive,
      sortOrder: subcategory.sortOrder,
      categoryId: subcategory.categoryId
    })
    setIsEditing(subcategory.id)
    setIsCreating(false)
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            الفئات الفرعية - {categoryName}
          </CardTitle>
          <Button
            onClick={() => {
              resetForm()
              setIsCreating(true)
            }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة فئة فرعية
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الفئة الفرعية</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="مثال: نظارات رجالية"
                    dir="rtl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">رابط الفئة الفرعية</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="men-glasses"
                    dir="ltr"
                  />
                </div>
                
                
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف مختصر للفئة الفرعية"
                    dir="rtl"
                    rows={3}
                  />
                </div>
                
                <div className="md:col-span-2 flex items-center justify-end space-x-2 space-x-reverse">
                  <Label htmlFor="isActive" className="text-sm font-medium">فعال</Label>
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                    className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={isCreating ? handleCreate : () => handleUpdate(isEditing!)}
                  disabled={isPending || !formData.name || !formData.slug}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? 'إنشاء' : 'تحديث'}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SubCategories List */}
        <div className="space-y-2">
          {subcategories.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              لا توجد فئات فرعية لهذه الفئة
            </p>
          ) : (
            subcategories.map((subcategory) => (
              <Card key={subcategory.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div>
                      <h4 className="font-medium">{subcategory.name}</h4>
                      <p className="text-sm text-gray-500">{subcategory.slug}</p>
                      {subcategory.description && (
                        <p className="text-sm text-gray-600 mt-1">{subcategory.description}</p>
                      )}
                    </div>
                    <Badge variant={subcategory.isActive ? "default" : "secondary"}>
                      {subcategory.isActive ? (
                        <><Eye className="w-3 h-3 ml-1" /> فعال</>
                      ) : (
                        <><EyeOff className="w-3 h-3 ml-1" /> غير فعال</>
                      )}
                    </Badge>
                    <Badge variant="outline">
                      ترتيب: {subcategory.sortOrder}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startEdit(subcategory)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DeleteDialog
                      id={subcategory.id}
                      action={handleDelete}
                      callbackAction={onSubCategoriesChange}
                    />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
