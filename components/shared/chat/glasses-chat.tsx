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
  User
} from 'lucide-react'
import Link from 'next/link'

interface ChatMessage {
  id: string
  type: 'bot' | 'user'
  content: string
  timestamp: Date
  options?: ChatOption[]
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

export default function GlassesChat() {
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
        content: 'مرحباً! أنا مساعدك الذكي لاختيار النظارات المناسبة. سأساعدك في العثور على أفضل النظارات بناءً على احتياجاتك. دعنا نبدأ!',
        timestamp: new Date()
      }
    ])
    askQuestion(0)
  }

  const askQuestion = (questionIndex: number) => {
    if (questionIndex >= chatQuestions.length) {
      showResult()
      return
    }

    const question = chatQuestions[questionIndex]
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `question-${questionIndex}`,
        type: 'bot',
        content: question.question,
        timestamp: new Date(),
        options: question.options
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
    const result = chatResults[resultCategory]

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

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 'result-action',
        type: 'bot',
        content: 'هل تريد أن أرشدك إلى المنتجات المقترحة؟',
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
    }, 3000)

    setIsComplete(true)
  }

  const handleResultAction = (option: ChatOption) => {
    if (option.id === 'view-products') {
      const maxScore = Math.max(...Object.values(scores))
      const resultCategory = Object.keys(scores).find(category => scores[category] === maxScore) || 'medical'
      const result = chatResults[resultCategory]
      
      // Open the products page in a new tab
      window.open(result.url, '_blank')
      
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
          content: 'ممتاز! لقد فتحت صفحة المنتجات المقترحة لك. إذا كنت بحاجة إلى مساعدة أخرى، لا تتردد في سؤالي!',
          timestamp: new Date()
        }])
      }, 500)
    } else if (option.id === 'restart') {
      resetChat()
    }
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
    startChat()
  }

  const closeChat = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={startChat}
          className={`fixed bottom-24 left-4 sm:bottom-6 sm:left-6 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 ${
            !hasBeenOpened ? 'animate-pulse' : ''
          }`}
          size="lg"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 left-2 right-2 sm:bottom-6 sm:left-6 sm:right-auto z-50 w-auto sm:w-80 h-80 sm:h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="bg-primary text-white p-4 rounded-t-lg flex items-center justify-between">
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
          <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
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
