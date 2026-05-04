import React from 'react';

/**
 * Крупная градиентная карточка (вкладка статистики профиля).
 */
export function HeroStatCard({ gradientClass, label, value, icon: Icon, footer, footerClassName = 'text-white/90' }) {
  return (
    <div className={`p-6 rounded-xl bg-linear-to-br ${gradientClass} text-white`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/80 text-sm">{label}</p>
          <p className="text-4xl font-bold mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 bg-white/20 rounded-xl">
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {footer != null && footer !== '' && (
        <div className={`flex items-center text-sm ${footerClassName}`}>{footer}</div>
      )}
    </div>
  );
}
