'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Eye, Monitor, Sun, BookOpen, Heart, Zap } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { getAllCategories } from '@/lib/actions/category.actions'

interface ChatQuestion {
  id: string
  question: string
  options: ChatOption[]
  isFinal?: boolean
  isDynamic?: boolean
}

interface ChatOption {
  id: string
  text: string
  icon: string
  score: { [key: string]: number }
  nextQuestionId?: string
}

interface ChatResult {
  category: string
  title: string
  description: string
  icon: string
  color: string
  url: string
}

interface ChatContent {
  welcomeMessage: string
  questions: ChatQuestion[]
  results: { [key: string]: ChatResult }
}

interface ChatContentManagerProps {
  chatContent: ChatContent
  onSave: (content: ChatContent) => void
}

const iconOptions = [
  { value: 'Monitor', label: 'Monitor', icon: <Monitor className="w-4 h-4" /> },
  { value: 'Sun', label: 'Sun', icon: <Sun className="w-4 h-4" /> },
  { value: 'BookOpen', label: 'Book Open', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'Heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
  { value: 'Zap', label: 'Zap', icon: <Zap className="w-4 h-4" /> },
  { value: 'Eye', label: 'Eye', icon: <Eye className="w-4 h-4" /> },
]

// Dynamic categories will be loaded from database

const createDefaultChatContent = (categories: Array<{ name: string; slug: string }>): ChatContent => {
  // Create score object with current categories
  const createScoreObject = (scores: { [key: string]: number }) => {
    const scoreObject: { [key: string]: number } = {}
    categories.forEach(cat => {
      scoreObject[cat.slug] = scores[cat.slug] || 0
    })
    return scoreObject
  }

  return {
    welcomeMessage: 'مرحباً! أنا مساعدك الذكي لاختيار النظارات المناسبة. سأساعدك في العثور على أفضل النظارات بناءً على احتياجاتك. دعنا نبدأ!',
    questions: [
      {
        id: 'usage',
        question: 'ما هو الاستخدام الأساسي الذي تبحث عنه؟',
        options: [
          {
            id: 'computer',
            text: 'العمل على الكمبيوتر',
            icon: 'Monitor',
            nextQuestionId: 'lifestyle',
            score: createScoreObject({ computer: 3, reading: 2, medical: 1, sunglasses: 0, contact: 1, care: 0 })
          },
          {
            id: 'reading',
            text: 'القراءة والدراسة',
            icon: 'BookOpen',
            nextQuestionId: 'lifestyle',
            score: createScoreObject({ reading: 3, medical: 2, computer: 1, sunglasses: 0, contact: 1, care: 0 })
          },
          {
            id: 'outdoor',
            text: 'الأنشطة الخارجية',
            icon: 'Sun',
            nextQuestionId: 'lifestyle',
            score: createScoreObject({ sunglasses: 3, contact: 2, medical: 1, computer: 0, reading: 0, care: 1 })
          },
          {
            id: 'vision',
            text: 'تحسين الرؤية العامة',
            icon: 'Eye',
            nextQuestionId: 'lifestyle',
            score: createScoreObject({ medical: 3, contact: 2, reading: 1, computer: 1, sunglasses: 0, care: 1 })
          }
        ]
      },
      {
        id: 'lifestyle',
        question: 'كيف تصف نمط حياتك؟',
        options: [
          {
            id: 'active',
            text: 'نشط ورياضي',
            icon: 'Zap',
            nextQuestionId: 'preference',
            score: createScoreObject({ sunglasses: 2, contact: 3, medical: 1, computer: 0, reading: 0, care: 1 })
          },
          {
            id: 'professional',
            text: 'مهني وعملي',
            icon: 'Monitor',
            nextQuestionId: 'preference',
            score: createScoreObject({ computer: 3, medical: 2, reading: 1, sunglasses: 0, contact: 1, care: 0 })
          },
          {
            id: 'casual',
            text: 'عادي ومريح',
            icon: 'Heart',
            nextQuestionId: 'preference',
            score: createScoreObject({ reading: 2, medical: 2, sunglasses: 1, computer: 1, contact: 1, care: 1 })
          },
          {
            id: 'outdoor',
            text: 'خارجي ومغامر',
            icon: 'Sun',
            nextQuestionId: 'preference',
            score: createScoreObject({ sunglasses: 3, contact: 2, medical: 1, computer: 0, reading: 0, care: 1 })
          }
        ]
      },
      {
        id: 'preference',
        question: 'ما هو تفضيلك الشخصي؟',
        options: [
          {
            id: 'comfort',
            text: 'الراحة والسهولة',
            icon: 'Heart',
            nextQuestionId: 'final-result',
            score: createScoreObject({ contact: 3, medical: 2, reading: 2, computer: 1, sunglasses: 1, care: 1 })
          },
          {
            id: 'style',
            text: 'الأناقة والمظهر',
            icon: 'Eye',
            nextQuestionId: 'final-result',
            score: createScoreObject({ sunglasses: 3, medical: 2, reading: 2, computer: 1, contact: 1, care: 0 })
          },
          {
            id: 'functionality',
            text: 'الوظائف المتقدمة',
            icon: 'Zap',
            nextQuestionId: 'final-result',
            score: createScoreObject({ computer: 3, medical: 2, reading: 1, sunglasses: 1, contact: 2, care: 1 })
          },
          {
            id: 'maintenance',
            text: 'سهولة الصيانة',
            icon: 'BookOpen',
            nextQuestionId: 'final-result',
            score: createScoreObject({ reading: 3, medical: 2, sunglasses: 2, computer: 1, contact: 0, care: 2 })
          }
        ]
      }
    ],
    results: categories.reduce((acc, category, index) => {
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500']
      const icons = ['Monitor', 'BookOpen', 'Sun', 'Eye', 'Heart', 'Zap']
      
      acc[category.slug] = {
        category: category.name,
        title: `${category.name} المناسبة لك`,
        description: `منتجات عالية الجودة من فئة ${category.name} مع أفضل التقنيات والمواد.`,
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
        url: `/search?category=${encodeURIComponent(category.name)}`
      }
      return acc
    }, {} as { [key: string]: ChatResult })
  }
}

export default function ChatContentManager({ chatContent, onSave }: ChatContentManagerProps) {
  const [categories, setCategories] = useState<Array<{ name: string; slug: string }>>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [content, setContent] = useState<ChatContent>(() => {
    if (chatContent && chatContent.questions && chatContent.results) {
      return chatContent
    }
    return createDefaultChatContent([]) // Will be updated when categories load
  })
  const [activeTab, setActiveTab] = useState<'welcome' | 'questions' | 'results'>('welcome')
  
  // Refs for auto-scrolling
  const questionsContainerRef = useRef<HTMLDivElement>(null)
  const lastAddedQuestionRef = useRef<HTMLDivElement>(null)
  const lastAddedOptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setContent(chatContent || createDefaultChatContent(categories))
  }, [chatContent, categories])

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true)
        const dbCategories = await getAllCategories()
        setCategories(dbCategories.map(cat => ({
          name: cat.name,
          slug: cat.slug
        })))
      } catch (error) {
        console.error('Error fetching categories:', error)
        // Fallback to empty array if fetch fails
        setCategories([])
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  const handleSave = () => {
    onSave(content)
    toast({
      title: 'تم الحفظ بنجاح',
      description: 'تم حفظ محتوى الدردشة بنجاح',
    })
  }

  // Update parent component when content changes (without triggering save)
  useEffect(() => {
    if (content && Object.keys(content).length > 0) {
      onSave(content)
    }
  }, [content]) // Remove onSave from dependencies to prevent infinite loop

  // Auto-scroll functions
  const scrollToElement = (element: HTMLElement | null) => {
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      })
    }
  }

  const scrollToLastQuestion = () => {
    setTimeout(() => {
      scrollToElement(lastAddedQuestionRef.current)
    }, 100)
  }

  const scrollToLastOption = () => {
    setTimeout(() => {
      scrollToElement(lastAddedOptionRef.current)
    }, 100)
  }

  const addQuestion = () => {
    const newQuestion: ChatQuestion = {
      id: `question-${Date.now()}`,
      question: 'سؤال جديد',
      options: []
    }
    setContent(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }))
    scrollToLastQuestion()
  }

  const updateQuestion = (index: number, field: keyof ChatQuestion, value: any) => {
    setContent(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }))
  }

  const deleteQuestion = (index: number) => {
    setContent(prev => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== index)
    }))
  }

  const addOption = (questionIndex: number) => {
    // Create score object with current categories
    const scoreObject: { [key: string]: number } = {}
    categories.forEach(cat => {
      scoreObject[cat.slug] = 0
    })
    
    const newOption: ChatOption = {
      id: `option-${Date.now()}`,
      text: 'خيار جديد',
      icon: 'Heart',
      score: scoreObject,
      nextQuestionId: ''
    }
    setContent(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...(q.options || []), newOption] }
          : q
      )
    }))
    scrollToLastOption()
  }

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof ChatOption, value: any) => {
    setContent(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex 
          ? {
              ...q,
              options: (q.options || []).map((opt, j) => 
                j === optionIndex ? { ...opt, [field]: value } : opt
              )
            }
          : q
      )
    }))
  }

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    setContent(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex 
          ? { ...q, options: (q.options || []).filter((_, j) => j !== optionIndex) }
          : q
      )
    }))
  }

  const updateResult = (key: string, field: keyof ChatResult, value: string) => {
    setContent(prev => ({
      ...prev,
      results: {
        ...(prev.results || {}),
        [key]: {
          ...(prev.results?.[key] || {}),
          [field]: value
        }
      }
    }))
  }

  const addResult = () => {
    const newKey = `result-${Date.now()}`
    const newResult: ChatResult = {
      category: categories.length > 0 ? categories[0].name : 'فئة جديدة',
      title: 'عنوان جديد',
      description: 'وصف جديد',
      icon: 'Heart',
      color: 'bg-gray-500',
      url: categories.length > 0 ? `/search?category=${encodeURIComponent(categories[0].name)}` : '/search?category=فئة-جديدة'
    }
    setContent(prev => ({
      ...prev,
      results: {
        ...(prev.results || {}),
        [newKey]: newResult
      }
    }))
  }

  const deleteResult = (key: string) => {
    setContent(prev => {
      const newResults = { ...(prev.results || {}) }
      delete newResults[key]
      return {
        ...prev,
        results: newResults
      }
    })
  }

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName)
    return iconOption ? iconOption.icon : <Heart className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">إدارة محتوى الدردشة المساعدة</h3>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('welcome')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'welcome' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          رسالة الترحيب
        </button>
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'questions' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          الأسئلة
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'results' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          النتائج
        </button>
      </div>

      {/* Welcome Message Tab */}
      {activeTab === 'welcome' && (
        <Card>
          <CardHeader>
            <CardTitle>رسالة الترحيب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="welcomeMessage">نص رسالة الترحيب</Label>
                <Textarea
                  id="welcomeMessage"
                  value={content.welcomeMessage}
                  onChange={(e) => setContent(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  placeholder="أدخل رسالة الترحيب..."
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-semibold text-gray-900">أسئلة الدردشة</h4>
              <p className="text-sm text-gray-600 mt-1">قم بإدارة الأسئلة وخيارات الإجابة للدردشة المساعدة</p>
            </div>
            <Button onClick={addQuestion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              إضافة سؤال جديد
            </Button>
          </div>

          <div ref={questionsContainerRef}>
            {content.questions && content.questions.length > 0 ? (
              content.questions.map((question, questionIndex) => (
              <Card 
                key={question.id} 
                className="mb-4"
                ref={questionIndex === content.questions.length - 1 ? lastAddedQuestionRef : null}
              >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">سؤال {questionIndex + 1}</CardTitle>
                  <Button
                    onClick={() => deleteQuestion(questionIndex)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question Text */}
                <div>
                  <Label htmlFor={`question-${questionIndex}`} className="text-base font-medium">نص السؤال</Label>
                  <Input
                    id={`question-${questionIndex}`}
                    value={question.question}
                    onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                    placeholder="أدخل نص السؤال..."
                    className="mt-2 text-base"
                  />
                </div>

                {/* Answer Options */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-medium">خيارات الإجابة</Label>
                    <Button onClick={() => addOption(questionIndex)} size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة خيار
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {question.options?.map((option, optionIndex) => (
                      <div 
                        key={option.id} 
                        className="bg-gray-50 rounded-lg p-4 border"
                        ref={optionIndex === question.options.length - 1 ? lastAddedOptionRef : null}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-gray-700">خيار {optionIndex + 1}</span>
                          <Button
                            onClick={() => deleteOption(questionIndex, optionIndex)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Option Details - Simplified Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`option-text-${questionIndex}-${optionIndex}`} className="text-sm">نص الخيار</Label>
                            <Input
                              id={`option-text-${questionIndex}-${optionIndex}`}
                              value={option.text}
                              onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                              placeholder="أدخل نص الخيار..."
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`option-icon-${questionIndex}-${optionIndex}`} className="text-sm">الأيقونة</Label>
                            <select
                              id={`option-icon-${questionIndex}-${optionIndex}`}
                              value={option.icon}
                              onChange={(e) => updateOption(questionIndex, optionIndex, 'icon', e.target.value)}
                              className="mt-1 w-full p-2 border rounded-md"
                            >
                              {iconOptions.map(icon => (
                                <option key={icon.value} value={icon.value}>
                                  {icon.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Label htmlFor={`option-next-${questionIndex}-${optionIndex}`} className="text-sm">السؤال التالي</Label>
                          <select
                            id={`option-next-${questionIndex}-${optionIndex}`}
                            value={option.nextQuestionId || ''}
                            onChange={(e) => updateOption(questionIndex, optionIndex, 'nextQuestionId', e.target.value)}
                            className="mt-1 w-full p-2 border rounded-md"
                          >
                            <option value="">اختر السؤال التالي</option>
                            {content.questions?.filter((q, qIndex) => qIndex !== questionIndex).map((q, qIndex) => (
                              <option key={q.id} value={q.id}>
                                {q.question.length > 50 ? q.question.substring(0, 50) + '...' : q.question}
                              </option>
                            ))}
                            <option value="face-upload">تحليل شكل الوجه</option>
                            <option value="final-result">النتيجة النهائية</option>
                          </select>
                        </div>

                        {/* Simplified Scoring - Only show if categories are loaded */}
                        {!isLoadingCategories && categories.length > 0 && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium text-gray-600">النقاط</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                              {categories.slice(0, 6).map(category => (
                                <div key={category.slug} className="flex items-center justify-between space-x-3">
                                  <Label htmlFor={`score-${questionIndex}-${optionIndex}-${category.slug}`} className="text-sm text-gray-700 flex-1">
                                    {category.name}
                                  </Label>
                                  <Input
                                    id={`score-${questionIndex}-${optionIndex}-${category.slug}`}
                                    type="number"
                                    min="0"
                                    max="3"
                                    value={option.score[category.slug] || 0}
                                    onChange={(e) => updateOption(questionIndex, optionIndex, 'score', {
                                      ...option.score,
                                      [category.slug]: parseInt(e.target.value) || 0
                                    })}
                                    className="w-16 h-8 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                            {categories.length > 6 && (
                              <p className="text-xs text-gray-500 mt-1">+ {categories.length - 6} فئات أخرى</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أسئلة بعد</h3>
              <p className="text-gray-600 mb-4">ابدأ بإنشاء سؤال جديد لإعداد الدردشة المساعدة</p>
              <Button onClick={addQuestion} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                إضافة أول سؤال
              </Button>
            </div>
          )}
          </div>
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">نتائج التوصية</h4>
            <Button onClick={addResult} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              إضافة نتيجة
            </Button>
          </div>
          
          {Object.entries(content.results || {}).map(([key, result]) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{result.category}</CardTitle>
                  <Button
                    onClick={() => deleteResult(key)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`result-category-${key}`}>الفئة</Label>
                    <Input
                      id={`result-category-${key}`}
                      value={result.category}
                      onChange={(e) => updateResult(key, 'category', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`result-title-${key}`}>العنوان</Label>
                    <Input
                      id={`result-title-${key}`}
                      value={result.title}
                      onChange={(e) => updateResult(key, 'title', e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`result-icon-${key}`}>الأيقونة</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <select
                        id={`result-icon-${key}`}
                        value={result.icon}
                        onChange={(e) => updateResult(key, 'icon', e.target.value)}
                        className="flex-1 p-2 border rounded-md"
                      >
                        {iconOptions.map(icon => (
                          <option key={icon.value} value={icon.value}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                      <div className="p-2 border rounded-md bg-gray-50">
                        {getIconComponent(result.icon)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`result-color-${key}`}>اللون</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        id={`result-color-${key}`}
                        value={result.color}
                        onChange={(e) => updateResult(key, 'color', e.target.value)}
                        placeholder="bg-blue-500"
                        className="flex-1"
                      />
                      <div 
                        className={`w-8 h-8 rounded border ${result.color || 'bg-gray-300'}`}
                        title={result.color || 'No color set'}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`result-url-${key}`}>الرابط</Label>
                    <Input
                      id={`result-url-${key}`}
                      value={result.url}
                      onChange={(e) => updateResult(key, 'url', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`result-description-${key}`}>الوصف</Label>
                  <Textarea
                    id={`result-description-${key}`}
                    value={result.description}
                    onChange={(e) => updateResult(key, 'description', e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                {/* Preview Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600">معاينة النتيجة</Label>
                  <div className="mt-2 p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded ${result.color || 'bg-gray-300'}`}>
                        {getIconComponent(result.icon)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{result.title}</h4>
                        <p className="text-sm text-gray-600">{result.category}</p>
                        <p className="text-xs text-gray-500 mt-1">{result.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
