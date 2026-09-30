import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'warning' | 'info';
}

interface ToastContextType {
  showToast: (title: string, message?: string, type?: 'success' | 'warning' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, message?: string, type: 'success' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#FAF7F0] border-2 border-[#8B5E3C] shadow-md p-3 flex items-start gap-3 transition-all duration-200"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#5C6E41]" />}
              {toast.type === 'warning' && <AlertCircle className="w-4 h-4 text-[#B34F3F]" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-[#8B5E3C]" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#332E27]">
                {toast.title}
              </div>
              {toast.message && (
                <div className="text-xs text-[#6B6256] mt-0.5 leading-relaxed">
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#9C8F7C] hover:text-[#332E27] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
