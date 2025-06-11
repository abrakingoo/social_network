'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback
} from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";

const ToastContext = createContext({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ title, description, action, ...props }) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prevToasts) => [
      ...prevToasts,
      { id, title, description, action, ...props },
    ]);
    return id;
  }, []);

  const dismiss = useCallback((toastId) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
  }, []);

  return (
    <ToastPrimitives.Provider>
      <ToastContext.Provider value={{ toasts, toast, dismiss }}>
        {children}
      </ToastContext.Provider>
    </ToastPrimitives.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
