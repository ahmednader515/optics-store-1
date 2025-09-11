'use client'

import { useState, useEffect } from 'react'

export default function MobileChatButton() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleChatClick = () => {
    const chatButton = document.querySelector('[data-chat-trigger]') as HTMLElement;
    if (chatButton) {
      chatButton.click();
    }
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative -mt-2">
          <div className="w-16 h-16 rounded-full bg-primary shadow-2xl flex items-center justify-center overflow-hidden border-4 border-white">
            <div className="w-10 h-10 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
        <span className="text-xs text-gray-600">المساعد</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative -mt-2">
        <div
          onClick={handleChatClick}
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer flex items-center justify-center overflow-hidden border-4 border-white"
        >
          <img 
            src="/icons/glasses-shades-on.gif" 
            alt="Chat Assistant" 
            className="w-full h-full object-contain transform scale-100 translate-x-[-4px] translate-y-[-4px]"
          />
        </div>
      </div>
      <span className="text-xs text-gray-600">المساعد</span>
    </div>
  )
}
