import React, { useEffect } from 'react';

const Notification = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[notification.type] || 'bg-blue-500';

  return (
    <div className={`fixed top-4 right-4 z-50 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg animate-slideIn`}>
      {notification.message}
    </div>
  );
};

export default Notification;