import React from 'react';

/**
 * Вертикальные столбцы активности по меткам (дни недели или даты).
 * @param {{ label: string, count: number, key?: string }[]} items
 * @param {'compact'|'comfortable'} density — максимальная высота столбца (px)
 * @param {boolean} showTooltips — «N заметок» при наведении
 * @param {boolean} narrowBars — узкий столбец как во вкладке профиля (w-8)
 */
export function ActivityBarRow({
  items,
  density = 'compact',
  showTooltips = false,
  themeClasses,
  barClassName = 'bg-indigo-500',
  narrowBars = false,
}) {
  const maxCount = Math.max(...items.map((i) => i.count), 1);
  const barMaxPx = density === 'comfortable' ? 80 : 56;
  const barWrapClass = narrowBars ? 'w-8 flex justify-center' : 'w-full flex justify-center';

  return (
    <div
      className={`flex items-end justify-between gap-1 ${narrowBars ? '' : 'gap-0.5'}`}
      style={{ minHeight: barMaxPx + 28 }}
    >
      {items.map((day) => {
        const h = Math.max(4, (day.count / maxCount) * barMaxPx);
        return (
          <div key={day.key ?? day.label} className="flex flex-col items-center flex-1 min-w-0">
            <div className={`relative mb-2 ${showTooltips ? 'group' : ''} ${barWrapClass}`}>
              <div
                className={`${narrowBars ? 'w-8' : 'w-full'} ${barClassName} rounded-t-lg transition-all duration-300 hover:opacity-90 relative`}
                style={{
                  height: `${h}px`,
                  minHeight: day.count > 0 ? '6px' : '4px',
                }}
              >
                {showTooltips && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {day.count} заметок
                  </div>
                )}
              </div>
            </div>
            <span className={`text-xs truncate w-full text-center ${themeClasses.colors.text.tertiary}`}>
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
