import React from 'react';
import { LayoutGrid, List, Menu, Sidebar } from 'lucide-react';
import { VIEW_MODES } from '../../profile/constants';

const ViewModeToggle = ({ viewMode, onChange, className = '' }) => {
  const modes = [
    { key: VIEW_MODES.SIDEBAR, icon: Sidebar, label: 'Сайдбар' },
    { key: VIEW_MODES.GRID, icon: LayoutGrid, label: 'Сетка' },
    { key: VIEW_MODES.LIST, icon: List, label: 'Список' },
    { key: VIEW_MODES.COMPACT, icon: Menu, label: 'Компактный' }
  ];

  return (
    <div className={`flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ${className}`}>
      {modes.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`p-2 rounded-md transition-colors group relative ${
            viewMode === key 
              ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
          {/* Всплывающая подсказка для мобильных */}
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 
            text-xs bg-gray-900 text-white px-2 py-1 rounded opacity-0 
            group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none
            hidden sm:block">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ViewModeToggle;