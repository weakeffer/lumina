import React, { useMemo } from 'react';
import { X, Calendar, Tag } from 'lucide-react';
import { useTheme } from '../../../shared/context/ThemeContext';
import {
  StatGradientCard,
  ActivityBarRow,
  PopularTagsRanked,
} from '../../../shared/components/stats';
import {
  getActivityCountsByWeekday,
  getPopularTagsFromNotes,
  computeWritingMetricsFromNotes,
} from '../../../shared/lib/stats/fromNotes';

/**
 * Боковая панель статистики по заметкам.
 * @param {function(string): void} [onTagClick] — если задан, блок тегов как кликабельные чипы (как в StatisticsPanel)
 * @param {boolean} [showExtendedDetails] — символы, средняя длина, дата последнего редактирования
 */
const MiniStatistics = ({
  notes,
  tags,
  favorites,
  deletedCount,
  onClose,
  onTagClick,
  showExtendedDetails = false,
}) => {
  const { themeClasses } = useTheme();

  const activityItems = useMemo(() => getActivityCountsByWeekday(notes), [notes]);
  const rankedTags = useMemo(() => getPopularTagsFromNotes(notes, 5), [notes]);
  const writing = useMemo(() => computeWritingMetricsFromNotes(notes), [notes]);

  const borderColor = themeClasses.colors.border?.primary ?? 'border-gray-200 dark:border-gray-700';
  const bgColor = themeClasses.colors.bg?.primary ?? 'bg-white dark:bg-gray-900';

  return (
    <div className={`w-80 border-l ${borderColor} ${bgColor} overflow-y-auto custom-scrollbar`}>
      <div className={`p-4 border-b ${borderColor} sticky top-0 bg-inherit backdrop-blur-sm bg-opacity-90`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold ${themeClasses.colors.text.primary}`}>Статистика</h2>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg transition-all hover:scale-110 ${themeClasses.colors.bg.hover}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <StatGradientCard value={notes.length} label="Заметок" gradient="from-blue-500 to-cyan-500" />
          <StatGradientCard value={favorites.length} label="Избранных" gradient="from-yellow-500 to-orange-500" />
          <StatGradientCard value={tags.length} label="Тегов" gradient="from-green-500 to-emerald-500" />
          <StatGradientCard value={deletedCount} label="В корзине" gradient="from-red-500 to-pink-500" />
        </div>

        <div className="space-y-3">
          <h3 className={`text-sm font-medium flex items-center gap-2 ${themeClasses.colors.text.primary}`}>
            <Calendar className="w-4 h-4" />
            Активность по дням
          </h3>
          <ActivityBarRow
            items={activityItems}
            density="compact"
            showTooltips={false}
            themeClasses={themeClasses}
            narrowBars={false}
          />
        </div>

        {onTagClick && tags?.length > 0 ? (
          <div className="space-y-3">
            <h3 className={`text-sm font-medium flex items-center gap-2 ${themeClasses.colors.text.primary}`}>
              <Tag className="w-4 h-4" />
              Теги
            </h3>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {tags.slice(0, 8).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick(tag)}
                  className={`px-2 py-1 text-xs rounded-lg ${themeClasses.colors.bg.tertiary} hover:opacity-90 transition-colors`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        ) : rankedTags.length > 0 ? (
          <div className="space-y-3">
            <h3 className={`text-sm font-medium flex items-center gap-2 ${themeClasses.colors.text.primary}`}>
              <Tag className="w-4 h-4" />
              Популярные теги
            </h3>
            <PopularTagsRanked rankedTags={rankedTags} />
          </div>
        ) : null}

        {showExtendedDetails && (
          <div className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${themeClasses.colors.bg.secondary}`}>
            <h3 className={`text-xs font-medium ${themeClasses.colors.text.tertiary} mb-3`}>Детали</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className={themeClasses.colors.text.tertiary}>Всего символов</span>
                <span className={themeClasses.colors.text.primary}>{writing.totalChars.toLocaleString('ru-RU')}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className={themeClasses.colors.text.tertiary}>Слов в среднем</span>
                <span className={themeClasses.colors.text.primary}>{writing.avgWordsPerNote}</span>
              </div>
              {writing.lastEdited && writing.lastEdited.getTime() > 0 && (
                <div className="flex justify-between gap-2">
                  <span className={themeClasses.colors.text.tertiary}>Последнее</span>
                  <span className={themeClasses.colors.text.primary}>
                    {writing.lastEdited.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`p-3 rounded-lg ${themeClasses.colors.bg.secondary}`}>
          <h3 className={`text-sm font-medium mb-2 ${themeClasses.colors.text.primary}`}>Хранилище</h3>
          <div className={`space-y-1 text-sm ${themeClasses.colors.text.secondary}`}>
            <div className="flex justify-between">
              <span className={themeClasses.colors.text.tertiary}>Всего заметок:</span>
              <span className="font-medium">{notes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className={themeClasses.colors.text.tertiary}>С тегами:</span>
              <span className="font-medium">{notes.filter((n) => n.tags?.length > 0).length}</span>
            </div>
            <div className="flex justify-between">
              <span className={themeClasses.colors.text.tertiary}>В избранном:</span>
              <span className="font-medium">{favorites.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniStatistics;
export { MiniStatistics };
