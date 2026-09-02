import React, { createContext, useState, useContext } from 'react';

const ToastContext = createContext();

const toastStyles = {
  success: {
    className: 'toast success',
    icon: '✓'
  },
  error: {
    className: 'toast error',
    icon: '!'
  },
  info: {
    className: 'toast info',
    icon: 'i'
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    const toastType = toastStyles[type] ? type : 'info';
    setToasts((prev) => [...prev, { id, message, type: toastType }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => {
          const style = toastStyles[t.type] || toastStyles.info;
          return (
            <div key={t.id} className={style.className} role="status">
              <span className="toast-icon">{style.icon}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
