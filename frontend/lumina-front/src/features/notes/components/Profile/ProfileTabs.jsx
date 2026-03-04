import React from 'react';
import { User, TrendingUp, Settings } from 'lucide-react';

const ProfileTabs = ({ activeTab, onTabChange, themeClasses }) => {
  const tabs = [
    { id: 'profile', icon: User, label: 'Профиль' },
    { id: 'stats', icon: TrendingUp, label: 'Статистика' },
    { id: 'settings', icon: Settings, label: 'Настройки' }
  ];

  return (
    <div className={`flex space-x-1 p-1 rounded-2xl ${themeClasses.colors.bg.secondary} 
      border ${themeClasses.colors.border.primary} backdrop-blur-sm mb-6`}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 
              rounded-xl transition-all duration-300
              ${activeTab === tab.id 
                ? `${themeClasses.colors.accent.primary} text-white shadow-lg` 
                : `${themeClasses.colors.text.secondary} hover:${themeClasses.colors.bg.tertiary}`
              }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProfileTabs;