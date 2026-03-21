import React from 'react';
import { 
  FileText, BookOpen, TrendingUp, Activity, 
  Target, Layers, Award, Clock 
} from 'lucide-react';

const StatsTab = ({
  user,
  userStats,
  activityData,
  themeClasses
}) => {
  // Для отладки
  console.log('StatsTab received activityData:', activityData);
  console.log('StatsTab received userStats:', userStats);

  // Находим максимальное значение для масштабирования графика
  const maxCount = Math.max(...(activityData.map(day => day.count) || [0]), 1);

  return (
    <div className="space-y-6">
      {/* Основные метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-6 rounded-xl bg-linear-to-br from-indigo-500 to-indigo-600 text-white`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-indigo-100 text-sm">Всего заметок</p>
              <p className="text-4xl font-bold mt-1">{user?.total_notes || 0}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-indigo-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>
              {user?.total_notes > 0 
                ? `+${Math.round(user.total_notes / 30 * 100) / 100} в день` 
                : 'Нет активности'}
            </span>
          </div>
        </div>

        <div className={`p-6 rounded-xl bg-linear-to-br from-purple-500 to-purple-600 text-white`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm">Всего слов</p>
              <p className="text-4xl font-bold mt-1">{user?.total_words || 0}</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center text-purple-100 text-sm">
            <Activity className="w-4 h-4 mr-1" />
            <span>Средняя длина: {user?.total_notes ? Math.round(user.total_words / user.total_notes) : 0} слов</span>
          </div>
        </div>
      </div>

      {/* Детальная статистика */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
          <Target className="w-6 h-6 mx-auto mb-2 text-green-500" />
          <p className={`text-2xl font-bold ${themeClasses.colors.text.primary}`}>
            {userStats?.streak || 0}
          </p>
          <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Дней подряд</p>
        </div>
        <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
          <Layers className="w-6 h-6 mx-auto mb-2 text-blue-500" />
          <p className={`text-2xl font-bold ${themeClasses.colors.text.primary}`}>
            {userStats?.totalTags || 0}
          </p>
          <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Тегов</p>
        </div>
        <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary} text-center`}>
          <Award className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
          <p className={`text-2xl font-bold ${themeClasses.colors.text.primary}`}>
            {userStats?.achievements || 0}
          </p>
          <p className={`text-xs ${themeClasses.colors.text.tertiary}`}>Достижения</p>
        </div>
      </div>

      {/* График активности - всегда показываем, даже если нет данных */}
      <div>
        <h3 className={`text-lg font-semibold ${themeClasses.colors.text.primary} mb-4 flex items-center`}>
          <Activity className="w-5 h-5 mr-2 text-indigo-500" />
          Активность за неделю
        </h3>
        <div className={`p-6 rounded-xl ${themeClasses.colors.bg.secondary}`}>
          {activityData && activityData.length > 0 ? (
            <>
              <div className="flex items-end justify-between h-32">
                {activityData.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center w-1/7">
                    <div className="relative w-full flex justify-center mb-2 group">
                      <div 
                        className="w-8 bg-indigo-500 rounded-t-lg transition-all duration-500 hover:bg-indigo-600 cursor-pointer relative"
                        style={{ 
                          height: `${Math.max(4, (day.count / maxCount) * 80)}px`,
                          minHeight: day.count > 0 ? '8px' : '4px'
                        }}
                      >
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                          px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 
                          group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {day.count} заметок
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs ${themeClasses.colors.text.tertiary}`}>{day.date}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between mt-4 text-xs text-gray-400">
                <span>Пн</span>
                <span>Вт</span>
                <span>Ср</span>
                <span>Чт</span>
                <span>Пт</span>
                <span>Сб</span>
                <span>Вс</span>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Activity className={`w-12 h-12 mx-auto mb-3 ${themeClasses.colors.text.tertiary}`} />
              <p className={`${themeClasses.colors.text.secondary}`}>
                Нет данных об активности
              </p>
              <p className={`text-sm ${themeClasses.colors.text.tertiary} mt-1`}>
                Создайте заметки, чтобы увидеть график активности
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Общая статистика */}
      <div className={`p-4 rounded-xl ${themeClasses.colors.bg.secondary}`}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Всего символов</p>
            <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
              {(user?.total_words || 0) * 5}
            </p>
          </div>
          <div>
            <p className={`text-sm ${themeClasses.colors.text.tertiary}`}>Средняя длина</p>
            <p className={`text-xl font-bold ${themeClasses.colors.text.primary}`}>
              {user?.total_notes ? Math.round(user.total_words / user.total_notes) : 0} слов
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;