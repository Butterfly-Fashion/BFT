"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm rounded-full px-4 py-2 shadow-lg pointer-events-none transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}
