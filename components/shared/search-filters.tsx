'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchFiltersProps {
  categories: string[]
  subcategories: Array<{ name: string; category: string }>
}

export default function SearchFilters({ categories, subcategories }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false) // Closed by default on mobile
  
  // Get current filter values
  const currentCategory = searchParams.get('category') || ''
  const currentSubcategory = searchParams.get('subcategory') || ''

  // Arabic translations
  const translations = {
    filters: 'البحث',
    category: 'الفئة',
    subcategory: 'الفئة الفرعية',
    clearAll: 'مسح الكل',
    showFilters: 'إظهار البحث',
    hideFilters: 'إخفاء البحث',
    allCategories: 'جميع الفئات',
    allSubcategories: 'جميع الفئات الفرعية',
    noResults: 'لا توجد نتائج',
    results: 'نتيجة',
    resultsPlural: 'نتائج'
  }

  const updateFilters = (newParams: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        params.delete(key)
        value.forEach(v => params.append(key, v))
      } else {
        params.set(key, value)
      }
    })
    
    params.set('page', '1') // Reset to first page when filters change
    router.push(`/search?${params.toString()}`)
  }

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (currentCategory) params.set('category', currentCategory)
    router.push(`/search?${params.toString()}`)
  }

  const handleCategoryChange = (category: string) => {
    if (category === currentCategory) {
      updateFilters({ category: '', subcategory: '' }) // Clear subcategory when category changes
    } else {
      updateFilters({ category, subcategory: '' }) // Clear subcategory when category changes
    }
  }

  const handleSubcategoryChange = (subcategory: string) => {
    if (subcategory === currentSubcategory) {
      updateFilters({ subcategory: '' })
    } else {
      updateFilters({ subcategory })
    }
  }



  const removeFilter = (key: string, value?: string) => {
    if (key === 'category') {
      updateFilters({ category: '', subcategory: '' })
    } else if (key === 'subcategory') {
      updateFilters({ subcategory: '' })
    }
  }

  const activeFilters = [
    ...(currentCategory ? [{ key: 'category', value: currentCategory, label: currentCategory }] : []),
    ...(currentSubcategory ? [{ key: 'subcategory', value: currentSubcategory, label: currentSubcategory }] : [])
  ]

  return (
    <div className="bg-white rounded-xl shadow-sm border-0 p-4 sm:p-6 lg:sticky lg:top-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
                     <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="font-semibold text-lg sm:text-xl text-gray-800">{translations.filters}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 sm:p-2 rounded-lg lg:hidden"
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Always show filters on desktop, toggle on mobile */}
      <div className={isOpen ? 'block' : 'hidden lg:block'}>
        <>
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="text-xs sm:text-sm font-medium text-gray-700">{translations.filters}:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {translations.clearAll}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs"
                  >
                    {filter.label}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFilter(filter.key, filter.value)}
                      className="h-3 w-3 sm:h-4 sm:w-4 p-0"
                    >
                      <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-4 sm:mb-6">
            <Label className="text-sm font-semibold mb-3 sm:mb-4 block text-gray-800">{translations.category}</Label>
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="all-categories"
                  checked={!currentCategory}
                  onCheckedChange={() => handleCategoryChange('')}
                  className="text-primary"
                />
                <Label htmlFor="all-categories" className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                  {translations.allCategories}
                </Label>
              </div>
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={category}
                    checked={currentCategory === category}
                    onCheckedChange={() => handleCategoryChange(category)}
                    className="text-primary"
                  />
                  <Label htmlFor={category} className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Subcategory Filter */}
          {subcategories.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <Label className="text-sm font-semibold mb-3 sm:mb-4 block text-gray-800">{translations.subcategory}</Label>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="all-subcategories"
                    checked={!currentSubcategory}
                    onCheckedChange={() => handleSubcategoryChange('')}
                    className="text-primary"
                  />
                  <Label htmlFor="all-subcategories" className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                    {translations.allSubcategories}
                  </Label>
                </div>
                {subcategories
                  .filter(sub => !currentCategory || sub.category === currentCategory)
                  .map((subcategory) => (
                    <div key={subcategory.name} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={subcategory.name}
                        checked={currentSubcategory === subcategory.name}
                        onCheckedChange={() => handleSubcategoryChange(subcategory.name)}
                        className="text-primary"
                      />
                      <Label htmlFor={subcategory.name} className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                        {subcategory.name}
                      </Label>
                    </div>
                  ))}
              </div>
            </div>
          )}

        </>
      </div>
    </div>
  )
}
