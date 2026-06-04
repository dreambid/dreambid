'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const typeClass: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

const typeIcon: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
};

/* 토스트 알림 컴포넌트 — 성공/에러/정보 */
export function Toast({ message, type = 'info', isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={cn('flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg', typeClass[type])}>
        <span>{typeIcon[type]}</span>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">
          ✕
        </button>
      </div>
    </div>
  );
}
