import React from 'react';

const ActionButton = ({ icon: Icon, onClick, tooltip, active, badge, badgeColor = "red", className = "" }) => {
  const badgeColors = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500'
  };

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
        active 
          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      } ${className}`}
      title={tooltip}
    >
      <Icon className="w-5 h-5" />
      {badge !== null && badge !== undefined && badge > 0 && (
        <span className={`absolute -top-1 -right-1 min-w-5 h-5 px-1 ${badgeColors[badgeColor] || badgeColors.red} text-white text-xs rounded-full flex items-center justify-center animate-bounce-subtle`}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
};

export default ActionButton;