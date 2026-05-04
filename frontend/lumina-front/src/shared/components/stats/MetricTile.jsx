import React from 'react';

/**
 * Компактная плитка: иконка, число, подпись (профиль, дашборды).
 */
export function MetricTile({
  icon: Icon,
  value,
  label,
  themeClasses,
  iconClassName,
  compact = true,
  iconSizeClass,
}) {
  const pad = compact ? 'p-3' : 'p-4';
  const iconCls = iconSizeClass ?? (compact ? 'w-5 h-5 mb-1' : 'w-6 h-6 mb-2');
  return (
    <div className={`${pad} rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
      {Icon && (
        <Icon className={`${iconCls} mx-auto ${iconClassName ?? themeClasses.colors.text.tertiary}`} />
      )}
      <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>{value}</p>
      <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>{label}</p>
    </div>
  );
}
