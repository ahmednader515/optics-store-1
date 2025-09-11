'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, Save, Eye, Monitor, Sun, BookOpen, Heart, Zap } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface ChatQuestion {
  id: string
  question: string
  options: ChatOption[]
}

interface ChatOption {
  id: string
  text: string
  icon: string
  score: { [key: string]: number }
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

const scoreCategories = ['computer', 'reading', 'sunglasses', 'medical', 'contact', 'care']

const defaultChatContent: ChatContent = {
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
          score: { computer: 3, reading: 2, medical: 1, sunglasses: 0, contact: 1, care: 0 }
        },
        {
          id: 'reading',
          text: 'القراءة والدراسة',
          icon: 'BookOpen',
          score: { reading: 3, medical: 2, computer: 1, sunglasses: 0, contact: 1, care: 0 }
        },
        {
          id: 'outdoor',
          text: 'الأنشطة الخارجية',
          icon: 'Sun',
          score: { sunglasses: 3, contact: 2, medical: 1, computer: 0, reading: 0, care: 1 }
        },
        {
          id: 'vision',
          text: 'تحسين الرؤية العامة',
          icon: 'Eye',
          score: { medical: 3, contact: 2, reading: 1, computer: 1, sunglasses: 0, care: 1 }
        }
      ]
    }
  ],
  results: {
    computer: {
      category: 'نظارات الكمبيوتر',
      title: 'النظارات المناسبة للكمبيوتر',
      description: 'نظارات مخصصة للعمل على الكمبيوتر مع حماية من الضوء الأزرق وعدسة مريحة للعين.',
      icon: 'Monitor',
      color: 'bg-blue-500',
      url: '/search?category=نظارات الكمبيوتر'
    },
    reading: {
      category: 'نظارات القراءة',
      title: 'النظارات المناسبة للقراءة',
      description: 'نظارات مريحة للقراءة والدراسة مع عدسة واضحة ومريحة للعين.',
      icon: 'BookOpen',
      color: 'bg-green-500',
      url: '/search?category=نظارات القراءة'
    },
    sunglasses: {
      category: 'النظارات الشمسية',
      title: 'النظارات الشمسية المناسبة لك',
      description: 'نظارات شمسية عالية الجودة مع حماية من الأشعة فوق البنفسجية وأناقة عالية.',
      icon: 'Sun',
      color: 'bg-yellow-500',
      url: '/search?category=النظارات الشمسية'
    },
    medical: {
      category: 'النظارات الطبية',
      title: 'النظارات الطبية المناسبة لك',
      description: 'نظارات طبية عالية الجودة مع عدسة مخصصة لتحسين الرؤية، مصنوعة من مواد متينة ومريحة.',
      icon: 'Eye',
      color: 'bg-purple-500',
      url: '/search?category=النظارات الطبية'
    },
    contact: {
      category: 'العدسة اللاصقة',
      title: 'العدسة اللاصقة المثالية لك',
      description: 'عدسة لاصقة مريحة وآمنة مع تقنيات متقدمة للرطوبة والوضوح، مثالية للنشاط والحركة.',
      icon: 'Heart',
      color: 'bg-pink-500',
      url: '/search?category=العدسة اللاصقة'
    },
    care: {
      category: 'مستلزمات العناية',
      title: 'منتجات العناية بالعين المناسبة لك',
      description: 'منتجات عالية الجودة للعناية بالعين والنظارات، لضمان النظافة والراحة المثلى.',
      icon: 'Heart',
      color: 'bg-indigo-500',
      url: '/search?category=مستلزمات العناية'
    }
  }
}

export default function ChatContentManager({ chatContent, onSave }: ChatContentManagerProps) {
  const [content, setContent] = useState<ChatContent>(() => {
    if (chatContent && chatContent.questions && chatContent.results) {
      return chatContent
    }
    return defaultChatContent
  })
  const [activeTab, setActiveTab] = useState<'welcome' | 'questions' | 'results'>('welcome')

  useEffect(() => {
    setContent(chatContent || defaultChatContent)
  }, [chatContent])

  const handleSave = () => {
    onSave(content)
    toast({
      title: 'تم الحفظ بنجاح',
      description: 'تم حفظ محتوى الدردشة بنجاح',
    })
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
    const newOption: ChatOption = {
      id: `option-${Date.now()}`,
      text: 'خيار جديد',
      icon: 'Heart',
      score: { computer: 0, reading: 0, sunglasses: 0, medical: 0, contact: 0, care: 0 }
    }
    setContent(prev => ({
      ...prev,
      questions: (prev.questions || []).map((q, i) => 
        i === questionIndex 
          ? { ...q, options: [...(q.options || []), newOption] }
          : q
      )
    }))
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
      category: 'فئة جديدة',
      title: 'عنوان جديد',
      description: 'وصف جديد',
      icon: 'Heart',
      color: 'bg-gray-500',
      url: '/search?category=فئة-جديدة'
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
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          حفظ التغييرات
        </Button>
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">أسئلة الدردشة</h4>
            <Button onClick={addQuestion} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              إضافة سؤال
            </Button>
          </div>

          {content.questions?.map((question, questionIndex) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">سؤال {questionIndex + 1}</CardTitle>
                  <Button
                    onClick={() => deleteQuestion(questionIndex)}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`question-${questionIndex}`}>نص السؤال</Label>
                  <Input
                    id={`question-${questionIndex}`}
                    value={question.question}
                    onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                    placeholder="أدخل نص السؤال..."
                    className="mt-2"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>خيارات الإجابة</Label>
                    <Button onClick={() => addOption(questionIndex)} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة خيار
                    </Button>
                  </div>

                  {question.options?.map((option, optionIndex) => (
                    <div key={option.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">خيار {optionIndex + 1}</span>
                        <Button
                          onClick={() => deleteOption(questionIndex, optionIndex)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`option-text-${questionIndex}-${optionIndex}`}>نص الخيار</Label>
                          <Input
                            id={`option-text-${questionIndex}-${optionIndex}`}
                            value={option.text}
                            onChange={(e) => updateOption(questionIndex, optionIndex, 'text', e.target.value)}
                            placeholder="أدخل نص الخيار..."
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`option-icon-${questionIndex}-${optionIndex}`}>الأيقونة</Label>
                          <select
                            id={`option-icon-${questionIndex}-${optionIndex}`}
                            value={option.icon}
                            onChange={(e) => updateOption(questionIndex, optionIndex, 'icon', e.target.value)}
                            className="mt-2 w-full p-2 border rounded-md"
                          >
                            {iconOptions.map(icon => (
                              <option key={icon.value} value={icon.value}>
                                {icon.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <Label>النقاط (Scores)</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                          {scoreCategories.map(category => (
                            <div key={category} className="flex items-center space-x-2">
                              <Label htmlFor={`score-${questionIndex}-${optionIndex}-${category}`} className="text-xs">
                                {category}
                              </Label>
                              <Input
                                id={`score-${questionIndex}-${optionIndex}-${category}`}
                                type="number"
                                min="0"
                                max="3"
                                value={option.score[category] || 0}
                                onChange={(e) => updateOption(questionIndex, optionIndex, 'score', {
                                  ...option.score,
                                  [category]: parseInt(e.target.value) || 0
                                })}
                                className="w-16 h-8 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
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
