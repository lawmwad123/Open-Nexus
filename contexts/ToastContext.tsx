import React, { createContext, useContext, useState, useCallback } from 'react';
import { Animated } from 'react-native';
import Toast from '@/components/Toast/Toast';

export interface ToastContextType {
  show: (message: string, type?: 'success' | 'error' | 'info') => void;
  hide: () => void;
}

export const ToastContext = createContext<ToastContextType>({
  show: () => {},
  hide: () => {},
});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn('useToast must be used within a ToastProvider');
    return {
      show: () => {},
      hide: () => {},
    };
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('info');
  const [visible, setVisible] = useState(false);
  const fadeAnim = new Animated.Value(0);

  const hide = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
    });
  }, []);

  const show = useCallback((msg: string, toastType: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    fadeAnim.setValue(0);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    setTimeout(hide, 3000);
  }, [hide]);

  const contextValue = React.useMemo(() => ({
    show,
    hide
  }), [show, hide]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {visible && (
        <Toast
          message={message}
          type={type}
          onClose={hide}
          fadeAnim={fadeAnim}
        />
      )}
    </ToastContext.Provider>
  );
}; 