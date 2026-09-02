import React, { createContext, useState, useContext } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', top: '18px', right: '18px', zIndex: 2000, display: 'grid', gap: '10px' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              minWidth: '220px',
              maxWidth: '320px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: t.type === 'error' ? '#9c2b1a' : '#2f6b4f',
              color: '#fff',
              borderLeft: '4px solid rgba(255,255,255,0.8)',
              boxShadow: '0 12px 30px rgba(25, 18, 13, 0.18)',
              fontWeight: 600
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
