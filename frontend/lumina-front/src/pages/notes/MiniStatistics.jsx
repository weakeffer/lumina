import React from 'react';
import { X, Calendar, Tag, Star, Trash2 } from 'lucide-react';
import { useTheme } from './ThemeContext';

const MiniStatistics = ({ notes, tags, favorites, deletedCount, onClose }) => {
  let borderColor = 'border-gray-200 dark:border-gray-700';
  let bgColor = 'bg-white dark:bg-gray-900';
  
  try {
    const theme = useTheme();
    if (theme && theme.themeClasses && theme.themeClasses.colors) {
      const colors = theme.themeClasses.colors;
      borderColor = colors.border?.primary || borderColor;
      bgColor = colors.background?.primary || bgColor;
    }
  } catch (e) {
    console.warn('ThemeContext not available in MiniStatistics');
  }

  const getActivityData = () => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const activity = new Array(7).fill(0);
    
    notes.forEach(note => {
      const day = new Date(note.created_at).getDay();
      activity[day]++;
    });
    
    return days.map((day, index) => ({
      day,
      count: activity[index]
    }));
  };

  const getPopularTags = () => {
    const tagCount = {};
    notes.forEach(note => {
      note.tags?.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  const activityData = getActivityData();
  const popularTags = getPopularTags();
  const maxActivity = Math.max(...activityData.map(d => d.count), 1);

  return (
    <div className={`w-80 border-l ${borderColor} ${bgColor} overflow-y-auto custom-scrollbar`}>
      <div className={`p-4 border-b ${borderColor} sticky top-0 bg-inherit backdrop-blur-sm bg-opacity-90`}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Статистика</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <StatGradientCard
            value={notes.length}
            label="Заметок"
            gradient="from-blue-500 to-cyan-500"
          />
          <StatGradientCard
            value={favorites.length}
            label="Избранных"
            gradient="from-yellow-500 to-orange-500"
          />
          <StatGradientCard
            value={tags.length}
            label="Тегов"
            gradient="from-green-500 to-emerald-500"
          />
          <StatGradientCard
            value={deletedCount}
            label="В корзине"
            gradient="from-red-500 to-pink-500"
          />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Активность по дням
          </h3>
          <div className="flex justify-between items-end h-20 gap-1">
            {activityData.map(({ day, count }) => (
              <div key={day} className="flex flex-col items-center gap-1 flex-1">
                <div 
                  className="w-full bg-indigo-500/20 rounded-t hover:bg-indigo-500/30 transition-all"
                  style={{ height: `${(count / maxActivity) * 100}%`, minHeight: '4px' }}
                >
                  <div 
                    className="w-full bg-indigo-500 rounded-t transition-all"
                    style={{ height: `${Math.max(20, (count / maxActivity) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{day}</span>
              </div>
            ))}
          </div>
        </div>
        {popularTags.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Популярные теги
            </h3>
            <div className="space-y-2">
              {popularTags.map(([tag, count]) => (
                <div key={tag} className="flex items-center gap-2">
                  <span className="text-sm flex-1 truncate">#{tag}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(count / Math.max(...popularTags.map(([, c]) => c))) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Хранилище</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Всего заметок:</span>
              <span className="font-medium">{notes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">С тегами:</span>
              <span className="font-medium">{notes.filter(n => n.tags?.length > 0).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">В избранном:</span>
              <span className="font-medium">{favorites.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatGradientCard = ({ value, label, gradient }) => (
  <div className={`p-3 rounded-xl bg-linear-to-br ${gradient} text-white shadow-lg transform hover:scale-105 transition-all cursor-default`}>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs opacity-90">{label}</div>
  </div>
);

export default MiniStatistics;