'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast, useToast } from './use-toast';

export function ToastProvider() {
  const { toastState } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (toastState.open) {
      setIsVisible(true);
    } else {
      setTimeout(() => setIsVisible(false), 300); // Give time for animation
    }
  }, [toastState.open]);

  if (!isVisible && !toastState.open) return null;

  const { title, description, variant = 'default' } = toastState.data || {};

  const variantClasses = {
    default: 'bg-white border-gray-200',
    destructive: 'bg-red-50 border-red-300 text-red-900',
    success: 'bg-green-50 border-green-300 text-green-900',
  };

  return (
    <div className="toast-container fixed top-4 right-4 z-50 max-w-md">
      <div
        className={`
          ${toastState.open ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}
          transform transition-all duration-300 ease-in-out
          ${variantClasses[variant]}
          p-4 rounded-md shadow-lg border
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {title && <h3 className="font-medium mb-1">{title}</h3>}
            {description && <p className="text-sm text-gray-600">{description}</p>}
          </div>
          <button
            onClick={() => toast({ ...toastState.data!, open: false })}
            className="h-5 w-5 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
