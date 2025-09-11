'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageCircle, 
  X, 
  Send, 
  Eye, 
  Monitor, 
  Sun, 
  BookOpen, 
  Heart, 
  Zap, 
  ArrowRight,
  Bot,
  User,
  Camera,
  Upload
} from 'lucide-react'
import Link from 'next/link'
import { FaceShapeDetector } from '@/components/face-shape-detector'
import { UploadButton } from '@/lib/uploadthing'
import { useToast } from '@/hooks/use-toast'
import { getProductsByFaceShape } from '@/lib/actions/chat.actions'
import { getRecommendedGlassesShape, faceShapeDescriptions } from '@/lib/face-shape-mapping'
import ProductDisplay from './product-display'

// Icon options for chat
const iconOptions = [
  { value: 'Monitor', label: 'Monitor', icon: <Monitor className="w-4 h-4" /> },
  { value: 'Sun', label: 'Sun', icon: <Sun className="w-4 h-4" /> },
  { value: 'BookOpen', label: 'Book Open', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'Heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
  { value: 'Zap', label: 'Zap', icon: <Zap className="w-4 h-4" /> },
  { value: 'Eye', label: 'Eye', icon: <Eye className="w-4 h-4" /> },
  { value: 'Camera', label: 'Camera', icon: <Camera className="w-4 h-4" /> },
  { value: 'Upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
]

// Helper function to get icon component
const getIconComponent = (iconName: string) => {
  const iconOption = iconOptions.find(opt => opt.value === iconName)
  return iconOption ? iconOption.icon : <Heart className="w-4 h-4" />
}

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  content: string
  timestamp: Date
  options?: ChatOption[]
  faceShapeData?: {
    faceShape: string
    confidence: number
    recommendations: string[]
  }
  products?: any[]
  faceShape?: string
  recommendedShape?: string
  category?: string
}

interface ChatOption {
  id: string
  text: string
  icon: React.ReactNode
  score: { [key: string]: number }
}

interface ChatResult {
  category: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  url: string
}

const chatQuestions = [
  {
    id: 'usage',
    question: 'ما هو الاستخدام الأساسي الذي تبحث عنه؟',
    options: [
      {
        id: 'computer',
        text: 'العمل على الكمبيوتر',
        icon: <Monitor className="w-4 h-4" />,
        score: { computer: 3, reading: 2, medical: 1, sunglasses: 0, contact: 1, care: 0 }
      },
      {
        id: 'reading',
        text: 'القراءة والدراسة',
        icon: <BookOpen className="w-4 h-4" />,
        score: { reading: 3, medical: 2, computer: 1, sunglasses: 0, contact: 1, care: 0 }
      },
      {
        id: 'outdoor',
        text: 'الأنشطة الخارجية',
        icon: <Sun className="w-4 h-4" />,
        score: { sunglasses: 3, contact: 2, medical: 1, computer: 0, reading: 0, care: 1 }
      },
      {
        id: 'vision',
        text: 'تحسين الرؤية العامة',
        icon: <Eye className="w-4 h-4" />,
        score: { medical: 3, contact: 2, reading: 1, computer: 1, sunglasses: 0, care: 1 }
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
        icon: <Zap className="w-4 h-4" />,
        score: { sunglasses: 2, contact: 3, medical: 1, computer: 0, reading: 0, care: 1 }
      },
      {
        id: 'professional',
        text: 'مهني وعملي',
        icon: <Monitor className="w-4 h-4" />,
        score: { computer: 3, medical: 2, reading: 1, sunglasses: 0, contact: 1, care: 0 }
      },
      {
        id: 'casual',
        text: 'عادي ومريح',
        icon: <Heart className="w-4 h-4" />,
        score: { reading: 2, medical: 2, sunglasses: 1, computer: 1, contact: 1, care: 1 }
      },
      {
        id: 'outdoor',
        text: 'خارجي ومغامر',
        icon: <Sun className="w-4 h-4" />,
        score: { sunglasses: 3, contact: 2, medical: 1, computer: 0, reading: 0, care: 1 }
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
        icon: <Heart className="w-4 h-4" />,
        score: { contact: 3, medical: 2, reading: 2, computer: 1, sunglasses: 1, care: 1 }
      },
      {
        id: 'style',
        text: 'الأناقة والمظهر',
        icon: <Eye className="w-4 h-4" />,
        score: { sunglasses: 3, medical: 2, reading: 2, computer: 1, contact: 1, care: 0 }
      },
      {
        id: 'functionality',
        text: 'الوظائف المتقدمة',
        icon: <Zap className="w-4 h-4" />,
        score: { computer: 3, medical: 2, reading: 1, sunglasses: 1, contact: 2, care: 1 }
      },
      {
        id: 'maintenance',
        text: 'سهولة الصيانة',
        icon: <BookOpen className="w-4 h-4" />,
        score: { reading: 3, medical: 2, sunglasses: 2, computer: 1, contact: 0, care: 2 }
      }
    ]
  },
  {
    id: 'age',
    question: 'في أي فئة عمرية تقع؟',
    options: [
      {
        id: 'young',
        text: '18-30 سنة',
        icon: <Zap className="w-4 h-4" />,
        score: { contact: 3, sunglasses: 2, computer: 2, medical: 1, reading: 0, care: 1 }
      },
      {
        id: 'middle',
        text: '31-50 سنة',
        icon: <Monitor className="w-4 h-4" />,
        score: { computer: 3, medical: 2, reading: 2, sunglasses: 1, contact: 2, care: 1 }
      },
      {
        id: 'mature',
        text: '51-65 سنة',
        icon: <BookOpen className="w-4 h-4" />,
        score: { reading: 3, medical: 3, computer: 2, sunglasses: 1, contact: 1, care: 2 }
      },
      {
        id: 'senior',
        text: 'أكثر من 65 سنة',
        icon: <Heart className="w-4 h-4" />,
        score: { reading: 3, medical: 3, care: 3, computer: 1, sunglasses: 1, contact: 0 }
      }
    ]
  }
]

const chatResults: { [key: string]: ChatResult } = {
  computer: {
    category: 'نظارات الكمبيوتر',
    title: 'نظارات الكمبيوتر المثالية لك',
    description: 'نظارات مصممة خصيصاً لحماية عينيك من الضوء الأزرق المنبعث من الشاشات، مع تقليل إجهاد العين وتحسين التركيز.',
    icon: <Monitor className="w-6 h-6" />,
    color: 'bg-blue-500',
    url: '/search?category=نظارات الكمبيوتر'
  },
  reading: {
    category: 'نظارات القراءة',
    title: 'نظارات القراءة المناسبة لك',
    description: 'نظارات مريحة وواضحة للقراءة والدراسة، مع عدسة عالية الجودة لرؤية مثالية.',
    icon: <BookOpen className="w-6 h-6" />,
    color: 'bg-green-500',
    url: '/search?category=نظارات القراءة'
  },
  sunglasses: {
    category: 'النظارات الشمسية',
    title: 'النظارات الشمسية المثالية لك',
    description: 'نظارات شمسية أنيقة ومتينة مع حماية 100% من الأشعة فوق البنفسجية، مثالية للأنشطة الخارجية.',
    icon: <Sun className="w-6 h-6" />,
    color: 'bg-yellow-500',
    url: '/search?category=النظارات الشمسية'
  },
  medical: {
    category: 'النظارات الطبية',
    title: 'النظارات الطبية المناسبة لك',
    description: 'نظارات طبية عالية الجودة مع عدسة مخصصة لتحسين الرؤية، مصنوعة من مواد متينة ومريحة.',
    icon: <Eye className="w-6 h-6" />,
    color: 'bg-purple-500',
    url: '/search?category=النظارات الطبية'
  },
  contact: {
    category: 'العدسة اللاصقة',
    title: 'العدسة اللاصقة المثالية لك',
    description: 'عدسة لاصقة مريحة وآمنة مع تقنيات متقدمة للرطوبة والوضوح، مثالية للنشاط والحركة.',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-pink-500',
    url: '/search?category=العدسة اللاصقة'
  },
  care: {
    category: 'مستلزمات العناية',
    title: 'منتجات العناية بالعين المناسبة لك',
    description: 'منتجات عالية الجودة للعناية بالعين والنظارات، لضمان النظافة والراحة المثلى.',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-indigo-500',
    url: '/search?category=مستلزمات العناية'
  }
}

interface GlassesChatProps {
  chatContent?: {
    welcomeMessage?: string
    questions?: Array<{
      id: string
      question: string
      options: Array<{
        id: string
        text: string
        icon: string
        score: { [key: string]: number }
      }>
    }>
    results?: { [key: string]: {
      category: string
      title: string
      description: string
      icon: string
      color: string
      url: string
    }}
  }
}

export default function GlassesChat({ chatContent }: GlassesChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasBeenOpened, setHasBeenOpened] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [scores, setScores] = useState<{ [key: string]: number }>({
    computer: 0,
    reading: 0,
    sunglasses: 0,
    medical: 0,
    contact: 0,
    care: 0
  })
  const [isComplete, setIsComplete] = useState(false)
  const [showFaceShape, setShowFaceShape] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [faceShapeResult, setFaceShapeResult] = useState<{
    faceShape: string
    confidence: number
    recommendations: string[]
  } | null>(null)
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Check localStorage on component mount
  useEffect(() => {
    const hasOpenedBefore = localStorage.getItem('glasses-chat-opened')
    if (hasOpenedBefore === 'true') {
      setHasBeenOpened(true)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startChat = () => {
    setIsOpen(true)
    setHasBeenOpened(true)
    localStorage.setItem('glasses-chat-opened', 'true')
    setMessages([
      {
        id: '1',
        type: 'bot',
        content: chatContent?.welcomeMessage || 'مرحباً! أنا مساعدك الذكي لاختيار النظارات المناسبة. سأساعدك في العثور على أفضل النظارات بناءً على احتياجاتك. دعنا نبدأ!',
        timestamp: new Date()
      }
    ])
    askQuestion(0)
  }

  const askQuestion = (questionIndex: number) => {
    const questions = chatContent?.questions || chatQuestions
    if (questionIndex >= questions.length) {
      showResult()
      return
    }

    const question = questions[questionIndex]
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `question-${questionIndex}`,
        type: 'bot',
        content: question.question,
        timestamp: new Date(),
        options: question.options.map(option => ({
          ...option,
          icon: typeof option.icon === 'string' ? getIconComponent(option.icon) : option.icon
        }))
      }])
    }, 1000)
  }

  const handleOptionSelect = (option: ChatOption) => {
    // Add user's choice to messages
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user',
      content: option.text,
      timestamp: new Date()
    }])

    // Update scores
    const newScores = { ...scores }
    Object.keys(option.score).forEach(category => {
      newScores[category] += option.score[category]
    })
    setScores(newScores)

    // Add bot response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `bot-response-${Date.now()}`,
        type: 'bot',
        content: 'شكراً لك! دعني أسألك سؤالاً آخر.',
        timestamp: new Date()
      }])
    }, 500)

    // Move to next question
    const nextQuestion = currentQuestion + 1
    setCurrentQuestion(nextQuestion)
    askQuestion(nextQuestion)
  }

  const showResult = () => {
    const maxScore = Math.max(...Object.values(scores))
    const resultCategory = Object.keys(scores).find(category => scores[category] === maxScore) || 'medical'
    const results = chatContent?.results || chatResults
    const result = results[resultCategory]

    if (result) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: 'result',
          type: 'bot',
          content: `بناءً على إجاباتك، أعتقد أن ${result.title} سيكون الخيار الأمثل لك!`,
          timestamp: new Date()
        }])
      }, 1000)

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: 'result-details',
          type: 'bot',
          content: result.description,
          timestamp: new Date()
        }])
      }, 2000)
    }

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'face-shape-question',
        type: 'bot',
        content: 'لإعطائك توصيات أكثر دقة، هل تريد تحليل شكل وجهك لاختيار شكل النظارات المناسب؟',
        timestamp: new Date(),
        options: [
          {
            id: 'analyze-face',
            text: 'نعم، أريد تحليل شكل وجهي',
            icon: <Camera className="w-4 h-4" />,
            score: {}
          },
          {
            id: 'skip-face-analysis',
            text: 'لا، أريد رؤية المنتجات مباشرة',
            icon: <ArrowRight className="w-4 h-4" />,
            score: {}
          }
        ]
      }])
    }, 3000)

    setIsComplete(true)
  }

  const handleResultAction = (option: ChatOption) => {
    if (option.id === 'analyze-face') {
      setMessages(prev => [...prev, {
        id: `user-action-${Date.now()}`,
        type: 'user',
        content: option.text,
        timestamp: new Date()
      }])

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `face-shape-instructions`,
          type: 'bot',
          content: 'ممتاز! رفع صورة واضحة لوجهك وسأحلل شكل وجهك وأعطيك توصيات دقيقة لشكل النظارات المناسب.',
          timestamp: new Date()
        }])
      }, 500)

      setShowFaceShape(true)
    } else if (option.id === 'skip-face-analysis') {
      setMessages(prev => [...prev, {
        id: `user-action-${Date.now()}`,
        type: 'user',
        content: option.text,
        timestamp: new Date()
      }])

      setTimeout(() => {
        showFinalResults()
      }, 500)
    } else if (option.id === 'view-products') {
      // Find the stored product URL
      const productUrlMessage = messages.find(msg => msg.id === 'product-url')
      const urlToOpen = productUrlMessage?.content || chatResults[Object.keys(scores).find(category => scores[category] === Math.max(...Object.values(scores))) || 'medical'].url
      
      // Open the products page in a new tab
      window.open(urlToOpen, '_blank')
      
      setMessages(prev => [...prev, {
        id: `user-action-${Date.now()}`,
        type: 'user',
        content: option.text,
        timestamp: new Date()
      }])

      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `bot-final-${Date.now()}`,
          type: 'bot',
          content: faceShapeResult 
            ? `ممتاز! لقد فتحت صفحة المنتجات المناسبة لوجهك (شكل ${faceShapeResult.faceShape}). إذا كنت بحاجة إلى مساعدة أخرى، لا تتردد في سؤالي!`
            : 'ممتاز! لقد فتحت صفحة المنتجات المقترحة لك. إذا كنت بحاجة إلى مساعدة أخرى، لا تتردد في سؤالي!',
          timestamp: new Date()
        }])
      }, 500)
    } else if (option.id === 'view-all-products') {
      const maxScore = Math.max(...Object.values(scores))
      const resultCategory = Object.keys(scores).find(category => scores[category] === maxScore) || 'medical'
      const results = chatContent?.results || chatResults
      const result = results[resultCategory]
      
      window.open(result?.url || '/search', '_blank')
      
      setMessages(prev => [...prev, {
        id: `user-action-${Date.now()}`,
        type: 'user',
        content: option.text,
        timestamp: new Date()
      }])
    } else if (option.id === 'restart') {
      resetChat()
    }
  }

  const handleFaceShapeResult = async (result: any) => {
    const recommendations = getGlassesRecommendations(result.faceShape)
    const faceShapeData = {
      faceShape: result.faceShape,
      confidence: result.confidence,
      recommendations
    }
    
    setFaceShapeResult(faceShapeData)
    
    // Get recommended glasses shape for the face shape
    const recommendedShape = getRecommendedGlassesShape(result.faceShape)
    const faceShapeDescription = faceShapeDescriptions[result.faceShape] || 'شكل وجهك'

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `face-shape-result`,
        type: 'bot',
        content: `تم تحليل وجهك بنجاح! ${faceShapeDescription} (دقة: ${result.confidence}%)`,
        timestamp: new Date(),
        faceShapeData
      }])
    }, 1000)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `face-shape-recommendations`,
        type: 'bot',
        content: `بناءً على شكل وجهك، أنصحك بالنظارات ذات الشكل: ${recommendedShape}`,
        timestamp: new Date()
      }])
    }, 2000)

    // Fetch recommended products
    setIsLoadingProducts(true)
    try {
      const maxScore = Math.max(...Object.values(scores))
      const resultCategory = Object.keys(scores).find(category => scores[category] === maxScore) || 'medical'
      
      const productResult = await getProductsByFaceShape({
        faceShape: result.faceShape,
        category: resultCategory,
        limit: 6
      })

      if (productResult.success && productResult.products.length > 0) {
        setRecommendedProducts(productResult.products)
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'recommended-products',
            type: 'bot',
            content: `إليك النظارات المناسبة لشكل وجهك واحتياجاتك:`,
            timestamp: new Date(),
            products: productResult.products,
            faceShape: result.faceShape,
            recommendedShape: productResult.recommendedShape,
            category: resultCategory
          }])
        }, 3000)
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: 'no-products-found',
            type: 'bot',
            content: `عذراً، لم نتمكن من العثور على منتجات مطابقة لشكل وجهك في هذه الفئة. يمكنك تصفح جميع المنتجات المتاحة.`,
            timestamp: new Date(),
            options: [
              {
                id: 'view-all-products',
                text: 'عرض جميع المنتجات',
                icon: <ArrowRight className="w-4 h-4" />,
                score: {}
              }
            ]
          }])
        }, 3000)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: 'error-loading-products',
          type: 'bot',
          content: `حدث خطأ في تحميل المنتجات. يمكنك تصفح جميع المنتجات المتاحة.`,
          timestamp: new Date(),
          options: [
            {
              id: 'view-all-products',
              text: 'عرض جميع المنتجات',
              icon: <ArrowRight className="w-4 h-4" />,
              score: {}
            }
          ]
        }])
      }, 3000)
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleFaceShapeError = (error: string) => {
    toast({
      variant: 'destructive',
      description: `خطأ في تحليل الوجه: ${error}`,
    })
    
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `face-shape-error`,
        type: 'bot',
        content: 'عذراً، حدث خطأ في تحليل الصورة. دعني أعطيك التوصيات العامة بناءً على إجاباتك.',
        timestamp: new Date()
      }])
    }, 1000)

    setTimeout(() => {
      showFinalResults()
    }, 2000)
  }

  const getGlassesRecommendations = (glassesShape: string): string[] => {
    const recommendations: { [key: string]: string[] } = {
      'Oval': [
        'النظارات البيضاوية تناسب معظم أشكال الوجوه',
        'تعطي مظهراً أنيقاً ومتوازناً',
        'مناسبة للاستخدام اليومي والعمل',
        'خيار آمن ومناسب لجميع المناسبات'
      ],
      'Round': [
        'النظارات الدائرية تضيف لمسة عصرية',
        'تناسب الوجوه المربعة والمستطيلة',
        'تعطي مظهراً ودوداً ومرحاً',
        'مثالية للشخصيات الإبداعية'
      ],
      'Square': [
        'النظارات المربعة تعطي مظهراً قوياً',
        'تناسب الوجوه الدائرية والبيضاوية',
        'تضيف حدة وأناقة للوجه',
        'مناسبة للشخصيات المهنية'
      ],
      'Rectangle': [
        'النظارات المستطيلة تعطي مظهراً كلاسيكياً',
        'تناسب الوجوه الدائرية والبيضاوية',
        'تضيف طولاً للوجه',
        'مناسبة للاستخدام الرسمي'
      ],
      'Heart': [
        'النظارات القلبية تعطي مظهراً رومانسياً',
        'تناسب الوجوه المربعة والمستطيلة',
        'تضيف أنوثة وجاذبية',
        'مثالية للمناسبات الخاصة'
      ],
      'Diamond': [
        'النظارات الماسية تعطي مظهراً فاخراً',
        'تناسب الوجوه الدائرية والبيضاوية',
        'تضيف بريقاً وأناقة',
        'مثالية للشخصيات الجريئة'
      ],
      'Cat-Eye': [
        'نظارات عين القطة تعطي مظهراً أنثوياً',
        'تناسب معظم أشكال الوجوه',
        'تضيف لمسة عصرية وجذابة',
        'مثالية للشخصيات الواثقة'
      ],
      'Aviator': [
        'نظارات الطيار تعطي مظهراً رياضياً',
        'تناسب الوجوه المربعة والمستطيلة',
        'تضيف أناقة وثقة',
        'مثالية للشخصيات المغامرة'
      ],
      'Wayfarer': [
        'نظارات وايفارير تعطي مظهراً كلاسيكياً',
        'تناسب معظم أشكال الوجوه',
        'تضيف أناقة خالدة',
        'مناسبة لجميع الأعمار'
      ],
      'Browline': [
        'نظارات برولاين تعطي مظهراً ذكياً',
        'تناسب الوجوه الدائرية والبيضاوية',
        'تضيف حكمة وأناقة',
        'مثالية للشخصيات الأكاديمية'
      ],
      'Rimless': [
        'النظارات بدون إطار تعطي مظهراً نظيفاً',
        'تناسب جميع أشكال الوجوه',
        'تضيف أناقة بسيطة',
        'مثالية للشخصيات المحافظة'
      ],
      'Semi-Rimless': [
        'النظارات نصف الإطار تعطي مظهراً متوازناً',
        'تناسب جميع أشكال الوجوه',
        'تضيف أناقة مع الحفاظ على البساطة',
        'مناسبة للاستخدام اليومي'
      ]
    }
    
    return recommendations[glassesShape] || [
      'هذا الشكل من النظارات مناسب لوجهك',
      'جرب أشكال مختلفة لترى ما يناسبك',
      'استشر أخصائي النظارات للحصول على نصيحة شخصية'
    ]
  }

  const getRecommendedGlassesShapes = (glassesShape: string): string[] => {
    // Since we're now returning glasses shapes directly, we just return the detected shape
    return [glassesShape]
  }

  const showFinalResults = () => {
    const maxScore = Math.max(...Object.values(scores))
    const resultCategory = Object.keys(scores).find(category => scores[category] === maxScore) || 'medical'
    const result = chatResults[resultCategory]

    // Build URL with face shape filter if available
    let productUrl = result.url
    if (faceShapeResult) {
      const recommendedShapes = getRecommendedGlassesShapes(faceShapeResult.faceShape)
      const shapeParams = recommendedShapes.map(shape => `glassesShape=${encodeURIComponent(shape)}`).join('&')
      productUrl = `${result.url}&${shapeParams}`
    }

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'final-result',
        type: 'bot',
        content: faceShapeResult 
          ? `بناءً على تحليل وجهك (شكل ${faceShapeResult.faceShape}) واحتياجاتك، سأرشدك إلى النظارات المناسبة لك!`
          : 'هل تريد أن أرشدك إلى المنتجات المقترحة؟',
        timestamp: new Date(),
        options: [
          {
            id: 'view-products',
            text: 'نعم، أريد رؤية المنتجات',
            icon: <ArrowRight className="w-4 h-4" />,
            score: {}
          },
          {
            id: 'restart',
            text: 'أريد إعادة الاختبار',
            icon: <MessageCircle className="w-4 h-4" />,
            score: {}
          }
        ]
      }])
    }, 1000)

    // Store the URL for later use
    setMessages(prev => [...prev, {
      id: 'product-url',
      type: 'bot',
      content: productUrl,
      timestamp: new Date()
    }])
  }

  const resetChat = () => {
    setMessages([])
    setCurrentQuestion(0)
    setScores({
      computer: 0,
      reading: 0,
      sunglasses: 0,
      medical: 0,
      contact: 0,
      care: 0
    })
    setIsComplete(false)
    setShowFaceShape(false)
    setUploadedImage(null)
    setFaceShapeResult(null)
    startChat()
  }

  const closeChat = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Chat Button - Desktop Only */}
      {!isOpen && (
        <div
          data-chat-trigger
          onClick={startChat}
          className={`hidden sm:flex fixed bottom-6 left-6 z-50 h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer items-start justify-start overflow-hidden ${
            !hasBeenOpened ? 'animate-pulse' : ''
          }`}
        >
          <img 
            src="/icons/glasses-shades-on.gif" 
            alt="Chat Assistant" 
            className="w-full h-full object-contain transform scale-100 translate-x-[-4px] translate-y-[-4px]"
          />
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 sm:bottom-6 sm:left-6 sm:right-auto sm:top-auto sm:inset-auto z-50 w-full sm:w-[32rem] h-full sm:h-[36rem] bg-white sm:rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="bg-primary text-white p-4 sm:rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold">مساعد اختيار النظارات</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeChat}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.type === 'bot' && (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{message.content}</p>
                      
                      {/* Face Shape Detection UI */}
                      {showFaceShape && message.id === 'face-shape-instructions' && (
                        <div className="mt-4 space-y-3">
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {!uploadedImage ? (
                              <div className="space-y-2">
                                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                <p className="text-xs text-gray-600">ارفع صورة واضحة لوجهك</p>
                                <UploadButton
                                  endpoint="imageUploader"
                                  onClientUploadComplete={(res) => {
                                    if (res && res[0]?.url) {
                                      setUploadedImage(res[0].url)
                                      toast({
                                        description: 'تم رفع الصورة بنجاح! اضغط على "تحليل شكل الوجه" للبدء',
                                      })
                                    }
                                  }}
                                  onUploadError={(error: Error) => {
                                    toast({
                                      variant: 'destructive',
                                      description: `خطأ في رفع الصورة: ${error.message}`,
                                    })
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <img
                                  src={uploadedImage}
                                  alt="Face for analysis"
                                  className="w-20 h-20 object-cover rounded-lg mx-auto"
                                />
                                <p className="text-xs text-green-600">تم رفع الصورة بنجاح</p>
                                <Button
                                  size="sm"
                                  onClick={() => setUploadedImage(null)}
                                  className="text-xs"
                                >
                                  تغيير الصورة
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {uploadedImage && (
                            <FaceShapeDetector
                              imageUrl={uploadedImage}
                              onResult={handleFaceShapeResult}
                              onError={handleFaceShapeError}
                              onDetect={() => {
                                setMessages(prev => [...prev, {
                                  id: `user-analyzing-${Date.now()}`,
                                  type: 'user',
                                  content: 'جاري تحليل شكل الوجه...',
                                  timestamp: new Date()
                                }])
                              }}
                            />
                          )}
                        </div>
                      )}
                      
                      {/* Face Shape Results Display */}
                      {message.faceShapeData && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Camera className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              تحليل شكل الوجه
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-blue-700">
                            <p><strong>الشكل:</strong> {message.faceShapeData.faceShape}</p>
                            <p><strong>الدقة:</strong> {message.faceShapeData.confidence}%</p>
                          </div>
                        </div>
                      )}

                      {/* Product Display */}
                      {message.products && (
                        <div className="mt-4">
                          <ProductDisplay
                            products={message.products}
                            faceShape={message.faceShape}
                            recommendedShape={message.recommendedShape}
                            category={message.category}
                          />
                        </div>
                      )}

                      {/* Loading Products */}
                      {isLoadingProducts && message.id === 'recommended-products' && (
                        <div className="mt-4 flex items-center justify-center py-8">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600 font-cairo">جاري تحميل المنتجات المقترحة...</p>
                          </div>
                        </div>
                      )}
                      
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option) => (
                            <Button
                              key={option.id}
                              variant={message.type === 'bot' ? 'outline' : 'secondary'}
                              size="sm"
                              className="w-full justify-start text-xs h-auto p-2"
                              onClick={() => {
                                if (isComplete) {
                                  handleResultAction(option)
                                } else {
                                  handleOptionSelect(option)
                                }
                              }}
                            >
                              <span className="ml-2">{option.icon}</span>
                              {option.text}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50 sm:rounded-b-lg">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>متصل الآن</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
