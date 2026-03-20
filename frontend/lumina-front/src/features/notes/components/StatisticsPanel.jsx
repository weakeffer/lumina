import React from 'react';
import { X, FileText, Calendar, TrendingUp, Award, Clock, Tag, Star } from 'lucide-react';
import { useTheme } from '../../../shared/context/ThemeContext';

const StatisticsPanel = ({ notes, tags, favorites, deletedCount, onClose, onTagClick }) => {
    const { themeClasses, isMobile, isTablet } = useTheme();

    const totalNotes = notes.length;
    const totalWords = notes.reduce((acc, note) => 
        acc + (note.text?.split(/\s+/).filter(Boolean).length || 0), 0
    );
    
    const totalChars = notes.reduce((acc, note) => 
        acc + (note.text?.length || 0), 0
    );
    
    const avgWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
    
    const lastEdited = notes.length > 0 
        ? new Date(Math.max(...notes.map(n => {
            const dateStr = n.updated_at || n.created_at;
            if (!dateStr) return 0;
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? 0 : date.getTime();
          })))
        : null;

    const stats = [
        { icon: FileText, label: 'Всего', value: totalNotes, color: 'from-blue-500 to-blue-600' },
        { icon: Tag, label: 'Тегов', value: tags.length, color: 'from-green-500 to-green-600' },
        { icon: Star, label: 'Избранных', value: favorites.length, color: 'from-yellow-500 to-yellow-600' },
        { icon: Clock, label: 'В корзине', value: deletedCount, color: 'from-red-500 to-red-600' }
    ];

    return (
        <div className={`
            ${isMobile ? 'fixed inset-0 z-50' : 'relative w-64 md:w-72 lg:w-80'}
            ${themeClasses.colors.sidebar.bg}
            border-l ${themeClasses.colors.border.primary}
            flex flex-col animate-slide-left
        `}>
            {/* Заголовок */}
            <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${themeClasses.colors.border.primary}`}>
                <h2 className={`text-xs sm:text-sm font-medium ${themeClasses.colors.text.tertiary} uppercase tracking-wider`}>
                    Статистика
                </h2>
                <button
                    onClick={onClose}
                    className={`p-1.5 rounded-lg ${themeClasses.colors.bg.hover}`}
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Контент */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl ${themeClasses.colors.bg.secondary}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs ${themeClasses.colors.text.tertiary} mb-1`}>{stat.label}</p>
                                        <p className={`text-lg sm:text-xl font-semibold ${themeClasses.colors.text.primary}`}>
                                            {stat.value}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-lg bg-linear-to-r ${stat.color} bg-opacity-10`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Популярные теги */}
                {tags.length > 0 && (
                    <div className="mt-4 sm:mt-6">
                        <h3 className={`text-xs font-medium ${themeClasses.colors.text.tertiary} uppercase tracking-wider mb-2 sm:mb-3`}>
                            Популярные теги
                        </h3>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                            {tags.slice(0, 8).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => onTagClick(tag)}
                                    className={`px-2 py-1 text-xs rounded-lg ${themeClasses.colors.bg.tertiary} hover:bg-opacity-80 transition-colors`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Общая статистика */}
                <div className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg sm:rounded-xl ${themeClasses.colors.bg.secondary}`}>
                    <h3 className={`text-xs font-medium ${themeClasses.colors.text.tertiary} mb-3`}>
                        Детали
                    </h3>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className={themeClasses.colors.text.tertiary}>Всего символов</span>
                            <span className={themeClasses.colors.text.primary}>{totalChars.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className={themeClasses.colors.text.tertiary}>Слов в среднем</span>
                            <span className={themeClasses.colors.text.primary}>{avgWordsPerNote}</span>
                        </div>
                        {lastEdited && lastEdited.getTime() > 0 && (
                            <div className="flex justify-between">
                                <span className={themeClasses.colors.text.tertiary}>Последнее</span>
                                <span className={themeClasses.colors.text.primary}>
                                    {lastEdited.toLocaleDateString('ru-RU', { 
                                        day: 'numeric', 
                                        month: 'short' 
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticsPanel;