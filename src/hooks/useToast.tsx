import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

interface ToastContextValue {
  show: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 1800)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] rounded-full bg-ink dark:bg-white text-white dark:text-ink px-5 py-2.5 text-sm font-semibold whitespace-nowrap shadow-lg transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        {message}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast ToastProvider ichida ishlatilishi kerak')
  return ctx
}
