'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// SubCategory input schema
const SubCategoryInputSchema = z.object({
  name: z.string().min(1, 'اسم الفئة الفرعية مطلوب'),
  description: z.string().optional(),
  slug: z.string().min(1, 'رابط الفئة الفرعية مطلوب'),
  image: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  categoryId: z.string().min(1, 'معرف الفئة الرئيسية مطلوب'),
})

// SubCategory update schema
const SubCategoryUpdateSchema = SubCategoryInputSchema.extend({
  id: z.string().min(1, 'معرف الفئة الفرعية مطلوب'),
})

export type ISubCategoryInput = z.infer<typeof SubCategoryInputSchema>
export type ISubCategoryUpdate = z.infer<typeof SubCategoryUpdateSchema>

// Create subcategory
export async function createSubCategory(data: ISubCategoryInput) {
  try {
    const subcategory = await prisma.subCategory.create({
      data,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    })
    
    revalidatePath('/admin/categories')
    return { success: true, data: subcategory }
  } catch (error: any) {
    console.error('Error creating subcategory:', error)
    return { 
      success: false, 
      error: error.code === 'P2002' 
        ? 'رابط الفئة الفرعية موجود بالفعل' 
        : 'حدث خطأ أثناء إنشاء الفئة الفرعية' 
    }
  }
}

// Update subcategory
export async function updateSubCategory(data: ISubCategoryUpdate) {
  try {
    const { id, ...updateData } = data
    const subcategory = await prisma.subCategory.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    })
    
    revalidatePath('/admin/categories')
    return { success: true, data: subcategory }
  } catch (error: any) {
    console.error('Error updating subcategory:', error)
    return { 
      success: false, 
      error: error.code === 'P2002' 
        ? 'رابط الفئة الفرعية موجود بالفعل' 
        : 'حدث خطأ أثناء تحديث الفئة الفرعية' 
    }
  }
}

// Delete subcategory
export async function deleteSubCategory(id: string) {
  try {
    await prisma.subCategory.delete({
      where: { id }
    })
    
    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting subcategory:', error)
    return { 
      success: false, 
      error: 'حدث خطأ أثناء حذف الفئة الفرعية' 
    }
  }
}

// Get all subcategories with their parent categories
export async function getAllSubCategories() {
  try {
    const subcategories = await prisma.subCategory.findMany({
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { sortOrder: 'asc' }
      ]
    })
    
    return { success: true, data: subcategories }
  } catch (error: any) {
    console.error('Error fetching subcategories:', error)
    return { 
      success: false, 
      error: 'حدث خطأ أثناء جلب الفئات الفرعية' 
    }
  }
}

// Get subcategories by category ID
export async function getSubCategoriesByCategory(categoryId: string) {
  try {
    const subcategories = await prisma.subCategory.findMany({
      where: { 
        categoryId,
        isActive: true 
      },
      orderBy: { sortOrder: 'asc' }
    })
    
    return { success: true, data: subcategories }
  } catch (error: any) {
    console.error('Error fetching subcategories by category:', error)
    return { 
      success: false, 
      error: 'حدث خطأ أثناء جلب الفئات الفرعية'
    }
  }
}

// Get subcategory by ID
export async function getSubCategoryById(id: string) {
  try {
    const subcategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          }
        }
      }
    })
    
    if (!subcategory) {
      return { 
        success: false, 
        error: 'الفئة الفرعية غير موجودة' 
      }
    }
    
    return { success: true, data: subcategory }
  } catch (error: any) {
    console.error('Error fetching subcategory by ID:', error)
    return { 
      success: false, 
      error: 'حدث خطأ أثناء جلب الفئة الفرعية' 
    }
  }
}
