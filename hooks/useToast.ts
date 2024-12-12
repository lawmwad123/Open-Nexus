import { useContext } from 'react';
import { ToastContext, ToastContextType } from '@/contexts/ToastContext';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'center';
}

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export const showToast = {
  show: (message: string, type?: 'success' | 'error' | 'info', options?: ToastOptions) => {
    const context = useToast();
    context.show(message, type, options);
  },
  hide: () => {
    const context = useToast();
    context.hide();
  }
}; 